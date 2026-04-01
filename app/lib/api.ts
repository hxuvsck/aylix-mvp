const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

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
  city?: string;
  languages?: string[];
  interests?: string[];
  vibeTags?: string[];
  travelStyle?: string[];
  helpTopics?: string[];
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
