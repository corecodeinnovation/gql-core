import { Module } from "@nestjs/common";
import { GraphQLISODateTime, GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectResolver } from "./resolvers/project.resolver";
import { TicketResolver } from "./resolvers/ticket.resolver";
import { ProjectsService } from "./services/projects.service";
import { TicketsService } from "./services/tickets.service";

// Previsto: DataLoader por request (F2), AuthDirective @auth/@role vía JWT de
// cci-auth-service (F4) y complexity/depth limiting (F3).
@Module({
  imports: [
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Schema-first: el SDL es la fuente de verdad. En build, nest-cli copia
      // los .graphql a dist (assets), por eso __dirname funciona en dev y prod.
      typePaths: [join(__dirname, "**/*.graphql")],
      resolvers: { DateTime: GraphQLISODateTime },
      playground: true,
    }),
  ],
  providers: [ProjectsService, TicketsService, ProjectResolver, TicketResolver],
})
export class AppModule {}
