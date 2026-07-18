import { ApolloServerPlugin, GraphQLRequestListener } from "@apollo/server";
import { Plugin } from "@nestjs/apollo";
import { GraphQLSchemaHost } from "@nestjs/graphql";
import { GraphQLError } from "graphql";
import { getComplexity, simpleEstimator } from "graphql-query-complexity";

// Cada campo suma 1 (simpleEstimator): una query con cientos de campos/aliases
// supera el presupuesto y se corta ANTES de ejecutar resolvers. La introspección
// (Playground) se excluye.
@Plugin()
export class ComplexityPlugin implements ApolloServerPlugin {
  constructor(private readonly gqlSchemaHost: GraphQLSchemaHost) {}

  // eslint-disable-next-line @typescript-eslint/require-await -- la interfaz de Apollo exige Promise
  async requestDidStart(): Promise<GraphQLRequestListener<Record<string, unknown>>> {
    const maxComplexity = Number(process.env.GRAPHQL_MAX_COMPLEXITY ?? 100);
    const { schema } = this.gqlSchemaHost;

    return {
      // eslint-disable-next-line @typescript-eslint/require-await
      didResolveOperation: async ({ request, document }) => {
        if (request.operationName === "IntrospectionQuery") return;
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [simpleEstimator({ defaultComplexity: 1 })],
        });
        if (complexity > maxComplexity) {
          throw new GraphQLError(
            `Query rechazada: complejidad ${complexity} supera el máximo permitido (${maxComplexity})`,
            { extensions: { code: "QUERY_TOO_COMPLEX" } },
          );
        }
      },
    };
  }
}
