import crypto from "node:crypto";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

const roleValues = ["guide", "local", "expert", "companion"] as const;
const helpIntentValues = ["food", "navigation", "translation", "explore", "emergency"] as const;
const urgencyValues = ["low", "medium", "high"] as const;
const helpRequestStatusValues = ["open", "nominated", "accepted", "in_call", "completed", "cancelled"] as const;
const nominationStatusValues = ["pending", "accepted", "declined", "expired"] as const;

type Role = (typeof roleValues)[number];
type HelpIntent = (typeof helpIntentValues)[number];
type Urgency = (typeof urgencyValues)[number];
type HelpRequestStatus = (typeof helpRequestStatusValues)[number];
type NominationStatus = (typeof nominationStatusValues)[number];

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
  createdAt: string;
};

type OperatorNomination = {
  id: string;
  requestId: string;
  operatorId: string;
  status: NominationStatus;
  createdAt: string;
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

function getRequestById(requestId: string) {
  return helpRequests.find((request) => request.id === requestId);
}

function getNominationsByRequestId(requestId: string) {
  return operatorNominations.filter((nomination) => nomination.requestId === requestId);
}

function getRequestState(request: HelpRequest) {
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

  return {
    request,
    nominations,
    acceptedOperators: getOperatorsByNominationStatus("accepted"),
    pendingOperators: getOperatorsByNominationStatus("pending"),
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

  const helpRequest: HelpRequest = {
    id: crypto.randomUUID(),
    userId,
    intent,
    ...(description ? { description } : {}),
    ...(urgency ? { urgency } : {}),
    status: "open",
    createdAt: new Date().toISOString(),
  };

  helpRequests.push(helpRequest);

  const matches = profiles
    .filter(
      (profile) =>
        profile.userId !== currentProfile.userId && profile.isAvailable !== false
    )
    .map((profile) => getRequestMatchResult(helpRequest, profile))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const nominations = matches.slice(0, 3).map((match) => {
    const nomination: OperatorNomination = {
      id: crypto.randomUUID(),
      requestId: helpRequest.id,
      operatorId: match.userId,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    operatorNominations.push(nomination);
    return nomination;
  });

  if (nominations.length > 0) {
    helpRequest.status = "nominated";
  }

  res.json({
    request: helpRequest,
    nominations,
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

  nomination.status = action === "accept" ? "accepted" : "declined";

  if (action === "accept") {
    request.status = "accepted";
  }

  res.json(getRequestState(request));
});

app.post("/requests/:requestId/status", (req, res) => {
  const request = getRequestById(req.params.requestId);
  const status = getEnumValue(req.body?.status, helpRequestStatusValues);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (!status) {
    return res.status(400).json({ error: "status is invalid" });
  }

  request.status = status;
  res.json(getRequestState(request));
});

app.get("/requests/:requestId", (req, res) => {
  const request = getRequestById(req.params.requestId);

  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  res.json(getRequestState(request));
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
