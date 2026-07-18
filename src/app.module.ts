import { Module } from "@nestjs/common";
import { GraphQLISODateTime, GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { IncomingMessage } from "http";
import { join } from "path";
import { authenticate } from "./auth/auth.context";
import { GqlContext } from "./common/context";
import { applyAuthDirectives } from "./directives/auth.directive";
import { ComplexityPlugin } from "./guardrails/complexity.plugin";
import { createDepthLimitRule } from "./guardrails/depth-limit.rule";
import { HealthController } from "./health/health.controller";
import { createLoaders } from "./loaders/loaders";
import { PrismaModule } from "./prisma/prisma.module";
import { PubSubModule } from "./pubsub/pubsub.module";
import { ProjectResolver } from "./resolvers/project.resolver";
import { SubscriptionResolver } from "./resolvers/subscription.resolver";
import { TicketResolver } from "./resolvers/ticket.resolver";
import { ServicesModule } from "./services/services.module";
import { ProjectsService } from "./services/projects.service";
import { TicketsService } from "./services/tickets.service";

interface ContextArgs {
  req?: IncomingMessage;
  connectionParams?: Record<string, unknown>;
}

@Module({
  imports: [
    PrismaModule,
    PubSubModule,
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
        // aplica @auth/@role del SDL envolviendo los resolvers marcados
        transformSchema: applyAuthDirectives,
        playground: true,
        // protocolo moderno de subscriptions; el legacy queda deshabilitado
        subscriptions: { "graphql-ws": true },
        validationRules: [createDepthLimitRule(Number(process.env.GRAPHQL_MAX_DEPTH ?? 8))],
        // loaders nuevos POR REQUEST (jamás compartir la caché) + identidad del JWT
        context: async ({ req, connectionParams }: ContextArgs): Promise<GqlContext> => ({
          loaders: createLoaders(projectsService, ticketsService),
          user: await authenticate(req, connectionParams),
        }),
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [ProjectResolver, TicketResolver, SubscriptionResolver, ComplexityPlugin],
})
export class AppModule {}
