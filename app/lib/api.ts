const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export const onboardingRoleOptions = ["traveler", "operator"] as const;
export const roleOptions = ["guide", "local", "expert", "companion"] as const;
export const helpIntentOptions = ["food", "navigation", "translation", "explore", "emergency"] as const;
export const urgencyOptions = ["low", "medium", "high"] as const;
export const capabilitiesOptions = ["food", "navigation", "translation", "explore", "emergency"] as const;
export const personalityOptions = ["chill", "fast", "talkative", "calm", "curious"] as const;
export const helpRequestStatusOptions = [
  "open",
  "nominated",
  "accepted",
  "in_call",
  "completed",
  "cancelled",
  "expired",
  "timed_out",
  "missed",
] as const;
export const nominationStatusOptions = ["pending", "accepted", "declined", "expired"] as const;
export const paymentStatusOptions = ["none", "quoted", "reserved", "paid", "refunded"] as const;
export const payoutStatusOptions = ["pending", "available", "paid"] as const;

export type Role = (typeof roleOptions)[number];
export type OnboardingRole = (typeof onboardingRoleOptions)[number];
export type HelpIntent = (typeof helpIntentOptions)[number];
export type Urgency = (typeof urgencyOptions)[number];
export type HelpRequestStatus = (typeof helpRequestStatusOptions)[number];
export type NominationStatus = (typeof nominationStatusOptions)[number];
export type PaymentStatus = (typeof paymentStatusOptions)[number];
export type PayoutStatus = (typeof payoutStatusOptions)[number];

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type CreateUserInput = {
  email: string;
};

type CreateUserResponse = {
  id: string;
  email: string;
};

type CreateProfileInput = {
  userId: string;
  displayName: string;
  role?: OnboardingRole;
  isAvailable?: boolean;
  roles?: Role[];
  capabilities?: string[];
  personality?: string[];
  trustScore?: number;
  hasExperience?: boolean;
  experienceNote?: string;
  responseSample?: string;
  availabilitySlots?: string[];
  city?: string;
  languages?: string[];
  interests?: string[];
  vibeTags?: string[];
  travelStyle?: string[];
  helpTopics?: string[];
};

type CreateProfileResponse = {
  id: string;
  userId: string;
  displayName: string;
  role?: OnboardingRole;
  isAvailable?: boolean;
  roles?: Role[];
  capabilities?: string[];
  personality?: string[];
  trustScore?: number;
  hasExperience?: boolean;
  experienceNote?: string;
  responseSample?: string;
  availabilitySlots?: string[];
  city?: string;
  languages?: string[];
  interests?: string[];
  vibeTags?: string[];
  travelStyle?: string[];
  helpTopics?: string[];
};

export type Match = {
  userId: string;
  displayName: string;
  city?: string;
  roles?: Role[];
  capabilities?: string[];
  trustScore?: number;
  score: number;
  reasons?: string[];
};

