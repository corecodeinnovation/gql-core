// Paginación cursor-based estilo Relay. El cursor es opaco: base64url del id
// de la fila; Prisma lo resuelve como keyset (cursor + skip 1) junto al orderBy,
// que siempre lleva el id como desempate para ser estable ante empates.
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const CURSOR_PREFIX = "c:";

export interface Edge<T> {
  node: T;
  cursor: string;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface Connection<T> {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
}

export function pageSize(first?: number | null): number {
  if (first == null) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.max(first, 1), MAX_PAGE_SIZE);
}

export function encodeCursor(id: string): string {
  return Buffer.from(CURSOR_PREFIX + id, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): string | null {
  const decoded = Buffer.from(cursor, "base64url").toString("utf8");
  if (!decoded.startsWith(CURSOR_PREFIX)) return null;
  const id = decoded.slice(CURSOR_PREFIX.length);
  return id.length > 0 ? id : null;
}

// rows debe venir de un findMany con take = size + 1: la fila extra solo indica
// si existe página siguiente y se descarta.
export function buildConnection<T extends { id: string }>(
  rows: T[],
  size: number,
  after: string | null | undefined,
  totalCount: number,
): Connection<T> {
  const hasNextPage = rows.length > size;
  const nodes = hasNextPage ? rows.slice(0, size) : rows;
  const edges = nodes.map((node) => ({ node, cursor: encodeCursor(node.id) }));
  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage: Boolean(after),
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
    },
    totalCount,
  };
}
