import {
  ASTVisitor,
  FragmentDefinitionNode,
  GraphQLError,
  Kind,
  SelectionSetNode,
  ValidationContext,
  ValidationRule,
} from "graphql";

// Regla de validación propia: limita la profundidad de selección ignorando la
// introspección (campos __*), para no romper el Playground, y expandiendo
// fragments nombrados (NoFragmentCycles de graphql-js evita la recursión infinita).
export function createDepthLimitRule(maxDepth: number): ValidationRule {
  return (context: ValidationContext): ASTVisitor => ({
    OperationDefinition(node) {
      const depth = measure(node.selectionSet, 0, context);
      if (depth > maxDepth) {
        context.reportError(
          new GraphQLError(
            `Query rechazada: profundidad ${depth} supera el máximo permitido (${maxDepth})`,
            { nodes: [node], extensions: { code: "QUERY_TOO_DEEP" } },
          ),
        );
      }
    },
  });
}

function measure(
  selectionSet: SelectionSetNode,
  current: number,
  context: ValidationContext,
): number {
  let max = current;
  for (const selection of selectionSet.selections) {
    switch (selection.kind) {
      case Kind.FIELD: {
        if (selection.name.value.startsWith("__")) break;
        const depth = selection.selectionSet
          ? measure(selection.selectionSet, current + 1, context)
          : current + 1;
        max = Math.max(max, depth);
        break;
      }
      case Kind.INLINE_FRAGMENT:
        max = Math.max(max, measure(selection.selectionSet, current, context));
        break;
      case Kind.FRAGMENT_SPREAD: {
        const fragment: FragmentDefinitionNode | undefined | null = context.getFragment(
          selection.name.value,
        );
        if (fragment) max = Math.max(max, measure(fragment.selectionSet, current, context));
        break;
      }
    }
  }
  return max;
}
