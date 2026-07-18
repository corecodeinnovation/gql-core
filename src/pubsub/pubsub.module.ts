import { Global, Module } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";

// Token de inyección: los services publican y el resolver de subscriptions
// consume contra la interfaz, no contra la implementación. Para escalar a
// multi-instancia se cambia este provider por RedisPubSub (misma interfaz)
// sin tocar services ni resolvers.
export const PUB_SUB = "PUB_SUB";

export const EVENTS = {
  TICKET_CREATED: "TICKET_CREATED",
  TICKET_STATUS_CHANGED: "TICKET_STATUS_CHANGED",
} as const;

@Global()
@Module({
  providers: [{ provide: PUB_SUB, useValue: new PubSub() }],
  exports: [PUB_SUB],
})
export class PubSubModule {}