export type HelpRequest = {
  id: string;
  userId: string;
  intent: HelpIntent;
  description?: string;
  urgency?: Urgency;
  status: HelpRequestStatus;
  selectedOperatorId?: string;
  startedAt?: string;
  endedAt?: string;
  expiresAt?: string;
  quotedAmount?: number;
  currency: string;
  completedAt?: string;
  platformFeePercent?: number;
  operatorEarnings?: number;
  payoutStatus?: PayoutStatus;
  retryCount: number;
  lastFailureReason?: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

export type OperatorNomination = {
  id: string;
  requestId: string;
  operatorId: string;
  status: NominationStatus;
  createdAt: string;
  respondedAt?: string;
};

export type MatchHelpRequestInput = {
  userId: string;
  intent: HelpIntent;
  description?: string;
  urgency?: Urgency;
};

type MatchHelpRequestResponse = {
  request: HelpRequest;
  nominations: OperatorNomination[];
  operators: Match[];
  matches: Match[];
};

type ExpandRequestResponse = {
  request: HelpRequest;
  nominations: OperatorNomination[];
  operators: Match[];
};

export type RequestStateResponse = {
  request: HelpRequest;
  nominations: OperatorNomination[];
  selectedOperator: Match | null;
  acceptedOperators: Match[];
  pendingOperators: Match[];
};

export type RequestResponseItem = {
  operatorId: string;
  operatorProfileId?: string;
  displayName: string;
  city?: string;
  languages?: string[];
  roles?: Role[];
  capabilities?: string[];
  trustScore?: number;
  nominationStatus: NominationStatus;
  respondedAt?: string;
  requestStatus: HelpRequestStatus;
  selectable: boolean;
  isSelected: boolean;
  reasons: string[];
};

export type RequestResponsesResponse = {
  request: HelpRequest;
  responses: RequestResponseItem[];
};

export type ReservedSessionSummary = {
  requestId: string;
  requestStatus: HelpRequestStatus;
  paymentStatus: PaymentStatus;
  selectedOperatorId?: string;
  startedAt?: string;
  completedAt?: string;
  traveler: {
    userId: string;
    displayName: string;
    city?: string;
    languages?: string[];
  };
  operator: {
    userId: string;
    displayName: string;
    city?: string;
    languages?: string[];
    roles?: Role[];
    capabilities?: string[];
    trustScore?: number;
  } | null;
  intent: HelpIntent;
  description?: string;
  quotedAmount?: number;
  currency: string;
  estimatedDurationMinutes?: number;
  locationSummary: string;
  viewerRole: "traveler" | "operator" | "other";
  isSelectedOperator: boolean;
  hasReview: boolean;
  review?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
};

export type ReservedSessionSummaryResponse = {
  summary: ReservedSessionSummary;
};

export type SessionReview = {
  requestId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  travelerUserId: string;
  selectedOperatorId?: string;
};

export type SubmitReviewResponse = {
  request: RequestStateResponse;
  review: SessionReview;
};

export type CompletedTravelerRequestItem = {
  requestId: string;
  status: HelpRequestStatus;
  paymentStatus: PaymentStatus;
  selectedOperator: {
    userId: string;
    displayName: string;
    city?: string;
  } | null;
  traveler: {
    userId: string;
    displayName: string;
  };
  quotedAmount?: number;
  currency: string;
  durationMinutes?: number;
  locationSummary: string;
  intent: HelpIntent;
  completedAt?: string;
  review?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
};

export type CompletedOperatorSessionItem = {
  requestId: string;
  traveler: {
    userId: string;
    displayName: string;
    city?: string;
  };
  operator: {
    userId: string;
    displayName: string;
  } | null;
  quotedAmount?: number;
  earnedAmount?: number;
  currency: string;
  paymentStatus: PaymentStatus;
  completedAt?: string;
  intent: HelpIntent;
  locationSummary: string;
  review?: {
    rating: number;
    comment?: string;
    createdAt: string;
  };
  rating?: number;
};

export type OperatorEarningsTransaction = {
  requestId: string;
  travelerName: string;
  intent: HelpIntent;
  completedAt: string | null;
  grossAmount: number;
  netAmount: number;
  payoutStatus: PayoutStatus;
  rating: number | null;
};

export type OperatorEarningsSnapshot = {
  operatorId: string;
  currency: "USD";
  grossEarnings: number;
  netEarnings: number;
  pendingEarnings: number;
  paidOutEarnings: number;
  completedSessions: number;
  averageRating: number | null;
  reviewCount: number;
  recentTransactions: OperatorEarningsTransaction[];
};

type CompletedTravelerRequestsResponse = {
  requests: CompletedTravelerRequestItem[];
};

type CompletedOperatorSessionsResponse = {
  sessions: CompletedOperatorSessionItem[];
};

type OperatorEarningsResponse = OperatorEarningsSnapshot;

export type OperatorInboxItem = {
  requestId: string;
  travelerUserId: string;
  travelerDisplayName?: string;
  travelerCity?: string;
  locationSummary: string;
  intent: HelpIntent;
  description?: string;
  quotedAmount?: number;
  currency: string;
  estimatedDurationMinutes?: number;
  paymentStatus: PaymentStatus;
  requestStatus: HelpRequestStatus;
  createdAt: string;
  acceptedOperatorsCount: number;
  nominationStatus: NominationStatus;
};

type OperatorInboxResponse = {
  requests: OperatorInboxItem[];
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}

export function createUser(input: CreateUserInput) {
  return request<CreateUserResponse>("/users", {
    method: "POST",
    body: input,
  });
}

export function createProfile(input: CreateProfileInput) {
  return request<CreateProfileResponse>("/profiles", {
    method: "POST",
    body: input,
  });
}

export function matchHelpRequest(input: MatchHelpRequestInput) {
  return request<MatchHelpRequestResponse>("/requests/match", {
    method: "POST",
    body: input,
  });
}

export function getRequestState(requestId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}`);
}

export function respondToRequest(
  requestId: string,
  input: { operatorId: string; action: "accept" | "decline" }
) {
  return request<RequestStateResponse>(`/requests/${requestId}/respond`, {
    method: "POST",
    body: input,
  });
}

export function startRequestSession(
  requestId: string,
  input: { operatorId: string; userId?: string }
) {
  return request<RequestStateResponse>(`/requests/${requestId}/start`, {
    method: "POST",
    body: input,
  });
}

export function completeRequestSession(requestId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/complete`, {
    method: "POST",
  });
}

