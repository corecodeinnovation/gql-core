import DataLoader from "dataloader";
import { Project, Ticket } from "@prisma/client";
import { Connection } from "../common/pagination";
import { ProjectsService } from "../services/projects.service";
import { NestedTicketArgs, TicketsService } from "../services/tickets.service";

// Un set de loaders POR REQUEST (se instancian en el context factory).
// Nunca compartir entre requests: la caché de DataLoader viviría entre usuarios.
export interface Loaders {
  projectById: DataLoader<string, Project | null>;
  ticketsByProject(args: NestedTicketArgs): DataLoader<string, Connection<Ticket>>;
}

export function createLoaders(projects: ProjectsService, tickets: TicketsService): Loaders {
  // Las connections anidadas solo se pueden batchear entre parents que piden
  // los mismos args (que es el caso en una query GraphQL): un loader por argsKey.
  const connectionLoaders = new Map<string, DataLoader<string, Connection<Ticket>>>();

  return {
    projectById: new DataLoader((ids: readonly string[]) => projects.byIds(ids)),

    ticketsByProject(args: NestedTicketArgs) {
      const key = JSON.stringify({
        first: args.first ?? null,
        status: args.filter?.status ?? null,
        priority: args.filter?.priority ?? null,
        search: args.filter?.search ?? null,
        field: args.orderBy?.field ?? null,
        direction: args.orderBy?.direction ?? null,
      });
      let loader = connectionLoaders.get(key);
      if (!loader) {
        loader = new DataLoader((ids: readonly string[]) =>
          tickets.connectionsForProjects(ids, args),
        );
        connectionLoaders.set(key, loader);
      }
      return loader;
    },
  };
}
