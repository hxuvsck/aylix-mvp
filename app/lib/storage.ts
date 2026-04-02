import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_STORAGE_KEY = "aylix_profile";
const LATEST_REVIEW_STORAGE_KEY = "aylix_latest_review";

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
