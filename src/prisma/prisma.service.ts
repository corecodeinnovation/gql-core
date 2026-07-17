import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, "query">
  implements OnModuleInit, OnModuleDestroy
{
  /** contador de queries SQL emitidas; lo usa el benchmark/guardia de N+1 */
  queryCount = 0;

  constructor() {
    super({ log: [{ emit: "event", level: "query" }] });
    this.$on("query", () => {
      this.queryCount++;
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
