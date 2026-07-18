// Auth por directivas @auth/@role: tokens HS256 de prueba (AUTH_JWT_SECRET),
// misma verificación que usará el JWKS de cci-auth-service en producción.
process.env.DATABASE_URL ??= "postgresql://gql:gql@localhost:5434/gqlcore";
process.env.AUTH_JWT_SECRET ??= "gql-core-e2e-secret";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import jwt from "jsonwebtoken";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

const SECRET = process.env.AUTH_JWT_SECRET;
const userToken = jwt.sign({ roles: ["USER"] }, SECRET, { subject: "e2e|user-auth" });
const adminToken = jwt.sign({ roles: ["USER", "ADMIN"] }, SECRET, { subject: "e2e|admin-auth" });

interface GqlError {
  message: string;
  extensions?: { code?: string };
}
type Result = Record<string, unknown> & { __typename?: string };

describe("Auth @auth/@role (e2e)", () => {
  let app: INestApplication;
  let projectId: string;

  const gql = async (query: string, token?: string) => {
    let req = request(app.getHttpServer() as App).post("/graphql");
    if (token) req = req.set("Authorization", `Bearer ${token}`);
    const res = await req.send({ query }).expect(200);
    return res.body as { errors?: GqlError[]; data?: Record<string, Result | null> };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const { data } = await gql(
      `mutation { createProject(input: { name: "Proyecto auth e2e" }) { __typename ... on Project { id } } }`,
      userToken,
    );
    projectId = data?.createProject?.id as string;
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 30000);

  it("mutation sin token → UNAUTHENTICATED", async () => {
    const body = await gql(
      `mutation { createProject(input: { name: "Sin token" }) { __typename } }`,
    );
    expect(body.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
    expect(body.data?.createProject ?? null).toBeNull();
  });

  it("mutation con token inválido → UNAUTHENTICATED", async () => {
    const forged = jwt.sign({ roles: ["USER"] }, "otro-secreto", { subject: "e2e|intruso" });
    const body = await gql(
      `mutation { createProject(input: { name: "Token falso" }) { __typename } }`,
      forged,
    );
    expect(body.errors?.[0].extensions?.code).toBe("UNAUTHENTICATED");
  });

  it("mutation con token USER → Ticket con authorSub del JWT", async () => {
    const { errors, data } = await gql(
      `mutation { createTicket(input: { projectId: "${projectId}", title: "Ticket con autor del JWT" }) {
        __typename ... on Ticket { id authorSub }
      } }`,
      userToken,
    );
    expect(errors).toBeUndefined();
    expect(data?.createTicket?.__typename).toBe("Ticket");
    expect(data?.createTicket?.authorSub).toBe("e2e|user-auth");
  });

  it("deleteTicket con USER → FORBIDDEN (requiere ADMIN)", async () => {
    const body = await gql(`mutation { deleteTicket(id: "cualquiera") { __typename } }`, userToken);
    expect(body.errors?.[0].extensions?.code).toBe("FORBIDDEN");
  });

  it("deleteTicket con ADMIN → Ticket, y el id deja de existir", async () => {
    const { data: created } = await gql(
      `mutation { createTicket(input: { projectId: "${projectId}", title: "Ticket para borrar" }) {
        __typename ... on Ticket { id }
      } }`,
      adminToken,
    );
    const ticketId = created?.createTicket?.id as string;

    const { errors, data } = await gql(
      `mutation { deleteTicket(id: "${ticketId}") { __typename ... on Ticket { id } } }`,
      adminToken,
    );
    expect(errors).toBeUndefined();
    expect(data?.deleteTicket?.__typename).toBe("Ticket");

    const { data: again } = await gql(
      `mutation { deleteTicket(id: "${ticketId}") { __typename ... on NotFoundError { id } } }`,
      adminToken,
    );
    expect(again?.deleteTicket?.__typename).toBe("NotFoundError");
  });

  it("las queries de lectura siguen siendo públicas (sin token)", async () => {
    const { errors, data } = await gql(`{ projects(first: 1) { totalCount } }`);
    expect(errors).toBeUndefined();
    expect(data?.projects).toBeDefined();
  });
});
