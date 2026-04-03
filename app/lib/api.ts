const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

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

export type Role = (typeof roleOptions)[number];
export type HelpIntent = (typeof helpIntentOptions)[number];
export type Urgency = (typeof urgencyOptions)[number];
export type HelpRequestStatus = (typeof helpRequestStatusOptions)[number];
export type NominationStatus = (typeof nominationStatusOptions)[number];
export type PaymentStatus = (typeof paymentStatusOptions)[number];

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
  isAvailable?: boolean;
  roles?: Role[];
  capabilities?: string[];
  personality?: string[];
  trustScore?: number;
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
  isAvailable?: boolean;
  roles?: Role[];
  capabilities?: string[];
  personality?: string[];
  trustScore?: number;
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

export function startRequestSession(requestId: string, operatorId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/start`, {
    method: "POST",
    body: { operatorId },
  });
}

export function completeRequestSession(requestId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/complete`, {
    method: "POST",
  });
}

export function cancelRequest(requestId: string, reason?: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
  });
}

export function reserveRequest(requestId: string) {
  return request<RequestStateResponse>(`/requests/${requestId}/reserve`, {
    method: "POST",
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
