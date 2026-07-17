import { Module } from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { TicketsService } from "./tickets.service";

@Module({
  providers: [ProjectsService, TicketsService],
  exports: [ProjectsService, TicketsService],
})
export class ServicesModule {}
