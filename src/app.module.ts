import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { join } from "path";
import { ProjectResolver } from "./resolvers/project.resolver";

// Previsto: DataLoader por request, AuthDirective (@auth/@role vía JWT de
// cci-auth-service) y complexity/depth limiting.
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Schema-first: el SDL es la fuente de verdad. En build, nest-cli copia
      // los .graphql a dist (assets), por eso __dirname funciona en dev y prod.
      typePaths: [join(__dirname, "**/*.graphql")],
      playground: true,
    }),
  ],
  providers: [ProjectResolver],
})
export class AppModule {}
