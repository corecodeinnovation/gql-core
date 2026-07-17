import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Ticket as TicketModel } from "@prisma/client";
import { GqlContext } from "../common/context";
import {
  ChangeTicketStatusInput,
  CreateTicketInput,
  QueryTicketsArgs,
} from "../generated/graphql";
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

  @Mutation("createTicket")
  createTicket(@Args("input") input: CreateTicketInput) {
    return this.ticketsService.create(input);
  }

  @Mutation("changeTicketStatus")
  changeTicketStatus(@Args("input") input: ChangeTicketStatusInput) {
    return this.ticketsService.changeStatus(input);
  }

  @ResolveField("project")
  project(@Parent() ticket: TicketModel, @Context() ctx: GqlContext) {
    return ctx.loaders.projectById.load(ticket.projectId);
  }
}
