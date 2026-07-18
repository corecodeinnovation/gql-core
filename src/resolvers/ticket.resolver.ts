import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Ticket as TicketModel } from "@prisma/client";
import { GqlContext } from "../common/context";
import {
  ChangeTicketStatusInput,
  CreateTicketInput,
  MutationDeleteTicketArgs,
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
  createTicket(@Args("input") input: CreateTicketInput, @Context() ctx: GqlContext) {
    // @auth garantiza user; el sub queda como autor del ticket
    return this.ticketsService.create(input, ctx.user?.sub ?? null);
  }

  @Mutation("changeTicketStatus")
  changeTicketStatus(@Args("input") input: ChangeTicketStatusInput) {
    return this.ticketsService.changeStatus(input);
  }

  @Mutation("deleteTicket")
  deleteTicket(@Args() args: MutationDeleteTicketArgs) {
    return this.ticketsService.delete(args.id);
  }

  @ResolveField("project")
  project(@Parent() ticket: TicketModel, @Context() ctx: GqlContext) {
    return ctx.loaders.projectById.load(ticket.projectId);
  }
}
