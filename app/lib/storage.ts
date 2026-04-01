import AsyncStorage from "@react-native-async-storage/async-storage";

const PROFILE_STORAGE_KEY = "aylix_profile";

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
