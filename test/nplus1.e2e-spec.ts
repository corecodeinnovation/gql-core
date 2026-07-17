// Guardia de N+1: cuenta las queries SQL que emite Prisma para las dos
// relaciones batcheables. Los umbrales asumen DataLoader activo; la línea
// base naive está documentada en el deep-dive de _aprendizaje.
process.env.DATABASE_URL ??= "postgresql://gql:gql@localhost:5434/gqlcore";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("N+1 (conteo de queries SQL)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const countQueries = async (query: string): Promise<number> => {
    const before = prisma.queryCount;
    const res = await request(app.getHttpServer() as App)
      .post("/graphql")
      .send({ query })
      .expect(200);
    const body = res.body as { errors?: unknown };
    expect(body.errors).toBeUndefined();
    return prisma.queryCount - before;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("projects(12) → tickets(5) anidados", async () => {
    const n = await countQueries(
      `{ projects(first: 12) { edges { node { id tickets(first: 5) { totalCount edges { node { id } } } } } totalCount } }`,
    );
    console.log(`[bench] projects(12)+tickets anidados: ${n} queries SQL`);
    expect(n).toBeLessThanOrEqual(6);
  });

  it("tickets(50) → project anidado", async () => {
    const n = await countQueries(
      `{ tickets(first: 50) { edges { node { id project { id name } } } totalCount } }`,
    );
    console.log(`[bench] tickets(50)+project anidado: ${n} queries SQL`);
    expect(n).toBeLessThanOrEqual(5);
  });
});
