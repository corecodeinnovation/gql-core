import { TicketStatus } from "../generated/graphql";

// Errores de dominio como parte del contrato: las mutations devuelven uniones
// y el cliente discrimina por __typename (el default type resolver de Apollo
// usa esta propiedad, por eso cada resultado viene etiquetado).
export interface ValidationErrorResult {
  __typename: "ValidationError";
  message: string;
  field: string;
}

export interface NotFoundErrorResult {
  __typename: "NotFoundError";
  message: string;
  id: string;
}

export interface InvalidStatusTransitionErrorResult {
  __typename: "InvalidStatusTransitionError";
  message: string;
  from: TicketStatus;
  to: TicketStatus;
}

export const validationError = (field: string, message: string): ValidationErrorResult => ({
  __typename: "ValidationError",
  field,
  message,
});

export const notFoundError = (id: string, message: string): NotFoundErrorResult => ({
  __typename: "NotFoundError",
  id,
  message,
});

export const invalidStatusTransitionError = (
  from: TicketStatus,
  to: TicketStatus,
): InvalidStatusTransitionErrorResult => ({
  __typename: "InvalidStatusTransitionError",
  from,
  to,
  message: `Transición de status inválida: ${from} → ${to}`,
});
