// Guardrails: depth limiting (regla de validación) y complexity limiting (plugin).
process.env.DATABASE_URL ??= "postgresql://gql:gql@localhost:5434/gqlcore";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

interface GqlError {
  message: string;
  extensions?: { code?: string };
}

describe("Guardrails (e2e)", () => {
  let app: INestApplication;

  const post = async (query: string) => {
    const res = await request(app.getHttpServer() as App)
      .post("/graphql")
      .send({ query });
    return res.body as { errors?: GqlError[]; data?: unknown };
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("rechaza una query más profunda que GRAPHQL_MAX_DEPTH", async () => {
    // profundidad 9: projects>edges>node>tickets>edges>node>project>tickets>edges
    const body = await post(
      `{ projects(first: 1) { edges { node { tickets(first: 1) { edges { node { project { tickets(first: 1) { edges { cursor } } } } } } } } } }`,
    );
    expect(body.errors).toBeDefined();
    // Apollo etiqueta los errores de validación como GRAPHQL_VALIDATION_FAILED
    expect(body.errors?.[0].extensions?.code).toBe("GRAPHQL_VALIDATION_FAILED");
    expect(body.errors?.[0].message).toContain("profundidad");
  });

  it("rechaza una query con más complejidad que GRAPHQL_MAX_COMPLEXITY", async () => {
    // 60 aliases × 2 campos = 120 > 100
    const aliases = Array.from(
      { length: 60 },
      (_, i) => `a${i}: projects(first: 1) { totalCount }`,
    ).join(" ");
    const body = await post(`{ ${aliases} }`);
    expect(body.errors).toBeDefined();
    expect(body.errors?.[0].extensions?.code).toBe("QUERY_TOO_COMPLEX");
    expect(body.errors?.[0].message).toContain("complejidad");
  });

  it("una query legítima anidada sigue pasando", async () => {
    const body = await post(
      `{ projects(first: 2) { edges { node { tickets(first: 2) { edges { node { id } } } } } } }`,
    );
    expect(body.errors).toBeUndefined();
    expect(body.data).toBeDefined();
  });
});
