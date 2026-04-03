import crypto from "node:crypto";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

const roleValues = ["guide", "local", "expert", "companion"] as const;
const helpIntentValues = ["food", "navigation", "translation", "explore", "emergency"] as const;
const urgencyValues = ["low", "medium", "high"] as const;
const helpRequestStatusValues = [
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
const nominationStatusValues = ["pending", "accepted", "declined", "expired"] as const;
const paymentStatusValues = ["none", "quoted", "reserved", "paid", "refunded"] as const;

type Role = (typeof roleValues)[number];
type HelpIntent = (typeof helpIntentValues)[number];
type Urgency = (typeof urgencyValues)[number];
type HelpRequestStatus = (typeof helpRequestStatusValues)[number];
type NominationStatus = (typeof nominationStatusValues)[number];
type PaymentStatus = (typeof paymentStatusValues)[number];

app.use(cors());
app.use(express.json());

type User = {
  id: string;
  email?: string;
  phone?: string;
  role?: string;
};

type Profile = {
  id: string;
  userId: string;
  displayName: string;
  isAvailable?: boolean;
  roles?: Role[];
  capabilities?: string[];
  personality?: string[];
  trustScore?: number;
  bio?: string;
  city?: string;
  countryCode?: string;
  languages?: string[];
  interests?: string[];
  vibeTags?: string[];
  travelStyle?: string[];
  helpTopics?: string[];
};

type MatchResult = {
  userId: string;
  displayName: string;
  city?: string;
  roles?: Role[];
  capabilities?: string[];
  trustScore?: number;
  score: number;
  reasons: string[];
};

type HelpRequest = {
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

type OperatorNomination = {
  id: string;
  requestId: string;
  operatorId: string;
  status: NominationStatus;
  createdAt: string;
  respondedAt?: string;
};

type OperatorInboxItem = {
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

type RequestResponseItem = {
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

type ReservedSessionSummary = {
  requestId: string;
  requestStatus: HelpRequestStatus;
  paymentStatus: PaymentStatus;
  selectedOperatorId?: string;
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
};

type MatchCategory = {
  label: string;
  currentValues: string[] | undefined;
  candidateValues: string[] | undefined;
};

const users: User[] = [];
const profiles: Profile[] = [];
const helpRequests: HelpRequest[] = [];
const operatorNominations: OperatorNomination[] = [];

const seedProfiles = [
  {
    email: "khuslen@test.com",
    profile: {
      displayName: "Khuslen",
      city: "Ulaanbaatar",
      languages: ["en", "mn"],
      interests: ["food", "culture", "walking"],
      vibeTags: ["calm", "curious"],
      travelStyle: ["local-first", "explore"],
      helpTopics: ["arrival", "food", "safety"],
    },
  },
  {
    email: "saraa@test.com",
    profile: {
      displayName: "Saraa",
      city: "Ulaanbaatar",
      languages: ["en", "mn"],
      interests: ["food", "culture"],
      vibeTags: ["calm", "curious"],
      travelStyle: ["local-first", "explore"],
      helpTopics: ["arrival", "food"],
    },
  },
  {
    email: "temuulen@test.com",
    profile: {
      displayName: "Temuulen",
      city: "Ulaanbaatar",
      languages: ["en"],
      interests: ["food", "nightlife"],
      vibeTags: ["curious", "social"],
      travelStyle: ["explore"],
      helpTopics: ["food", "nightlife"],
    },
  },
  {
    email: "nomin@test.com",
    profile: {
      displayName: "Nomin",
      city: "Ulaanbaatar",
      languages: ["mn"],
      interests: ["culture", "shopping"],
      vibeTags: ["calm"],
      travelStyle: ["local-first"],
      helpTopics: ["arrival", "safety"],
    },
  },
  {
    email: "bat@test.com",
    profile: {
      displayName: "Bat",
      city: "Darkhan",
      languages: ["mn"],
      interests: ["business"],
      vibeTags: ["fast-paced"],
      travelStyle: ["efficient"],
      helpTopics: ["transport"],
    },
  },
  {
    email: "oya@test.com",
    profile: {
      displayName: "Oya",
      city: "Seoul",
      languages: ["kr"],
      interests: ["luxury"],
      vibeTags: ["energetic"],
      travelStyle: ["planned"],
      helpTopics: ["shopping"],
    },
  },
] satisfies Array<{
  email: string;
  profile: Omit<Profile, "id" | "userId">;
}>;

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRoleArray(value: unknown) {
  const values = getStringArray(value);

  if (values === null) {
    return null;
  }

  if (!values) {
    return undefined;
  }

  return values.every((item): item is Role => roleValues.includes(item as Role))
    ? values
    : null;
}

function getBoolean(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "boolean" ? value : null;
}

function getNumber(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getEnumValue<T extends readonly string[]>(value: unknown, allowedValues: T) {
  return typeof value === "string" && allowedValues.includes(value)
    ? (value as T[number])
    : null;
}

function getOverlapCount(valuesA?: string[], valuesB?: string[]) {
  if (!valuesA?.length || !valuesB?.length) {
    return 0;
  }

  const setB = new Set(valuesB);

  return new Set(valuesA).size === 0
    ? 0
    : [...new Set(valuesA)].filter((value) => setB.has(value)).length;
}

function getMatchScore(currentProfile: Profile, candidateProfile: Profile) {
  return (
    getOverlapCount(currentProfile.languages, candidateProfile.languages) +
    getOverlapCount(currentProfile.interests, candidateProfile.interests) +
    getOverlapCount(currentProfile.vibeTags, candidateProfile.vibeTags) +
    getOverlapCount(currentProfile.travelStyle, candidateProfile.travelStyle) +
    getOverlapCount(currentProfile.helpTopics, candidateProfile.helpTopics)
  );
}

function getMatchCategories(currentProfile: Profile, candidateProfile: Profile): MatchCategory[] {
  return [
    {
      label: "Shared languages",
      currentValues: currentProfile.languages,
      candidateValues: candidateProfile.languages,
    },
    {
      label: "Shared interests",
      currentValues: currentProfile.interests,
      candidateValues: candidateProfile.interests,
    },
    {
      label: "Shared vibe",
      currentValues: currentProfile.vibeTags,
      candidateValues: candidateProfile.vibeTags,
    },
    {
      label: "Shared travel style",
      currentValues: currentProfile.travelStyle,
      candidateValues: candidateProfile.travelStyle,
    },
    {
      label: "Shared help topics",
      currentValues: currentProfile.helpTopics,
      candidateValues: candidateProfile.helpTopics,
    },
  ];
}

function getMatchReasons(currentProfile: Profile, candidateProfile: Profile) {
  return getMatchCategories(currentProfile, candidateProfile)
    .filter(
      ({ currentValues, candidateValues }) =>
        getOverlapCount(currentValues, candidateValues) > 0
    )
    .map(({ label }) => label);
}

function getRoleBoostRoles(intent: HelpIntent): Role[] {
  switch (intent) {
    case "food":
      return ["local", "guide"];
    case "navigation":
      return ["guide", "local"];
    case "translation":
      return ["expert", "guide"];
    case "explore":
      return ["companion", "local", "guide"];
    case "emergency":
      return ["expert", "local"];
  }
}

function getRequestMatchResult(helpRequest: HelpRequest, candidateProfile: Profile): MatchResult {
  let score = 1;
  const reasons = ["Available now"];
  const trustScore = candidateProfile.trustScore ?? 0;
  const matchingRoles = (candidateProfile.roles ?? []).filter((role) =>
    getRoleBoostRoles(helpRequest.intent).includes(role)
  );

  if ((candidateProfile.capabilities ?? []).includes(helpRequest.intent)) {
    score += 5;
    reasons.push(`Matches your ${helpRequest.intent} request`);
  }

  if (matchingRoles.length > 0) {
    score += 2;
    reasons.push(`Good fit for ${helpRequest.intent} help`);
  }

  if (trustScore > 0) {
    score += trustScore;
  }

  if (trustScore >= 4) {
    reasons.push("High local trust");
  }

  return {
    userId: candidateProfile.userId,
    displayName: candidateProfile.displayName,
    ...(candidateProfile.city ? { city: candidateProfile.city } : {}),
    ...(candidateProfile.roles ? { roles: candidateProfile.roles } : {}),
    ...(candidateProfile.capabilities ? { capabilities: candidateProfile.capabilities } : {}),
    ...(candidateProfile.trustScore !== undefined ? { trustScore: candidateProfile.trustScore } : {}),
    score: Number(score.toFixed(1)),
    reasons,
  };
}

function getQuotedAmountForIntent(intent: HelpIntent) {
  switch (intent) {
    case "food":
      return 5;
    case "navigation":
      return 5;
    case "translation":
      return 8;
    case "explore":
      return 10;
    case "emergency":
      return 12;
  }
}

function getDefaultExpiryTimestamp() {
  return new Date(Date.now() + 5 * 60 * 1000).toISOString();
}

function getEstimatedDurationMinutes(intent: HelpIntent) {
  switch (intent) {
    case "food":
      return 20;
    case "navigation":
      return 15;
    case "translation":
      return 25;
    case "explore":
      return 45;
    case "emergency":
      return 30;
  }
}

function createHelpRequest(input: {
  userId: string;
  intent: HelpIntent;
  description?: string;
  urgency?: Urgency;
}): HelpRequest {
  const helpRequest: HelpRequest = {
    id: crypto.randomUUID(),
    userId: input.userId,
    intent: input.intent,
    ...(input.description ? { description: input.description } : {}),
    ...(input.urgency ? { urgency: input.urgency } : {}),
    status: "open",
    expiresAt: getDefaultExpiryTimestamp(),
    quotedAmount: getQuotedAmountForIntent(input.intent),
    currency: "USD",
    retryCount: 0,
    paymentStatus: "quoted",
    createdAt: new Date().toISOString(),
  };

  helpRequests.push(helpRequest);
  return helpRequest;
}

function getRankedOperatorsForRequest(
  request: HelpRequest,
  excludedOperatorIds: string[] = []
) {
  const excludedIds = new Set([request.userId, ...excludedOperatorIds]);

  return profiles
    .filter(
      (profile) =>
        !excludedIds.has(profile.userId) && profile.isAvailable !== false
    )
    .map((profile) => getRequestMatchResult(request, profile))
    .sort((a, b) => b.score - a.score);
}

function createNominationsForRequest(request: HelpRequest, matches: MatchResult[], limit = 3) {
  const nominations = matches.slice(0, limit).map((match) => {
    const nomination: OperatorNomination = {
      id: crypto.randomUUID(),
      requestId: request.id,
      operatorId: match.userId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    operatorNominations.push(nomination);
    return nomination;
  });

  if (nominations.length > 0) {
    request.status = "nominated";
  }

  return nominations;
}

function getRequestById(requestId: string) {
  return helpRequests.find((request) => request.id === requestId);
}

function getNominationsByRequestId(requestId: string) {
  return operatorNominations.filter((nomination) => nomination.requestId === requestId);
}

function isTerminalRequestStatus(status: HelpRequestStatus) {
  return ["completed", "cancelled", "expired", "timed_out", "missed"].includes(status);
}

function applyRequestExpiry(request: HelpRequest) {
  if (!request.expiresAt || request.startedAt || isTerminalRequestStatus(request.status)) {
    return request;
  }

  const expiresAtTime = new Date(request.expiresAt).getTime();

  if (Number.isNaN(expiresAtTime) || Date.now() < expiresAtTime) {
    return request;
  }

  if (request.status === "nominated") {
    const hasAcceptedNomination = getNominationsByRequestId(request.id).some(
      (nomination) => nomination.status === "accepted"
    );

    request.status = hasAcceptedNomination ? "timed_out" : "expired";
    request.endedAt = new Date().toISOString();
    request.lastFailureReason = hasAcceptedNomination ? "no_session_started" : "no_acceptance";
  } else if (request.status === "accepted") {
    request.status = "timed_out";
    request.endedAt = new Date().toISOString();
    request.lastFailureReason = "no_session_started";
  }

  return request;
}

function getRequestState(request: HelpRequest) {
  applyRequestExpiry(request);
  const nominations = getNominationsByRequestId(request.id);
  const getOperatorsByNominationStatus = (status: NominationStatus) =>
    nominations
      .filter((nomination) => nomination.status === status)
      .map((nomination) => {
        const profile = profiles.find((candidate) => candidate.userId === nomination.operatorId);

        if (!profile) {
          return null;
        }

        return getRequestMatchResult(request, profile);
      })
      .filter((match): match is MatchResult => match !== null)
      .sort((a, b) => b.score - a.score);

  const selectedOperator =
    request.selectedOperatorId === undefined
      ? null
      : (() => {
          const profile = profiles.find((candidate) => candidate.userId === request.selectedOperatorId);
          return profile ? getRequestMatchResult(request, profile) : null;
        })();

  const acceptedOperators = getOperatorsByNominationStatus("accepted").filter(
    (operator) => operator.userId !== request.selectedOperatorId
  );
  const pendingOperators =
    request.selectedOperatorId && request.status === "in_call"
      ? []
      : getOperatorsByNominationStatus("pending");

  return {
    request,
    nominations,
    selectedOperator,
    acceptedOperators,
    pendingOperators,
  };
}

function getOperatorInboxItems(operatorId: string): OperatorInboxItem[] {
  const items: OperatorInboxItem[] = [];

  helpRequests.forEach((request) => {
    applyRequestExpiry(request);

    const nomination = getNominationsByRequestId(request.id).find(
      (item) => item.operatorId === operatorId
    );

    if (!nomination || !["pending", "accepted"].includes(nomination.status)) {
      return;
    }

    if (!["nominated", "accepted"].includes(request.status)) {
      return;
    }

    if (request.paymentStatus === "refunded") {
      return;
    }

    if (request.selectedOperatorId && request.selectedOperatorId !== operatorId) {
      return;
    }

    const travelerProfile = profiles.find((profile) => profile.userId === request.userId);
    const acceptedOperatorsCount = getNominationsByRequestId(request.id).filter(
      (item) => item.status === "accepted"
    ).length;

    items.push({
      requestId: request.id,
      travelerUserId: request.userId,
      ...(travelerProfile?.displayName
        ? { travelerDisplayName: travelerProfile.displayName }
        : {}),
      ...(travelerProfile?.city ? { travelerCity: travelerProfile.city } : {}),
      locationSummary: travelerProfile?.city || "Location not set",
      intent: request.intent,
      ...(request.description ? { description: request.description } : {}),
      ...(request.quotedAmount !== undefined
        ? { quotedAmount: request.quotedAmount }
        : {}),
      currency: request.currency,
      estimatedDurationMinutes: getEstimatedDurationMinutes(request.intent),
      paymentStatus: request.paymentStatus,
      requestStatus: request.status,
      createdAt: request.createdAt,
      acceptedOperatorsCount,
      nominationStatus: nomination.status,
    });
  });

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function getRequestResponses(request: HelpRequest): RequestResponseItem[] {
  applyRequestExpiry(request);

  return getNominationsByRequestId(request.id)
    .map((nomination) => {
      const profile = profiles.find((candidate) => candidate.userId === nomination.operatorId);

      if (!profile) {
        return null;
      }

      const match = getRequestMatchResult(request, profile);
      const isSelected = request.selectedOperatorId === nomination.operatorId;
      const selectable =
        nomination.status === "accepted" &&
        request.paymentStatus === "quoted" &&
        !request.selectedOperatorId &&
        ["accepted", "nominated"].includes(request.status);

      return {
        operatorId: nomination.operatorId,
        ...(profile.id ? { operatorProfileId: profile.id } : {}),
        displayName: profile.displayName,
        ...(profile.city ? { city: profile.city } : {}),
        ...(profile.languages ? { languages: profile.languages } : {}),
        ...(profile.roles ? { roles: profile.roles } : {}),
        ...(profile.capabilities ? { capabilities: profile.capabilities } : {}),
        ...(profile.trustScore !== undefined ? { trustScore: profile.trustScore } : {}),
        nominationStatus: nomination.status,
        ...(nomination.respondedAt ? { respondedAt: nomination.respondedAt } : {}),
        requestStatus: request.status,
        selectable,
        isSelected,
        reasons: match.reasons,
      };
    })
    .filter((item): item is RequestResponseItem => item !== null)
    .sort((a, b) => {
      const nominationPriority: Record<NominationStatus, number> = {
        accepted: 0,
        pending: 1,
        declined: 2,
        expired: 3,
      };

      return nominationPriority[a.nominationStatus] - nominationPriority[b.nominationStatus];
    });
}

function getReservedSessionSummary(
  request: HelpRequest,
  viewerUserId?: string
): ReservedSessionSummary {
  applyRequestExpiry(request);

  const travelerProfile = profiles.find((profile) => profile.userId === request.userId);
  const operatorProfile =
    request.selectedOperatorId === undefined
      ? null
      : profiles.find((profile) => profile.userId === request.selectedOperatorId) ?? null;

  const viewerRole =
    viewerUserId === request.userId
      ? "traveler"
      : viewerUserId && viewerUserId === request.selectedOperatorId
        ? "operator"
        : "other";

  return {
    requestId: request.id,
    requestStatus: request.status,
    paymentStatus: request.paymentStatus,
    ...(request.selectedOperatorId ? { selectedOperatorId: request.selectedOperatorId } : {}),
    traveler: {
      userId: request.userId,
      displayName: travelerProfile?.displayName || "Traveler",
      ...(travelerProfile?.city ? { city: travelerProfile.city } : {}),
      ...(travelerProfile?.languages ? { languages: travelerProfile.languages } : {}),
    },
    operator:
      operatorProfile === null
        ? null
        : {
            userId: operatorProfile.userId,
            displayName: operatorProfile.displayName,
            ...(operatorProfile.city ? { city: operatorProfile.city } : {}),
            ...(operatorProfile.languages ? { languages: operatorProfile.languages } : {}),
            ...(operatorProfile.roles ? { roles: operatorProfile.roles } : {}),
            ...(operatorProfile.capabilities
              ? { capabilities: operatorProfile.capabilities }
              : {}),
            ...(operatorProfile.trustScore !== undefined
              ? { trustScore: operatorProfile.trustScore }
              : {}),
          },
    intent: request.intent,
    ...(request.description ? { description: request.description } : {}),
    ...(request.quotedAmount !== undefined ? { quotedAmount: request.quotedAmount } : {}),
    currency: request.currency,
    estimatedDurationMinutes: getEstimatedDurationMinutes(request.intent),
    locationSummary: travelerProfile?.city || "Location not set",
    viewerRole,
    isSelectedOperator:
      request.selectedOperatorId !== undefined &&
      viewerUserId === request.selectedOperatorId,
  };
}

function seedMockProfiles() {
  users.length = 0;
  profiles.length = 0;

  const seeded = seedProfiles.map(({ email, profile }) => {
    const user: User = {
      id: crypto.randomUUID(),
      email,
    };

    const createdProfile: Profile = {
      id: crypto.randomUUID(),
      userId: user.id,
      ...profile,
    };

    users.push(user);
    profiles.push(createdProfile);

    return {
      user,
      profile: createdProfile,
    };
  });

  return {
    users,
    profiles,
    seeded,
  };
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aylix-api",
    timestamp: new Date().toISOString(),
  });
});

app.post("/users", (req, res) => {
  const email = getTrimmedString(req.body?.email);

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
  };

  users.push(user);
  res.status(201).json(user);
});

app.post("/profiles", (req, res) => {
  const {
    userId: rawUserId,
    displayName: rawDisplayName,
    isAvailable: rawIsAvailable,
    roles: rawRoles,
    capabilities: rawCapabilities,
    personality: rawPersonality,
    trustScore: rawTrustScore,
    bio,
    city,
    countryCode,
    languages: rawLanguages,
    interests: rawInterests,
    vibeTags: rawVibeTags,
    travelStyle: rawTravelStyle,
    helpTopics: rawHelpTopics,
  } = req.body;

  const userId = getTrimmedString(rawUserId);
  const displayName = getTrimmedString(rawDisplayName);
  const isAvailable = getBoolean(rawIsAvailable);
  const roles = getRoleArray(rawRoles);
  const capabilities = getStringArray(rawCapabilities);
  const personality = getStringArray(rawPersonality);
  const trustScore = getNumber(rawTrustScore);
  const languages = getStringArray(rawLanguages);
  const interests = getStringArray(rawInterests);
  const trimmedBio = getTrimmedString(bio);
  const trimmedCity = getTrimmedString(city);
  const trimmedCountryCode = getTrimmedString(countryCode);
  const vibeTags = getStringArray(rawVibeTags);
  const travelStyle = getStringArray(rawTravelStyle);
  const helpTopics = getStringArray(rawHelpTopics);

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (!displayName) {
    return res.status(400).json({ error: "displayName is required" });
  }

  if (isAvailable === null) {
    return res.status(400).json({ error: "isAvailable must be a boolean" });
  }

  if (roles === null) {
    return res.status(400).json({ error: "roles must be an array of valid role values" });
  }

  if (capabilities === null) {
    return res.status(400).json({ error: "capabilities must be an array" });
  }

  if (personality === null) {
    return res.status(400).json({ error: "personality must be an array" });
  }

  if (trustScore === null) {
    return res.status(400).json({ error: "trustScore must be a number" });
  }

  if (languages === null) {
    return res.status(400).json({ error: "languages must be an array" });
  }

  if (interests === null) {
    return res.status(400).json({ error: "interests must be an array" });
  }

  if (vibeTags === null) {
    return res.status(400).json({ error: "vibeTags must be an array" });
  }

  if (travelStyle === null) {
    return res.status(400).json({ error: "travelStyle must be an array" });
  }

  if (helpTopics === null) {
    return res.status(400).json({ error: "helpTopics must be an array" });
  }

  const profile: Profile = {
    id: crypto.randomUUID(),
    userId,
    displayName,
    ...(isAvailable !== undefined ? { isAvailable } : {}),
    ...(roles ? { roles } : {}),
    ...(capabilities ? { capabilities } : {}),
    ...(personality ? { personality } : {}),
    ...(trustScore !== undefined ? { trustScore } : {}),
    ...(trimmedBio ? { bio: trimmedBio } : {}),
    ...(trimmedCity ? { city: trimmedCity } : {}),
    ...(trimmedCountryCode ? { countryCode: trimmedCountryCode } : {}),
    ...(languages ? { languages } : {}),
    ...(interests ? { interests } : {}),
    ...(vibeTags ? { vibeTags } : {}),
    ...(travelStyle ? { travelStyle } : {}),
    ...(helpTopics ? { helpTopics } : {}),
  };

  profiles.push(profile);
  res.status(201).json(profile);
});

app.get("/profiles/:userId", (req, res) => {
  const profile = profiles.find((p) => p.userId === req.params.userId);

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  res.json(profile);
});

app.post("/seed/mock", (_req, res) => {
  res.json(seedMockProfiles());
});

app.post("/requests/match", (req, res) => {
  const userId = getTrimmedString(req.body?.userId);
  const intent = getEnumValue(req.body?.intent, helpIntentValues);
  const description = getTrimmedString(req.body?.description);
  const urgencyRaw = req.body?.urgency;
  const urgency =
    urgencyRaw === undefined ? undefined : getEnumValue(urgencyRaw, urgencyValues);

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  if (!intent) {
    return res.status(400).json({ error: "intent is required" });
  }

  if (urgencyRaw !== undefined && !urgency) {
    return res.status(400).json({ error: "urgency must be low, medium, or high" });
  }

  const currentProfile = profiles.find((profile) => profile.userId === userId);

  if (!currentProfile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const helpRequest = createHelpRequest({
    userId,
    intent,
    ...(description ? { description } : {}),
    ...(urgency ? { urgency } : {}),
  });

  const matches = getRankedOperatorsForRequest(helpRequest).slice(0, 5);
  const nominations = createNominationsForRequest(helpRequest, matches, 3);

  res.json({
    request: helpRequest,
    nominations,
    operators: matches.slice(0, 3),
    matches: matches.slice(0, 3),
  });
});

app.post("/requests/:requestId/expand", (req, res) => {
  const request = getRequestById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  applyRequestExpiry(request);

  if (!["nominated", "accepted", "timed_out", "expired"].includes(request.status)) {
    return res.status(400).json({ error: "Request cannot expand search in its current state" });
  }

  const existingOperatorIds = getNominationsByRequestId(request.id).map(
    (nomination) => nomination.operatorId
  );
  const operators = getRankedOperatorsForRequest(request, existingOperatorIds);
  const newNominations = createNominationsForRequest(request, operators, 3);

  request.retryCount += 1;
  request.status = "nominated";
  delete request.endedAt;
  delete request.lastFailureReason;
  request.expiresAt = getDefaultExpiryTimestamp();

  res.json({
    request,
    nominations: getNominationsByRequestId(request.id),
    operators: operators.slice(0, 3),
  });
});

app.post("/requests/:requestId/retry", (req, res) => {
  const existingRequest = getRequestById(req.params.requestId);

  if (!existingRequest) {
    return res.status(404).json({ error: "Request not found" });
  }

  const newRequest = createHelpRequest({
    userId: existingRequest.userId,
    intent: existingRequest.intent,
    ...(existingRequest.description ? { description: existingRequest.description } : {}),
    ...(existingRequest.urgency ? { urgency: existingRequest.urgency } : {}),
  });

  const matches = getRankedOperatorsForRequest(newRequest).slice(0, 5);
  const nominations = createNominationsForRequest(newRequest, matches, 3);

  res.json({
    request: newRequest,
    nominations,
    operators: matches.slice(0, 3),
    matches: matches.slice(0, 3),
  });
});

app.post("/requests/:requestId/respond", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const operatorId = getTrimmedString(req.body?.operatorId);
  const action = getEnumValue(req.body?.action, ["accept", "decline"] as const);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (!operatorId) {
    return res.status(400).json({ error: "operatorId is required" });
  }

  if (!action) {
    return res.status(400).json({ error: "action must be accept or decline" });
  }

  const nomination = operatorNominations.find(
    (item) => item.requestId === request.id && item.operatorId === operatorId
  );

  if (!nomination) {
    return res.status(404).json({ error: "Nomination not found" });
  }

  if (request.selectedOperatorId) {
    return res.status(400).json({ error: "Request already has a selected operator" });
  }

  nomination.status = action === "accept" ? "accepted" : "declined";
  nomination.respondedAt = new Date().toISOString();

  if (action === "accept") {
    request.status = "accepted";
  }

  res.json(getRequestState(request));
});

app.post("/requests/:requestId/start", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const operatorId = getTrimmedString(req.body?.operatorId);
  const userId = getTrimmedString(req.body?.userId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  applyRequestExpiry(request);

  if (request.paymentStatus === "refunded") {
    return res.status(400).json({ error: "Refunded requests cannot be started" });
  }

  if (["completed", "cancelled", "expired", "timed_out", "missed"].includes(request.status)) {
    return res.status(400).json({ error: "Request cannot be started in its current state" });
  }

  if (request.paymentStatus !== "reserved") {
    return res.status(400).json({ error: "Request must be reserved before starting" });
  }

  if (!request.selectedOperatorId) {
    return res.status(400).json({ error: "Request must have a selected operator before starting" });
  }

  if (!operatorId) {
    return res.status(400).json({ error: "operatorId is required" });
  }

  if (operatorId !== request.selectedOperatorId) {
    return res.status(400).json({ error: "operatorId must match the selected operator" });
  }

  if (
    userId &&
    userId !== request.userId &&
    userId !== request.selectedOperatorId
  ) {
    return res.status(403).json({ error: "User cannot start this reserved session" });
  }

  const nomination = operatorNominations.find(
    (item) =>
      item.requestId === request.id &&
      item.operatorId === operatorId &&
      item.status === "accepted"
  );

  if (!nomination) {
    return res.status(400).json({ error: "Operator must have an accepted nomination" });
  }

  if (request.selectedOperatorId && request.selectedOperatorId !== operatorId) {
    return res.status(400).json({ error: "Request is locked to another operator" });
  }

  request.selectedOperatorId = operatorId;
  request.startedAt = new Date().toISOString();
  request.status = "in_call";
  delete request.lastFailureReason;
  res.json(getRequestState(request));
});

app.post("/requests/:requestId/reserve", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const operatorId = getTrimmedString(req.body?.operatorId);
  const userId = getTrimmedString(req.body?.userId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  applyRequestExpiry(request);

  if (request.status !== "accepted") {
    return res.status(400).json({ error: "Request must be accepted before reserving" });
  }

  if (!operatorId) {
    return res.status(400).json({ error: "operatorId is required" });
  }

  if (userId && request.userId !== userId) {
    return res.status(403).json({ error: "Request does not belong to this traveler" });
  }

  if (request.paymentStatus !== "quoted") {
    return res.status(400).json({ error: "Request must be quoted before reserving" });
  }

  if (request.selectedOperatorId && request.selectedOperatorId !== operatorId) {
    return res.status(400).json({ error: "Request is already reserved for another operator" });
  }

  const nomination = operatorNominations.find(
    (item) =>
      item.requestId === request.id &&
      item.operatorId === operatorId &&
      item.status === "accepted"
  );

  if (!nomination) {
    return res.status(400).json({ error: "Only accepted operators can be reserved" });
  }

  request.selectedOperatorId = operatorId;
  request.paymentStatus = "reserved";
  res.json(getRequestState(request));
});

app.post("/requests/:requestId/complete", (req, res) => {
  const request = getRequestById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  request.status = "completed";
  request.endedAt = new Date().toISOString();
  if (request.paymentStatus === "reserved") {
    request.paymentStatus = "paid";
  }

  res.json(getRequestState(request));
});

app.post("/requests/:requestId/cancel", (req, res) => {
  const request = getRequestById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  applyRequestExpiry(request);

  if (!["open", "nominated", "accepted"].includes(request.status)) {
    return res.status(400).json({ error: "Request cannot be cancelled in its current state" });
  }

  request.status = "cancelled";
  request.endedAt = new Date().toISOString();

  res.json(getRequestState(request));
});

app.post("/requests/:requestId/no-show", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const operatorId = getTrimmedString(req.body?.operatorId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (!["accepted", "in_call"].includes(request.status)) {
    return res.status(400).json({ error: "No-show can only be reported for accepted or in-call requests" });
  }

  if (!operatorId) {
    return res.status(400).json({ error: "operatorId is required" });
  }

  request.status = "missed";
  request.lastFailureReason = "operator_no_show";
  request.endedAt = new Date().toISOString();

  res.json(getRequestState(request));
});

app.post("/requests/:requestId/refund", (req, res) => {
  const request = getRequestById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  request.paymentStatus = "refunded";
  res.json(getRequestState(request));
});

app.get("/requests/:requestId", (req, res) => {
  const request = getRequestById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  res.json(getRequestState(request));
});

app.get("/requests/:requestId/responses", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const userId = getTrimmedString(req.query.userId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (userId && request.userId !== userId) {
    return res.status(403).json({ error: "Request does not belong to this traveler" });
  }

  res.json({
    request,
    responses: getRequestResponses(request),
  });
});

app.get("/requests/:requestId/summary", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const userId = getTrimmedString(req.query.userId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  res.json({
    summary: getReservedSessionSummary(request, userId || undefined),
  });
});

app.get("/operator/requests", (req, res) => {
  const operatorId = getTrimmedString(req.query.operatorId);

  if (!operatorId) {
    return res.status(400).json({ error: "operatorId is required" });
  }

  const operatorProfile = profiles.find((profile) => profile.userId === operatorId);

  if (!operatorProfile) {
    return res.status(404).json({ error: "Operator profile not found" });
  }

  res.json({
    requests: getOperatorInboxItems(operatorId),
  });
});

app.get("/match/:userId", (req, res) => {
  const currentProfile = profiles.find((profile) => profile.userId === req.params.userId);

  if (!currentProfile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const matches: MatchResult[] = profiles
    .filter(
      (profile) =>
        profile.userId !== currentProfile.userId && profile.isAvailable !== false
    )
    .map((profile) => {
      const score = getMatchScore(currentProfile, profile);

      return {
        userId: profile.userId,
        displayName: profile.displayName,
        ...(profile.city ? { city: profile.city } : {}),
        score,
        reasons: getMatchReasons(currentProfile, profile),
      };
    })
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json({ matches });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
