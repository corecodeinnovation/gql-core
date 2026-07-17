import { Injectable } from "@nestjs/common";
import { Prisma, Ticket } from "@prisma/client";
import { buildConnection, Connection, decodeCursor, pageSize } from "../common/pagination";
import { TicketFilter, TicketOrder } from "../generated/graphql";
import { PrismaService } from "../prisma/prisma.service";

export interface TicketConnectionArgs {
  first?: number | null;
  after?: string | null;
  filter?: TicketFilter | null;
  orderBy?: TicketOrder | null;
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
    const where = this.where(args);
    const direction = args.orderBy?.direction === "ASC" ? "asc" : "desc";
    const field = ORDER_FIELD[args.orderBy?.field ?? "CREATED_AT"];
    const [rows, totalCount] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        // el id como desempate mantiene el keyset estable ante valores repetidos
        orderBy: [{ [field]: direction }, { id: direction }] as Prisma.TicketOrderByWithRelationInput[],
        take: size + 1,
        ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
      }),
      this.prisma.ticket.count({ where }),
    ]);
    return buildConnection(rows, size, args.after, totalCount);
  }

  private where(args: TicketConnectionArgs): Prisma.TicketWhereInput {
    const { filter, projectId } = args;
    return {
      ...(projectId ? { projectId } : {}),
      ...(filter?.status ? { status: filter.status } : {}),
      ...(filter?.priority ? { priority: filter.priority } : {}),
      ...(filter?.search ? { title: { contains: filter.search, mode: "insensitive" } } : {}),
    };
  }
}
