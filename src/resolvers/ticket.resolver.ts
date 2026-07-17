import { Args, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Ticket as TicketModel } from "@prisma/client";
import { QueryTicketsArgs } from "../generated/graphql";
import { ProjectsService } from "../services/projects.service";
import { TicketsService } from "../services/tickets.service";

@Resolver("Ticket")
export class TicketResolver {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Query("tickets")
  tickets(@Args() args: QueryTicketsArgs) {
    return this.ticketsService.connection(args);
  }

  @ResolveField("project")
  project(@Parent() ticket: TicketModel) {
    // N+1 deliberado en F1: se reemplaza por DataLoader en F2 (benchmark antes/después).
    return this.projectsService.byId(ticket.projectId);
  }
}
