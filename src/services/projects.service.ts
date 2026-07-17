import { Injectable } from "@nestjs/common";
import { Prisma, Project } from "@prisma/client";
import { buildConnection, Connection, decodeCursor, pageSize } from "../common/pagination";
import { ProjectFilter, ProjectOrder } from "../generated/graphql";
import { PrismaService } from "../prisma/prisma.service";

export interface ProjectConnectionArgs {
  first?: number | null;
  after?: string | null;
  filter?: ProjectFilter | null;
  orderBy?: ProjectOrder | null;
}

const ORDER_FIELD: Record<string, keyof Prisma.ProjectOrderByWithRelationInput> = {
  CREATED_AT: "createdAt",
  NAME: "name",
};

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  byId(id: string): Promise<Project | null> {
    return this.prisma.project.findUnique({ where: { id } });
  }

  async connection(args: ProjectConnectionArgs): Promise<Connection<Project>> {
    const size = pageSize(args.first);
    const afterId = args.after ? decodeCursor(args.after) : null;
    const where = this.where(args.filter);
    const direction = args.orderBy?.direction === "ASC" ? "asc" : "desc";
    const field = ORDER_FIELD[args.orderBy?.field ?? "CREATED_AT"];
    const [rows, totalCount] = await Promise.all([
      this.prisma.project.findMany({
        where,
        // el id como desempate mantiene el keyset estable ante createdAt iguales
        orderBy: [{ [field]: direction }, { id: direction }] as Prisma.ProjectOrderByWithRelationInput[],
        take: size + 1,
        ...(afterId ? { cursor: { id: afterId }, skip: 1 } : {}),
      }),
      this.prisma.project.count({ where }),
    ]);
    return buildConnection(rows, size, args.after, totalCount);
  }

  private where(filter?: ProjectFilter | null): Prisma.ProjectWhereInput {
    return filter?.search ? { name: { contains: filter.search, mode: "insensitive" } } : {};
  }
}
