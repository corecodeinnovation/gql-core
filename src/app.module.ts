import { Module } from "@nestjs/common";
import { GraphQLISODateTime, GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { GqlContext } from "./common/context";
import { createLoaders } from "./loaders/loaders";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectResolver } from "./resolvers/project.resolver";
import { TicketResolver } from "./resolvers/ticket.resolver";
import { ServicesModule } from "./services/services.module";
import { ProjectsService } from "./services/projects.service";
import { TicketsService } from "./services/tickets.service";

// Previsto: AuthDirective @auth/@role vía JWT de cci-auth-service (F4) y
// complexity/depth limiting (F3).
@Module({
  imports: [
    PrismaModule,
    ServicesModule,
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ServicesModule],
      inject: [ProjectsService, TicketsService],
      useFactory: (projectsService: ProjectsService, ticketsService: TicketsService) => ({
        // Schema-first: el SDL es la fuente de verdad. En build, nest-cli copia
        // los .graphql a dist (assets), por eso __dirname funciona en dev y prod.
        typePaths: [join(__dirname, "**/*.graphql")],
        resolvers: { DateTime: GraphQLISODateTime },
        playground: true,
        // loaders nuevos POR REQUEST: jamás compartir la caché entre requests
        context: (): GqlContext => ({ loaders: createLoaders(projectsService, ticketsService) }),
      }),
    }),
  ],
  providers: [ProjectResolver, TicketResolver],
})
export class AppModule {}
