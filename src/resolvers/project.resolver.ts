import { Query, Resolver } from "@nestjs/graphql";

@Resolver("Project")
export class ProjectResolver {
  // Stub de F0: los datos reales llegan en F1 (Prisma + seed).
  @Query("projects")
  projects(): unknown[] {
    return [];
  }
}
