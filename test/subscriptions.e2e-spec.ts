// Subscriptions sobre graphql-ws con un cliente WS real contra el server levantado.
process.env.DATABASE_URL ??= "postgresql://gql:gql@localhost:5434/gqlcore";

import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { Client, createClient } from "graphql-ws";
import { Server } from "http";
import { AddressInfo } from "net";
import request from "supertest";
import type { App } from "supertest/types";
import WebSocket from "ws";
import { AppModule } from "../src/app.module";

interface TicketPayload {
  id: string;
  title: string;
  status?: string;
  project?: { id: string };
}

describe("Subscriptions (e2e, graphql-ws)", () => {
  let app: INestApplication;
  let wsClient: Client;
  let projectId: string;
  let otherProjectId: string;

  const gql = async (query: string): Promise<Record<string, Record<string, unknown>>> => {
    const res = await request(app.getHttpServer() as App)
      .post("/graphql")
      .send({ query })
      .expect(200);
    const body = res.body as {
      errors?: unknown;
      data?: Record<string, Record<string, unknown>>;
    };
    expect(body.errors).toBeUndefined();
    if (!body.data) throw new Error("respuesta sin data");
    return body.data;
  };

  const createProject = async (name: string): Promise<string> => {
    const { createProject: p } = await gql(
      `mutation { createProject(input: { name: "${name}" }) { __typename ... on Project { id } } }`,
    );
    expect(p.__typename).toBe("Project");
    return p.id as string;
  };

  // se resuelve con el PRIMER evento; todo rechazo se normaliza a Error real
  // (graphql-ws emite CloseEvent, que rompe el formateo de errores de jest-circus)
  const firstEvent = <T>(query: string): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error("timeout esperando el evento de la subscription"));
      }, 10_000);
      const unsubscribe = wsClient.subscribe<Record<string, T>>(
        { query },
        {
          next: (value) => {
            clearTimeout(timer);
            unsubscribe();
            const data = value.data;
            if (!data) return reject(new Error("evento sin data"));
            resolve(Object.values(data)[0]);
          },
          error: (err) => {
            clearTimeout(timer);
            reject(err instanceof Error ? err : new Error(`ws error: ${JSON.stringify(err)}`));
          },
          complete: () => undefined,
        },
      );
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    const server = app.getHttpServer() as Server;
    const { port } = server.address() as AddressInfo;
    wsClient = createClient({
      url: `ws://127.0.0.1:${port}/graphql`,
      webSocketImpl: WebSocket,
      retryAttempts: 0,
    });
    projectId = await createProject("Proyecto subscriptions e2e");
    otherProjectId = await createProject("Proyecto ruido e2e");
  }, 30000);

  afterAll(async () => {
    try {
      await wsClient.dispose();
    } catch {
      // el cierre puede rechazar con CloseEvent si la conexión ya terminó
    }
    await app.close();
  }, 30000);

  it("ticketCreated llega al cliente WS al ejecutar la mutation", async () => {
    const eventPromise = firstEvent<TicketPayload>(
      `subscription { ticketCreated { id title status } }`,
    );
    await new Promise((r) => setTimeout(r, 300)); // deja establecer la subscription

    const { createTicket } = await gql(
      `mutation { createTicket(input: { projectId: "${projectId}", title: "Evento en vivo de prueba" }) {
        __typename ... on Ticket { id }
      } }`,
    );

    const event = await eventPromise;
    expect(event.id).toBe(createTicket.id);
    expect(event.title).toBe("Evento en vivo de prueba");
    expect(event.status).toBe("OPEN");
  }, 15000);

  it("el filtro por projectId descarta eventos de otros proyectos", async () => {
    const eventPromise = firstEvent<TicketPayload>(
      `subscription { ticketCreated(projectId: "${projectId}") { id project { id } } }`,
    );
    await new Promise((r) => setTimeout(r, 300));

    // primero ruido en otro proyecto, después el evento que sí debe llegar
    await gql(
      `mutation { createTicket(input: { projectId: "${otherProjectId}", title: "Ruido de otro proyecto" }) { __typename } }`,
    );
    const { createTicket } = await gql(
      `mutation { createTicket(input: { projectId: "${projectId}", title: "Evento filtrado correcto" }) {
        __typename ... on Ticket { id }
      } }`,
    );

    const event = await eventPromise;
    expect(event.id).toBe(createTicket.id);
    expect(event.project?.id).toBe(projectId);
  }, 15000);

  it("ticketStatusChanged emite al cambiar el status", async () => {
    const { createTicket } = await gql(
      `mutation { createTicket(input: { projectId: "${projectId}", title: "Ticket para status en vivo" }) {
        __typename ... on Ticket { id }
      } }`,
    );
    const ticketId = createTicket.id as string;

    const eventPromise = firstEvent<TicketPayload>(
      `subscription { ticketStatusChanged { id status } }`,
    );
    await new Promise((r) => setTimeout(r, 300));

    await gql(
      `mutation { changeTicketStatus(input: { ticketId: "${ticketId}", status: IN_PROGRESS }) { __typename } }`,
    );

    const event = await eventPromise;
    expect(event.id).toBe(ticketId);
    expect(event.status).toBe("IN_PROGRESS");
  }, 15000);
});
