import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_STORAGE_KEY = "aylix_profile";
const LATEST_REVIEW_STORAGE_KEY = "aylix_latest_review";
const TRUST_STORAGE_KEY = "aylix_trust";
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DEFAULT_TRUST_SCORE = 4.5;
export const DEFAULT_REVIEW_COUNT = 1;

export type LatestReview = {
  userId: string;
  displayName: string;
  city?: string;
  score?: string;
  reasons?: string[];
  rating: number;
  helpfulText: string;
  submittedAt: string;
};

export type UserTrust = {
  trustScore: number;
  reviewCount: number;
};

function getTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizeProfile(profile: unknown) {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const rawProfile = profile as Record<string, unknown>;
  const userId = getTrimmedString(rawProfile.userId);
  const displayName = getTrimmedString(rawProfile.displayName);

  if (!uuidPattern.test(userId) || !displayName) {
    return null;
  }

  const city = getTrimmedString(rawProfile.city);

  return {
    ...rawProfile,
    userId,
    displayName,
    ...(city ? { city } : {}),
    roles: getStringArray(rawProfile.roles),
    capabilities: getStringArray(rawProfile.capabilities),
    personality: getStringArray(rawProfile.personality),
    languages: getStringArray(rawProfile.languages),
    interests: getStringArray(rawProfile.interests),
    vibeTags: getStringArray(rawProfile.vibeTags),
    travelStyle: getStringArray(rawProfile.travelStyle),
    helpTopics: getStringArray(rawProfile.helpTopics),
    isAvailable: rawProfile.isAvailable === false ? false : true,
  };
}

function sanitizeReview(review: unknown) {
  if (!review || typeof review !== "object") {
    return null;
  }

  const rawReview = review as Record<string, unknown>;
  const userId = getTrimmedString(rawReview.userId);
  const displayName = getTrimmedString(rawReview.displayName);
  const helpfulText = getTrimmedString(rawReview.helpfulText);
  const rating =
    typeof rawReview.rating === "number" && Number.isInteger(rawReview.rating)
      ? rawReview.rating
      : null;

  if (!uuidPattern.test(userId) || !displayName || rating === null || rating < 1 || rating > 5) {
    return null;
  }

  const city = getTrimmedString(rawReview.city);
  const score = getTrimmedString(rawReview.score);
  const submittedAt = getTrimmedString(rawReview.submittedAt);

  if (!submittedAt) {
    return null;
  }

  return {
    userId,
    displayName,
    ...(city ? { city } : {}),
    ...(score ? { score } : {}),
    reasons: getStringArray(rawReview.reasons),
    rating,
    helpfulText,
    submittedAt,
  } satisfies LatestReview;
}

export async function saveProfile(profile: unknown) {
  const sanitizedProfile = sanitizeProfile(profile);

  if (!sanitizedProfile) {
    throw new Error("Profile is invalid and could not be saved locally.");
  }

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitizedProfile));
}

export async function getSavedProfile() {
  const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitizedProfile = sanitizeProfile(parsed);

    if (!sanitizedProfile) {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      return null;
    }

    return sanitizedProfile;
  } catch {
    await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
    return null;
  }
}

export async function clearSavedProfile() {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}

export async function saveLatestReview(review: LatestReview) {
  const sanitizedReview = sanitizeReview(review);

  if (!sanitizedReview) {
    throw new Error("Review is invalid and could not be saved locally.");
  }

  await AsyncStorage.setItem(LATEST_REVIEW_STORAGE_KEY, JSON.stringify(sanitizedReview));
}

export async function getLatestReview() {
  const raw = await AsyncStorage.getItem(LATEST_REVIEW_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const sanitizedReview = sanitizeReview(parsed);

    if (!sanitizedReview) {
      await AsyncStorage.removeItem(LATEST_REVIEW_STORAGE_KEY);
      return null;
    }

    return sanitizedReview;
  } catch {
    await AsyncStorage.removeItem(LATEST_REVIEW_STORAGE_KEY);
    return null;
  }
}

async function getSavedTrustMap() {
  const raw = await AsyncStorage.getItem(TRUST_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Record<string, UserTrust>) : {};
}

async function saveTrustMap(trustMap: Record<string, UserTrust>) {
  await AsyncStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(trustMap));
}

export async function getUserTrust(userId?: string) {
  if (!userId) {
    return {
      trustScore: DEFAULT_TRUST_SCORE,
      reviewCount: DEFAULT_REVIEW_COUNT,
    };
  }

  const trustMap = await getSavedTrustMap();

  return (
    trustMap[userId] ?? {
      trustScore: DEFAULT_TRUST_SCORE,
      reviewCount: DEFAULT_REVIEW_COUNT,
    }
  );
}

export async function updateUserTrust(userId: string, rating: number) {
  const trustMap = await getSavedTrustMap();
  const currentTrust =
    trustMap[userId] ?? {
      trustScore: DEFAULT_TRUST_SCORE,
      reviewCount: DEFAULT_REVIEW_COUNT,
    };

  const updatedTrust: UserTrust = {
    trustScore: Number(((currentTrust.trustScore + rating) / 2).toFixed(1)),
    reviewCount: currentTrust.reviewCount + 1,
  };

  trustMap[userId] = updatedTrust;
  await saveTrustMap(trustMap);

  return updatedTrust;
}
