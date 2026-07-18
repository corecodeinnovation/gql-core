// Seed de demo — idempotente: si ya hay datos, no hace nada (SEED_FORCE=1 lo fuerza).
// JS plano para poder ejecutarse igual en dev (prisma db seed) y en el contenedor.
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// LCG determinístico: mismo seed → mismos datos en cada entorno.
let state = 42;
function rand() {
  state = (state * 1664525 + 1013904223) % 4294967296;
  return state / 4294967296;
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));

const AREAS = ["auth", "dashboard", "taskforge", "gql", "web", "notify", "infra", "netprobe"];
const PROJECT_KINDS = ["API", "Panel", "Pipeline", "Migración", "Refactor", "Integración"];
const VERBS = ["Configurar", "Corregir", "Documentar", "Optimizar", "Implementar", "Revisar", "Actualizar"];
const THINGS = [
  "healthcheck de Postgres",
  "paginación del listado",
  "tokens de refresh",
  "logs estructurados",
  "límite de rate",
  "webhooks de despliegue",
  "métricas de latencia",
  "cache de queries",
  "validación de inputs",
  "cobertura de tests",
];
const STATUSES = ["OPEN", "IN_PROGRESS", "DONE", "CLOSED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

async function main() {
  const existing = await prisma.project.count();
  if (existing > 0 && !process.env.SEED_FORCE) {
    console.log(`seed: ${existing} proyectos existentes, omitido (SEED_FORCE=1 para regenerar)`);
    return;
  }
  await prisma.ticket.deleteMany();
  await prisma.project.deleteMany();

  const base = new Date("2026-01-05T09:00:00Z").getTime();
  let tick = 0;
  const nextDate = () => new Date(base + tick++ * 7 * 60 * 1000); // 7 min entre filas: createdAt únicos

  let tickets = 0;
  for (let p = 0; p < 24; p++) {
    const area = AREAS[p % AREAS.length];
    await prisma.project.create({
      data: {
        name: `${pick(PROJECT_KINDS)} ${area}-${String(p + 1).padStart(2, "0")}`,
        description: `Proyecto de demo del área ${area} (portfolio CCI).`,
        createdAt: nextDate(),
        tickets: {
          create: Array.from({ length: int(20, 30) }, () => {
            tickets++;
            return {
              title: `${pick(VERBS)} ${pick(THINGS)}`,
              status: pick(STATUSES),
              priority: pick(PRIORITIES),
              authorSub: `seed|user-${int(1, 8)}`,
              createdAt: nextDate(),
            };
          }),
        },
      },
    });
  }
  console.log(`seed: 24 proyectos, ${tickets} tickets`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
