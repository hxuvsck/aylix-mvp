import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_STORAGE_KEY = "aylix_profile";
const LATEST_REVIEW_STORAGE_KEY = "aylix_latest_review";
const TRUST_STORAGE_KEY = "aylix_trust";
const SELECTED_ROLE_STORAGE_KEY = "aylix_selected_role";
const TRAVELER_REQUESTS_STORAGE_KEY = "aylix_traveler_requests";
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

export type SelectedAppRole = "traveler" | "operator";

export type SavedProfile = {
  userId: string;
  displayName: string;
  role: SelectedAppRole;
  city: string;
  roles: string[];
  capabilities: string[];
  personality: string[];
  languages: string[];
  interests: string[];
  vibeTags: string[];
  travelStyle: string[];
  helpTopics: string[];
  isAvailable: boolean;
};

export type SavedTravelerRequest = {
  requestId: string;
  travelerUserId: string;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  intent?: string;
  operatorId?: string;
  operatorDisplayName?: string;
  city?: string;
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

function hasOperatorIntent(profile: {
  roles?: string[];
  capabilities?: string[];
  languages?: string[];
}) {
  return (
    (profile.roles?.length ?? 0) > 0 ||
    (profile.capabilities?.length ?? 0) > 0 ||
    (profile.languages?.length ?? 0) > 0
  );
}

function isOperatorProfileComplete(profile: {
  roles?: string[];
  capabilities?: string[];
  languages?: string[];
}) {
  return (
    (profile.roles?.length ?? 0) > 0 &&
    (profile.capabilities?.length ?? 0) > 0 &&
    (profile.languages?.length ?? 0) > 0
  );
}

function sanitizeProfile(profile: unknown): SavedProfile | null {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const rawProfile = profile as Record<string, unknown>;
  const userId = getTrimmedString(rawProfile.userId);
  const displayName = getTrimmedString(rawProfile.displayName);
  const city = getTrimmedString(rawProfile.city);
  const role = getTrimmedString(rawProfile.role);
  const roles = getStringArray(rawProfile.roles);
  const capabilities = getStringArray(rawProfile.capabilities);
  const languages = getStringArray(rawProfile.languages);

  if (
    !uuidPattern.test(userId) ||
    !displayName ||
    !city ||
    !["traveler", "operator"].includes(role)
  ) {
    return null;
  }

  if (
    hasOperatorIntent({ roles, capabilities, languages }) &&
    !isOperatorProfileComplete({ roles, capabilities, languages })
  ) {
    return null;
  }

  return {
    ...rawProfile,
    userId,
    displayName,
    role: role as SelectedAppRole,
    city,
    roles,
    capabilities,
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

function sanitizeTravelerRequest(request: unknown) {
  if (!request || typeof request !== "object") {
    return null;
  }

  const rawRequest = request as Record<string, unknown>;
  const requestId = getTrimmedString(rawRequest.requestId);
  const travelerUserId = getTrimmedString(rawRequest.travelerUserId);
  const status = getTrimmedString(rawRequest.status);
  const paymentStatus = getTrimmedString(rawRequest.paymentStatus);
  const createdAt = getTrimmedString(rawRequest.createdAt);
  const updatedAt = getTrimmedString(rawRequest.updatedAt);
  const intent = getTrimmedString(rawRequest.intent);
  const operatorId = getTrimmedString(rawRequest.operatorId);
  const operatorDisplayName = getTrimmedString(rawRequest.operatorDisplayName);
  const city = getTrimmedString(rawRequest.city);

  if (!requestId || !travelerUserId || !status || !createdAt || !updatedAt) {
    return null;
  }

  return {
    requestId,
    travelerUserId,
    status,
    ...(paymentStatus ? { paymentStatus } : {}),
    createdAt,
    updatedAt,
    ...(intent ? { intent } : {}),
    ...(operatorId ? { operatorId } : {}),
    ...(operatorDisplayName ? { operatorDisplayName } : {}),
    ...(city ? { city } : {}),
  } satisfies SavedTravelerRequest;
}

export async function saveProfile(profile: unknown) {
  const sanitizedProfile = sanitizeProfile(profile);

  if (!sanitizedProfile) {
    throw new Error("Profile is invalid and could not be saved locally.");
  }

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(sanitizedProfile));
}

export async function updateSavedProfile(updates: Record<string, unknown>) {
  const currentProfile = await getSavedProfile();

  if (!currentProfile) {
    return null;
  }

  const nextProfile = sanitizeProfile({
    ...currentProfile,
    ...updates,
  });

  if (!nextProfile) {
    throw new Error("Updated profile is invalid and could not be saved locally.");
  }

  await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
  return nextProfile;
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

export async function saveSelectedRole(role: SelectedAppRole) {
  await AsyncStorage.setItem(SELECTED_ROLE_STORAGE_KEY, role);
}

export async function getSelectedRole() {
  const raw = await AsyncStorage.getItem(SELECTED_ROLE_STORAGE_KEY);
  return raw === "traveler" || raw === "operator" ? raw : null;
}

export async function clearSelectedRole() {
  await AsyncStorage.removeItem(SELECTED_ROLE_STORAGE_KEY);
}

export async function resetLocalIdentity() {
  await clearSavedProfile();
  await clearSelectedRole();
  await AsyncStorage.removeItem(TRAVELER_REQUESTS_STORAGE_KEY);
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

async function getSavedTravelerRequestsMap() {
  const raw = await AsyncStorage.getItem(TRAVELER_REQUESTS_STORAGE_KEY);

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return Object.entries(parsed).reduce<Record<string, SavedTravelerRequest>>((acc, [key, value]) => {
      const sanitizedRequest = sanitizeTravelerRequest(value);

      if (sanitizedRequest) {
        acc[key] = sanitizedRequest;
      }

      return acc;
    }, {});
  } catch {
    await AsyncStorage.removeItem(TRAVELER_REQUESTS_STORAGE_KEY);
    return {};
  }
}

async function saveTrustMap(trustMap: Record<string, UserTrust>) {
  await AsyncStorage.setItem(TRUST_STORAGE_KEY, JSON.stringify(trustMap));
}

async function saveTravelerRequestsMap(requestMap: Record<string, SavedTravelerRequest>) {
  await AsyncStorage.setItem(TRAVELER_REQUESTS_STORAGE_KEY, JSON.stringify(requestMap));
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

export async function saveTravelerRequest(request: SavedTravelerRequest) {
  const sanitizedRequest = sanitizeTravelerRequest(request);

  if (!sanitizedRequest) {
    throw new Error("Traveler request is invalid and could not be saved locally.");
  }

  const requestMap = await getSavedTravelerRequestsMap();
  const existingRequest = requestMap[sanitizedRequest.requestId];
  requestMap[sanitizedRequest.requestId] = {
    ...sanitizedRequest,
    createdAt: existingRequest?.createdAt ?? sanitizedRequest.createdAt,
  };
  await saveTravelerRequestsMap(requestMap);

  return requestMap[sanitizedRequest.requestId];
}

export async function getSavedTravelerRequests(travelerUserId?: string) {
  const requestMap = await getSavedTravelerRequestsMap();

  return Object.values(requestMap)
    .filter((request) => !travelerUserId || request.travelerUserId === travelerUserId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
