import { AuthUser } from "../auth/auth.context";
import { Loaders } from "../loaders/loaders";

// Context de GraphQL por request.
export interface GqlContext {
  loaders: Loaders;
  /** identidad del JWT de cci-auth-service; null = anónimo */
  user: AuthUser | null;
}
