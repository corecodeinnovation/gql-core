import { IncomingMessage } from "http";
import * as jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

// El JWT lo emite cci-auth-service; aquí SOLO se valida.
// Producción: firma RS256 verificada contra AUTH_JWKS_URL.
// Dev/test/CI: si existe AUTH_JWT_SECRET se valida HS256 (tokens de prueba,
// mitigación hasta que cci-auth-service esté desplegado).
export interface AuthUser {
  sub: string;
  roles: string[];
}

let jwksClient: JwksClient | null = null;

function getJwksClient(): JwksClient | null {
  const jwksUri = process.env.AUTH_JWKS_URL;
  if (!jwksUri) return null;
  jwksClient ??= new JwksClient({ jwksUri, cache: true });
  return jwksClient;
}

function extractToken(
  req?: IncomingMessage,
  connectionParams?: Record<string, unknown>,
): string | null {
  const raw =
    req?.headers?.authorization ??
    (typeof connectionParams?.Authorization === "string" ? connectionParams.Authorization : null);
  if (!raw?.startsWith("Bearer ")) return null;
  return raw.slice("Bearer ".length);
}

function verifyToken(token: string): Promise<jwt.JwtPayload> {
  const secret = process.env.AUTH_JWT_SECRET;
  if (secret) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, { algorithms: ["HS256"] }, (err, decoded) =>
        err || typeof decoded === "string" || !decoded ? reject(err ?? new Error("payload inválido")) : resolve(decoded),
      );
    });
  }
  const client = getJwksClient();
  if (!client) return Promise.reject(new Error("auth no configurada (AUTH_JWKS_URL/AUTH_JWT_SECRET)"));
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid, (err, key) =>
          err || !key ? callback(err ?? new Error("clave no encontrada")) : callback(null, key.getPublicKey()),
        );
      },
      { algorithms: ["RS256"] },
      (err, decoded) =>
        err || typeof decoded === "string" || !decoded ? reject(err ?? new Error("payload inválido")) : resolve(decoded),
    );
  });
}

// Token ausente o inválido → anónimo (null): las queries públicas siguen
// funcionando y la directiva @auth decide dónde exigir identidad.
export async function authenticate(
  req?: IncomingMessage,
  connectionParams?: Record<string, unknown>,
): Promise<AuthUser | null> {
  const token = extractToken(req, connectionParams);
  if (!token) return null;
  try {
    const payload = await verifyToken(token);
    if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
    const roles = Array.isArray(payload.roles)
      ? payload.roles.filter((r): r is string => typeof r === "string")
      : [];
    return { sub: payload.sub, roles };
  } catch {
    return null;
  }
}