export function completeActiveSession(
  requestId: string,
  input: { operatorId?: string; userId?: string }
) {
  return request<RequestStateResponse>(`/requests/${requestId}/complete`, {
    method: "POST",
    body: input,
  });
}

export function cancelRequest(requestId: string, reason?: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function reserveRequest(
  requestId: string,
  input: { operatorId: string; userId?: string }
) {
  return request<RequestStateResponse>(`/requests/${requestId}/reserve`, {
    method: "POST",
    body: input,
  });
}

export function expandRequest(requestId: string) {
  return request<ExpandRequestResponse>(`/requests/${requestId}/expand`, {
    method: "POST",
  });
}

export function retryRequest(requestId: string) {
  return request<MatchHelpRequestResponse>(`/requests/${requestId}/retry`, {
    method: "POST",
  });
}

export function reportNoShow(requestId: string, operatorId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/no-show`, {
    method: "POST",
    body: { operatorId },
  });
}

export function refundRequest(requestId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/refund`, {
    method: "POST",
  });
}

export function getOperatorInbox(operatorId: string) {
  return request<OperatorInboxResponse>(
    `/operator/requests?operatorId=${encodeURIComponent(operatorId)}`
  );
}

export function getRequestResponses(requestId: string, userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request<RequestResponsesResponse>(`/requests/${requestId}/responses${query}`);
}

export function getReservedSessionSummary(requestId: string, userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return request<ReservedSessionSummaryResponse>(`/requests/${requestId}/summary${query}`);
}

export function submitReview(
  requestId: string,
  input: { userId: string; rating: number; comment?: string }
) {
  return request<SubmitReviewResponse>(`/requests/${requestId}/review`, {
    method: "POST",
    body: input,
  });
}

export function getCompletedTravelerRequests(userId: string) {
  return request<CompletedTravelerRequestsResponse>(
    `/users/${encodeURIComponent(userId)}/requests/completed`
  );
}

export function getCompletedOperatorSessions(userId: string) {
  return request<CompletedOperatorSessionsResponse>(
    `/operators/${encodeURIComponent(userId)}/sessions/completed`
  );
}

export function getOperatorEarnings(operatorId: string) {
  return request<OperatorEarningsResponse>(
    `/operators/${encodeURIComponent(operatorId)}/earnings`
  );
}
