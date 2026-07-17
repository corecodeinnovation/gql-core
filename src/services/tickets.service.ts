import { Injectable } from "@nestjs/common";
import { Prisma, Ticket } from "@prisma/client";
import {
  invalidStatusTransitionError,
  InvalidStatusTransitionErrorResult,
  notFoundError,
  NotFoundErrorResult,
  validationError,
  ValidationErrorResult,
} from "../common/errors";
import { buildConnection, Connection, decodeCursor, pageSize } from "../common/pagination";
import {
  ChangeTicketStatusInput,
  CreateTicketInput,
  TicketFilter,
  TicketOrder,
  TicketStatus,
} from "../generated/graphql";
import { PrismaService } from "../prisma/prisma.service";

type TaggedTicket = { __typename: "Ticket" } & Ticket;
export type CreateTicketResult = TaggedTicket | ValidationErrorResult | NotFoundErrorResult;
export type ChangeTicketStatusResult =
  | TaggedTicket
  | NotFoundErrorResult
  | InvalidStatusTransitionErrorResult;

// Ciclo de vida del ticket; CLOSED es terminal (sin reopen en v1)
const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["DONE", "CLOSED", "OPEN"],
  DONE: ["CLOSED"],
  CLOSED: [],
};

export interface NestedTicketArgs {
  first?: number | null;
  filter?: TicketFilter | null;
  orderBy?: TicketOrder | null;
}

export interface TicketConnectionArgs extends NestedTicketArgs {
  after?: string | null;
  /** restringe la connection a un proyecto (field resolver Project.tickets) */
  projectId?: string;
}

const ORDER_FIELD: Record<string, keyof Prisma.TicketOrderByWithRelationInput> = {
  CREATED_AT: "createdAt",
  PRIORITY: "priority",
  TITLE: "title",
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async connection(args: TicketConnectionArgs): Promise<Connection<Ticket>> {
    const size = pageSize(args.first);
    const afterId = args.after ? decodeCursor(args.after) : null;
    const where = this.where(args.filter, args.projectId);
    const [rows, totalCount] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: this.orderBy(args.orderBy),
        take: size + 1,
        ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return buildConnection(rows, size, args.after, totalCount);
  }

  // Batch para DataLoader: resuelve las connections de N proyectos con 2 queries
  // (findMany con projectId IN + groupBy para los totalCount) en lugar de 2N.
  // Trae los tickets completos de los proyectos pedidos y corta en memoria:
  // con el volumen por proyecto de este dominio es más simple que una window
  // function y el benchmark lo respalda.
  async connectionsForProjects(
    projectIds: readonly string[],
    args: NestedTicketArgs,
  ): Promise<Connection<Ticket>[]> {
    const size = pageSize(args.first);
    const ids = [...projectIds];
    const where = { ...this.where(args.filter), projectId: { in: ids } };
    const [rows, counts] = await Promise.all([
      this.prisma.ticket.findMany({ where, orderBy: this.orderBy(args.orderBy) }),
      this.prisma.ticket.groupBy({ by: ["projectId"], where, _count: { _all: true } }),
    ]);

    const byProject = new Map<string, Ticket[]>(ids.map((id) => [id, []]));
    for (const row of rows) byProject.get(row.projectId)?.push(row);
    const totals = new Map(counts.map((c) => [c.projectId, c._count._all]));

    // el orden global se preserva dentro de cada grupo; take size+1 como en el camino normal
    return ids.map((id) =>
      buildConnection((byProject.get(id) ?? []).slice(0, size + 1), size, null, totals.get(id) ?? 0),
    );
  }

  async create(input: CreateTicketInput): Promise<CreateTicketResult> {
    const title = input.title.trim();
    if (title.length < 5) {
      return validationError("title", "El título debe tener al menos 5 caracteres");
    }
    const project = await this.prisma.project.findUnique({ where: { id: input.projectId } });
    if (!project) {
      return notFoundError(input.projectId, "El proyecto no existe");
    }
    const ticket = await this.prisma.ticket.create({
      data: {
        title,
        description: input.description ?? null,
        priority: input.priority ?? "MEDIUM",
        projectId: input.projectId,
        // authorSub llega con la integración de auth (F4)
      },
    });
    return { __typename: "Ticket", ...ticket };
  }

  async changeStatus(input: ChangeTicketStatusInput): Promise<ChangeTicketStatusResult> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: input.ticketId } });
    if (!ticket) {
      return notFoundError(input.ticketId, "El ticket no existe");
    }
    if (!TRANSITIONS[ticket.status].includes(input.status)) {
      return invalidStatusTransitionError(ticket.status, input.status);
    }
    const updated = await this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: input.status },
    });
    return { __typename: "Ticket", ...updated };
  }

  private orderBy(order?: TicketOrder | null): Prisma.TicketOrderByWithRelationInput[] {
    const direction = order?.direction === "ASC" ? "asc" : "desc";
    const field = ORDER_FIELD[order?.field ?? "CREATED_AT"];
    // el id como desempate mantiene el keyset estable ante valores repetidos
    return [{ [field]: direction }, { id: direction }] as Prisma.TicketOrderByWithRelationInput[];
  }

  private where(filter?: TicketFilter | null, projectId?: string): Prisma.TicketWhereInput {
    return {
      ...(projectId ? { projectId } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.priority ? { priority: filter.priority } : {}),
      ...(filter?.search ? { title: { contains: filter.search, mode: "insensitive" } } : {}),
    };
  }
}
