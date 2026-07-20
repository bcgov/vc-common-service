// Attribute requested from a holder presentation.
export interface RequestedAttribute {
  readonly name: string;
  // Restrictions applied to acceptable source credentials.
  readonly restrictions?: readonly Record<string, string>[];
}

// Predicate requested from a holder presentation.
export interface RequestedPredicate {
  readonly name: string;
  // Predicate operator, e.g. '>=', '>', '<=', '<'.
  readonly pType: string;
  readonly pValue: number;
  // Restrictions applied to acceptable source credentials.
  readonly restrictions?: readonly Record<string, string>[];
}

// Agent-agnostic presentation request.
export interface PresentationRequest {
  readonly connectionId?: string;
  readonly name: string;
  readonly requestedAttributes: readonly RequestedAttribute[];
  readonly requestedPredicates?: readonly RequestedPredicate[];
  readonly comment?: string;
}
