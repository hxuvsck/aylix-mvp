import crypto from "node:crypto";
import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

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
  score: number;
  reasons: string[];
};

type MatchCategory = {
  label: string;
  currentValues: string[] | undefined;
  candidateValues: string[] | undefined;
};

const users: User[] = [];
const profiles: Profile[] = [];

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

app.get("/match/:userId", (req, res) => {
  const currentProfile = profiles.find((profile) => profile.userId === req.params.userId);

  if (!currentProfile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const matches: MatchResult[] = profiles
    .filter((profile) => profile.userId !== currentProfile.userId)
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
