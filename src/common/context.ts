import { Loaders } from "../loaders/loaders";

// Context de GraphQL por request. En F4 se agrega el usuario del JWT.
export interface GqlContext {
  loaders: Loaders;
}
