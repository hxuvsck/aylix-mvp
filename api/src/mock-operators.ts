type MockRole = "guide" | "local" | "expert" | "companion";

type MockOperatorSeed = {
  email: string;
  profile: {
    displayName: string;
    city: string;
    isAvailable: boolean;
    roles: MockRole[];
    capabilities: string[];
    personality: string[];
    trustScore: number;
    languages: string[];
    interests: string[];
    vibeTags: string[];
    travelStyle: string[];
    helpTopics: string[];
  };
};

// Curated operator-capable profiles for QA.
// These keep the app's existing API contract and use the onboarding option strings
// for structured profile fields. Human-friendly source labels like "local_guide"
// are mapped into valid internal roles/capabilities here.
export const mockOperatorSeeds: MockOperatorSeed[] = [
  {
    email: "ariunaa.qa@test.com",
    profile: {
      displayName: "Ariunaa",
      city: "Seoul",
      isAvailable: true,
      roles: ["local", "guide"],
      capabilities: ["food", "explore"],
      personality: ["talkative", "curious"],
      trustScore: 4.6,
      languages: ["English", "Korean"],
      travelStyle: ["Food & Dining", "Nightlife"],
      interests: ["Food", "Nightlife"],
      vibeTags: ["Energetic", "Social"],
      helpTopics: ["Food & Restaurants", "Nightlife", "Local Recommendations"],
    },
  },
  {
    email: "bat-erdene.qa@test.com",
    profile: {
      displayName: "Bat-Erdene",
      city: "Tokyo",
      isAvailable: true,
      roles: ["expert", "guide"],
      capabilities: ["translation", "navigation"],
      personality: ["calm", "fast"],
      trustScore: 4.7,
      languages: ["English", "Japanese"],
      travelStyle: ["Standard", "Cultural"],
      interests: ["Culture", "History"],
      vibeTags: ["Professional", "Calm"],
      helpTopics: ["Translation Help", "City Navigation"],
    },
  },
  {
    email: "sara.qa@test.com",
    profile: {
      displayName: "Sara",
      city: "Paris",
      isAvailable: true,
      roles: ["expert", "guide"],
      capabilities: ["food", "explore", "translation"],
      personality: ["talkative", "calm"],
      trustScore: 4.8,
      languages: ["English", "French"],
      travelStyle: ["Luxury"],
      interests: ["Shopping", "Food"],
      vibeTags: ["Luxury", "Friendly"],
      helpTopics: ["Shopping", "Food & Restaurants", "Local Recommendations"],
    },
  },
  {
    email: "temuulen.qa@test.com",
    profile: {
      displayName: "Temuulen",
      city: "Bangkok",
      isAvailable: true,
      roles: ["local", "companion"],
      capabilities: ["navigation", "explore", "food"],
      personality: ["chill", "talkative"],
      trustScore: 4.3,
      languages: ["English"],
      travelStyle: ["Budget"],
      interests: ["Local Living", "Food"],
      vibeTags: ["Flexible", "Friendly"],
      helpTopics: ["City Navigation", "Transport Guidance", "Local Recommendations"],
    },
  },
  {
    email: "nara.qa@test.com",
    profile: {
      displayName: "Nara",
      city: "Berlin",
      isAvailable: true,
      roles: ["guide", "expert"],
      capabilities: ["explore", "navigation"],
      personality: ["calm", "curious"],
      trustScore: 4.5,
      languages: ["English", "German"],
      travelStyle: ["Cultural"],
      interests: ["History", "Culture"],
      vibeTags: ["Calm", "Professional"],
      helpTopics: ["Culture & History", "City Navigation"],
    },
  },
  {
    email: "jason.qa@test.com",
    profile: {
      displayName: "Jason",
      city: "New York",
      isAvailable: true,
      roles: ["expert", "local"],
      capabilities: ["translation", "navigation"],
      personality: ["fast", "calm"],
      trustScore: 4.4,
      languages: ["English"],
      travelStyle: ["Business"],
      interests: ["Events", "Local Living"],
      vibeTags: ["Professional"],
      helpTopics: ["Business Assistance", "Trip Planning"],
    },
  },
  {
    email: "munkh.qa@test.com",
    profile: {
      displayName: "Munkh",
      city: "Ulaanbaatar",
      isAvailable: true,
      roles: ["expert", "local"],
      capabilities: ["emergency", "translation"],
      personality: ["calm", "fast"],
      trustScore: 4.9,
      languages: ["English", "Mongolian"],
      travelStyle: ["Standard"],
      interests: ["Local Living"],
      vibeTags: ["Calm"],
      helpTopics: ["Emergency Help", "Translation Help"],
    },
  },
  {
    email: "lina.qa@test.com",
    profile: {
      displayName: "Lina",
      city: "Bali",
      isAvailable: true,
      roles: ["guide", "companion"],
      capabilities: ["explore", "navigation"],
      personality: ["calm", "curious"],
      trustScore: 4.5,
      languages: ["English"],
      travelStyle: ["Nature", "Relaxation"],
      interests: ["Nature", "Wellness"],
      vibeTags: ["Calm", "Friendly"],
      helpTopics: ["Local Recommendations", "Trip Planning"],
    },
  },
  {
    email: "kenji.qa@test.com",
    profile: {
      displayName: "Kenji",
      city: "Osaka",
      isAvailable: false,
      roles: ["guide", "local"],
      capabilities: ["food", "explore"],
      personality: ["talkative", "curious"],
      trustScore: 4.6,
      languages: ["English", "Japanese"],
      travelStyle: ["Food & Dining"],
      interests: ["Food"],
      vibeTags: ["Energetic"],
      helpTopics: ["Food & Restaurants", "Local Recommendations"],
    },
  },
] satisfies MockOperatorSeed[];
