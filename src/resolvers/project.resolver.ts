import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Project as ProjectModel } from "@prisma/client";
import { GqlContext } from "../common/context";
import {
  CreateProjectInput,
  ProjectTicketsArgs,
  QueryProjectArgs,
  QueryProjectsArgs,
} from "../generated/graphql";
import { ProjectsService } from "../services/projects.service";
import { TicketsService } from "../services/tickets.service";

@Resolver("Project")
export class ProjectResolver {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly ticketsService: TicketsService,
  ) {}

  @Query("projects")
  projects(@Args() args: QueryProjectsArgs) {
    return this.projectsService.connection(args);
  }

  @Query("project")
  project(@Args() args: QueryProjectArgs) {
    return this.projectsService.byId(args.id);
  }

  @Mutation("createProject")
  createProject(@Args("input") input: CreateProjectInput) {
    return this.projectsService.create(input);
  }

  @ResolveField("tickets")
  tickets(
    @Parent() project: ProjectModel,
    @Args() args: ProjectTicketsArgs,
    @Context() ctx: GqlContext,
  ) {
    if (args.after) {
      // "load more" anidado: el cursor es de un proyecto puntual, no se batchea
      return this.ticketsService.connection({ ...args, projectId: project.id });
    }
    return ctx.loaders.ticketsByProject(args).load(project.id);
  }
}
