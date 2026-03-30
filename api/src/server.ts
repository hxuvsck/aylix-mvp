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

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aylix-api",
    timestamp: new Date().toISOString(),
  });
});

app.post("/users", (req, res) => {
  const { email, phone, role } = req.body;

  const user: User = {
    id: Date.now().toString(),
    email,
    phone,
    role,
  };

  users.push(user);
  res.status(201).json(user);
});

app.post("/profiles", (req, res) => {
  const {
    userId,
    displayName,
    bio,
    city,
    countryCode,
    languages,
    interests,
    vibeTags,
    travelStyleTags,
    helpTopics,
  } = req.body;

  const profile: Profile = {
    id: Date.now().toString(),
    userId,
    displayName,
    bio,
    city,
    countryCode,
    languages,
    interests,
    vibeTags,
    travelStyleTags,
    helpTopics,
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