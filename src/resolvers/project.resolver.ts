import { Args, Parent, Query, ResolveField, Resolver } from "@nestjs/graphql";
import { Project as ProjectModel } from "@prisma/client";
import { ProjectTicketsArgs, QueryProjectArgs, QueryProjectsArgs } from "../generated/graphql";
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

  @ResolveField("tickets")
  tickets(@Parent() project: ProjectModel, @Args() args: ProjectTicketsArgs) {
    // N+1 deliberado en F1: se reemplaza por DataLoader en F2 (benchmark antes/después).
    return this.ticketsService.connection({ ...args, projectId: project.id });
  }
}
