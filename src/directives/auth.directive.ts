import { getDirective, MapperKind, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLError, GraphQLSchema } from "graphql";
import { GqlContext } from "../common/context";

// Aplica @auth y @role del SDL envolviendo los resolvers de los campos
// marcados. Errores de authn/authz como GraphQLError estándar (no union):
// son de transporte, no del dominio.
export function applyAuthDirectives(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig, _fieldName, _typeName, currentSchema) => {
      const hasAuth = Boolean(getDirective(currentSchema, fieldConfig, "auth")?.[0]);
      const roleArgs = getDirective(currentSchema, fieldConfig, "role")?.[0] as
        | { role?: string }
        | undefined;
      if (!hasAuth && !roleArgs) return fieldConfig;

      const { resolve = defaultFieldResolver } = fieldConfig;
      fieldConfig.resolve = (source, args, context: GqlContext, info) => {
        const user = context.user;
        if (!user) {
          throw new GraphQLError("Autenticación requerida", {
            extensions: { code: "UNAUTHENTICATED" },
          });
        }
        if (roleArgs?.role && !user.roles.includes(roleArgs.role)) {
          throw new GraphQLError(`Se requiere el rol ${roleArgs.role}`, {
            extensions: { code: "FORBIDDEN" },
          });
        }
        return resolve(source, args, context, info);
      };
      return fieldConfig;
    },
  });
}
