import {
  buildConnection,
  decodeCursor,
  DEFAULT_PAGE_SIZE,
  encodeCursor,
  MAX_PAGE_SIZE,
  pageSize,
} from "./pagination";

describe("pageSize", () => {
  it("usa el default cuando first no viene", () => {
    expect(pageSize(undefined)).toBe(DEFAULT_PAGE_SIZE);
    expect(pageSize(null)).toBe(DEFAULT_PAGE_SIZE);
  });

  it("acota first al rango [1, MAX]", () => {
    expect(pageSize(0)).toBe(1);
    expect(pageSize(-5)).toBe(1);
    expect(pageSize(7)).toBe(7);
    expect(pageSize(10_000)).toBe(MAX_PAGE_SIZE);
  });
});

describe("cursores", () => {
  it("encode/decode es un roundtrip", () => {
    const cursor = encodeCursor("cku123abc");
    expect(decodeCursor(cursor)).toBe("cku123abc");
  });

  it("es opaco (no expone el id en claro)", () => {
    expect(encodeCursor("cku123abc")).not.toContain("cku123abc");
  });

  it("rechaza cursores malformados", () => {
    expect(decodeCursor("no-es-base64-valido!!")).toBeNull();
    expect(decodeCursor(Buffer.from("otra-cosa", "utf8").toString("base64url"))).toBeNull();
    expect(decodeCursor(Buffer.from("c:", "utf8").toString("base64url"))).toBeNull();
  });
});

describe("buildConnection", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `id-${i}` }));

  it("detecta página siguiente con la fila extra y la descarta", () => {
    const conn = buildConnection(rows(4), 3, null, 10);
    expect(conn.edges).toHaveLength(3);
    expect(conn.pageInfo.hasNextPage).toBe(true);
    expect(conn.totalCount).toBe(10);
  });

  it("sin fila extra no hay página siguiente", () => {
    const conn = buildConnection(rows(3), 3, null, 3);
    expect(conn.edges).toHaveLength(3);
    expect(conn.pageInfo.hasNextPage).toBe(false);
  });

  it("marca hasPreviousPage solo cuando se paginó con after", () => {
    expect(buildConnection(rows(1), 3, null, 1).pageInfo.hasPreviousPage).toBe(false);
    expect(buildConnection(rows(1), 3, "algún-cursor", 1).pageInfo.hasPreviousPage).toBe(true);
  });

  it("expone start/endCursor coherentes con los edges", () => {
    const conn = buildConnection(rows(2), 3, null, 2);
    expect(conn.pageInfo.startCursor).toBe(conn.edges[0].cursor);
    expect(conn.pageInfo.endCursor).toBe(conn.edges[1].cursor);
    expect(decodeCursor(conn.pageInfo.endCursor as string)).toBe("id-1");
  });

  it("connection vacía: cursores nulos", () => {
    const conn = buildConnection([], 3, null, 0);
    expect(conn.edges).toHaveLength(0);
    expect(conn.pageInfo.startCursor).toBeNull();
    expect(conn.pageInfo.endCursor).toBeNull();
  });
});
