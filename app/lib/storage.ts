import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_STORAGE_KEY = "aylix_profile";
const LATEST_REVIEW_STORAGE_KEY = "aylix_latest_review";
const TRUST_STORAGE_KEY = "aylix_trust";

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

export async function saveProfile(profile: unknown) {
  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export async function getSavedProfile() {
  const raw = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearSavedProfile() {
  await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
}

export async function saveLatestReview(review: LatestReview) {
  await AsyncStorage.setItem(LATEST_REVIEW_STORAGE_KEY, JSON.stringify(review));
}

export async function getLatestReview() {
  const raw = await AsyncStorage.getItem(LATEST_REVIEW_STORAGE_KEY);
  return raw ? (JSON.parse(raw) as LatestReview) : null;
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
