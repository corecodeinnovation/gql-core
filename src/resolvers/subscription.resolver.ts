import { Inject } from "@nestjs/common";
import { Resolver, Subscription } from "@nestjs/graphql";
import { Ticket } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { EVENTS, PUB_SUB } from "../pubsub/pubsub.module";

interface ProjectIdVars {
  projectId?: string | null;
}

@Resolver()
export class SubscriptionResolver {
  constructor(@Inject(PUB_SUB) private readonly pubSub: PubSub) {}

  @Subscription("ticketCreated", {
    filter: (payload: { ticketCreated: Ticket }, variables: ProjectIdVars) =>
      !variables.projectId || payload.ticketCreated.projectId === variables.projectId,
  })
  ticketCreated() {
    return this.pubSub.asyncIterableIterator(EVENTS.TICKET_CREATED);
  }

  @Subscription("ticketStatusChanged", {
    filter: (payload: { ticketStatusChanged: Ticket }, variables: ProjectIdVars) =>
      !variables.projectId || payload.ticketStatusChanged.projectId === variables.projectId,
  })
  ticketStatusChanged() {
    return this.pubSub.asyncIterableIterator(EVENTS.TICKET_STATUS_CHANGED);
  }
}
