// Mutations con union types: un test por cada rama del resultado.
process.env.DATABASE_URL ??= "postgresql://gql:gql@localhost:5434/gqlcore";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types";
import { AppModule } from "../src/app.module";

type Result = Record<string, unknown> & { __typename: string };

describe("Mutations (e2e, union types de error)", () => {
  let app: INestApplication;
  let projectId: string;

  const gql = async (query: string): Promise<Record<string, Result>> => {
    const res = await request(app.getHttpServer() as App)
      .post("/graphql")
      .send({ query })
      .expect(200);
    const body = res.body as { errors?: unknown; data?: Record<string, Result> };
    expect(body.errors).toBeUndefined();
    if (!body.data) throw new Error("respuesta sin data");
    return body.data;
  };

  const createTicket = async (title: string): Promise<Result> => {
    const { createTicket: result } = await gql(
      `mutation { createTicket(input: { projectId: "${projectId}", title: "${title}" }) {
        __typename
        ... on Ticket { id status priority }
        ... on ValidationError { field message }
        ... on NotFoundError { id message }
      } }`,
    );
    return result;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    const { createProject } = await gql(
      `mutation { createProject(input: { name: "Proyecto mutations e2e" }) {
        __typename
        ... on Project { id }
      } }`,
    );
    expect(createProject.__typename).toBe("Project");
    projectId = createProject.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it("createProject: nombre corto → ValidationError con field", async () => {
    const { createProject } = await gql(
      `mutation { createProject(input: { name: "ab" }) {
        __typename
        ... on ValidationError { field message }
      } }`,
    );
    expect(createProject.__typename).toBe("ValidationError");
    expect(createProject.field).toBe("name");
  });

  it("createTicket: camino feliz → Ticket con defaults", async () => {
    const result = await createTicket("Ticket válido de prueba");
    expect(result.__typename).toBe("Ticket");
    expect(result.status).toBe("OPEN");
    expect(result.priority).toBe("MEDIUM");
  });

  it("createTicket: título corto → ValidationError", async () => {
    const result = await createTicket("abc");
    expect(result.__typename).toBe("ValidationError");
    expect(result.field).toBe("title");
  });

  it("createTicket: proyecto inexistente → NotFoundError con el id", async () => {
    const { createTicket: result } = await gql(
      `mutation { createTicket(input: { projectId: "no-existe-123", title: "Título válido" }) {
        __typename
        ... on NotFoundError { id message }
      } }`,
    );
    expect(result.__typename).toBe("NotFoundError");
    expect(result.id).toBe("no-existe-123");
  });

  it("changeTicketStatus: transición válida OPEN → IN_PROGRESS", async () => {
    const ticket = await createTicket("Ticket para transición válida");
    const { changeTicketStatus: result } = await gql(
      `mutation { changeTicketStatus(input: { ticketId: "${ticket.id as string}", status: IN_PROGRESS }) {
        __typename
        ... on Ticket { status }
      } }`,
    );
    expect(result.__typename).toBe("Ticket");
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("changeTicketStatus: CLOSED es terminal → InvalidStatusTransitionError", async () => {
    const ticket = await createTicket("Ticket para transición inválida");
    const id = ticket.id as string;
    await gql(
      `mutation { changeTicketStatus(input: { ticketId: "${id}", status: CLOSED }) { __typename } }`,
    );
    const { changeTicketStatus: result } = await gql(
      `mutation { changeTicketStatus(input: { ticketId: "${id}", status: OPEN }) {
        __typename
        ... on InvalidStatusTransitionError { from to message }
      } }`,
    );
    expect(result.__typename).toBe("InvalidStatusTransitionError");
    expect(result.from).toBe("CLOSED");
    expect(result.to).toBe("OPEN");
  });

  it("changeTicketStatus: ticket inexistente → NotFoundError", async () => {
    const { changeTicketStatus: result } = await gql(
      `mutation { changeTicketStatus(input: { ticketId: "nope", status: CLOSED }) {
        __typename
        ... on NotFoundError { id }
      } }`,
    );
    expect(result.__typename).toBe("NotFoundError");
    expect(result.id).toBe("nope");
  });
});
