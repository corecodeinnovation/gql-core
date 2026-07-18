// Requiere Postgres con migraciones y seed aplicados (docker compose up -d db;
// npm run db:migrate && npm run db:seed). En CI lo provee el service container.
process.env.DATABASE_URL ??= "postgresql://gql:gql@localhost:5434/gqlcore";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

interface Edge {
  node: {
    id: string;
    name?: string;
    status?: string;
    createdAt?: string;
    totalCount?: number;
  };
  cursor: string;
}
interface Connection {
  edges: Edge[];
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
  totalCount: number;
}

describe("Queries GraphQL (e2e, sobre seed)", () => {
  let app: INestApplication;

  const gql = async (query: string): Promise<Record<string, Connection>> => {
    const res = await request(app.getHttpServer() as App)
      .post("/graphql")
      .send({ query })
      .expect(200);
    const body = res.body as { errors?: unknown; data?: Record<string, Connection> };
    expect(body.errors).toBeUndefined();
    if (!body.data) throw new Error("respuesta sin data");
    return body.data;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  }, 30000);

  it("projects: primera página Relay con totalCount", async () => {
    const { projects } = await gql(
      `{ projects(first: 5) { edges { node { id name } cursor } pageInfo { hasNextPage hasPreviousPage endCursor } totalCount } }`,
    );
    expect(projects.edges).toHaveLength(5);
    expect(projects.totalCount).toBeGreaterThanOrEqual(20);
    expect(projects.pageInfo.hasNextPage).toBe(true);
    expect(projects.pageInfo.hasPreviousPage).toBe(false);
    expect(projects.pageInfo.endCursor).toBeTruthy();
  });

  it("projects: la segunda página no repite elementos de la primera", async () => {
    const { projects: page1 } = await gql(
      `{ projects(first: 5) { edges { node { id } } pageInfo { endCursor } } }`,
    );
    const cursor = page1.pageInfo.endCursor as string;
    const { projects: page2 } = await gql(
      `{ projects(first: 5, after: "${cursor}") { edges { node { id } } pageInfo { hasPreviousPage } } }`,
    );
    const ids1 = new Set(page1.edges.map((e) => e.node.id));
    expect(page2.edges).toHaveLength(5);
    expect(page2.edges.every((e) => !ids1.has(e.node.id))).toBe(true);
    expect(page2.pageInfo.hasPreviousPage).toBe(true);
  });

  it("tickets: el filtro por status se respeta y reduce el totalCount", async () => {
    const { tickets: all } = await gql(`{ tickets(first: 1) { totalCount edges { cursor } } }`);
    const { tickets: open } = await gql(
      `{ tickets(first: 50, filter: { status: OPEN }) { edges { node { status } } totalCount } }`,
    );
    expect(open.edges.length).toBeGreaterThan(0);
    expect(open.edges.every((e) => e.node.status === "OPEN")).toBe(true);
    expect(open.totalCount).toBeLessThan(all.totalCount);
  });

  it("tickets: orderBy CREATED_AT ASC devuelve createdAt ascendente", async () => {
    const { tickets } = await gql(
      `{ tickets(first: 20, orderBy: { field: CREATED_AT, direction: ASC }) { edges { node { createdAt } } } }`,
    );
    const dates = tickets.edges.map((e) => new Date(e.node.createdAt as string).getTime());
    const sorted = [...dates].sort((a, b) => a - b);
    expect(dates).toEqual(sorted);
  });

  it("projects: connection anidada de tickets por proyecto", async () => {
    // orden ASC: los más antiguos son los del seed (20–30 tickets garantizados),
    // inmune a proyectos creados por los tests de mutations
    const data = await gql(
      `{ projects(first: 3, orderBy: { field: CREATED_AT, direction: ASC }) { edges { node { id tickets(first: 4) { edges { node { id } } totalCount } } } } }`,
    );
    const projects = data.projects as unknown as {
      edges: { node: { tickets: Connection } }[];
    };
    expect(projects.edges).toHaveLength(3);
    for (const { node } of projects.edges) {
      expect(node.tickets.edges.length).toBeGreaterThan(0);
      expect(node.tickets.edges.length).toBeLessThanOrEqual(4);
      expect(node.tickets.totalCount).toBeGreaterThanOrEqual(20);
    }
  });

  it("tickets: search filtra por título (insensitive)", async () => {
    const { tickets } = await gql(
      `{ tickets(first: 30, filter: { search: "configurar" }) { edges { node { id } } totalCount } }`,
    );
    expect(tickets.totalCount).toBeGreaterThan(0);
  });
});
