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
  travelStyleTags?: string[];
  helpTopics?: string[];
};

const users: User[] = [];
const profiles: Profile[] = [];

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
    travelStyleTags: rawTravelStyleTags,
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
  const travelStyleTags = getStringArray(rawTravelStyleTags);
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
    ...(travelStyleTags ? { travelStyleTags } : {}),
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on http://0.0.0.0:${PORT}`);
});
