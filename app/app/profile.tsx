import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import {
    clearSavedProfile,
    getLatestReview,
    getSavedProfile,
    type LatestReview,
} from "../lib/storage";

type ProfileData = {
    userId?: string;
    displayName?: string;
    isAvailable?: boolean;
    roles?: string[];
    capabilities?: string[];
    personality?: string[];
    trustScore?: number;
    city?: string;
    languages?: string[];
    interests?: string[];
    vibeTags?: string[];
    travelStyle?: string[];
    helpTopics?: string[];
};

function safeParseArray(value?: string) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getSingleParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function getBooleanParam(value?: string | string[]) {
    const param = getSingleParam(value);

    if (param === "false") {
        return false;
    }

    if (param === "true") {
        return true;
    }

    return undefined;
}

function getNumberParam(value?: string | string[]) {
    const param = getSingleParam(value);
    if (!param) {
        return undefined;
    }

    const parsed = Number(param);
    return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeProfile(profile?: ProfileData | null) {
    if (!profile) {
        return null;
    }

    return {
        ...profile,
        isAvailable: profile.isAvailable ?? true,
        roles: profile.roles ?? [],
        capabilities: profile.capabilities ?? [],
        personality: profile.personality ?? [],
        trustScore: profile.trustScore ?? 0,
    };
}

export default function ProfileScreen() {
    const params = useLocalSearchParams<{
        userId?: string | string[];
        displayName?: string | string[];
        isAvailable?: string | string[];
        roles?: string | string[];
        capabilities?: string | string[];
        personality?: string | string[];
        trustScore?: string | string[];
        city?: string | string[];
        languages?: string | string[];
        interests?: string | string[];
        vibeTags?: string | string[];
        travelStyle?: string | string[];
        helpTopics?: string | string[];
    }>();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [latestReview, setLatestReview] = useState<LatestReview | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const {
                userId: rawUserId,
                displayName: rawDisplayName,
                isAvailable: rawIsAvailable,
                roles: rawRoles,
                capabilities: rawCapabilities,
                personality: rawPersonality,
                trustScore: rawTrustScore,
                city: rawCity,
                languages: rawLanguages,
                interests: rawInterests,
                vibeTags: rawVibeTags,
                travelStyle: rawTravelStyle,
                helpTopics: rawHelpTopics,
            } = params;

            const userId = getSingleParam(rawUserId);
            const displayName = getSingleParam(rawDisplayName);
            const isAvailable = getBooleanParam(rawIsAvailable);
            const roles = safeParseArray(getSingleParam(rawRoles));
            const capabilities = safeParseArray(getSingleParam(rawCapabilities));
            const personality = safeParseArray(getSingleParam(rawPersonality));
            const trustScore = getNumberParam(rawTrustScore);
            const city = getSingleParam(rawCity);
            const languages = getSingleParam(rawLanguages);
            const interests = getSingleParam(rawInterests);
            const vibeTags = getSingleParam(rawVibeTags);
            const travelStyle = getSingleParam(rawTravelStyle);
            const helpTopics = getSingleParam(rawHelpTopics);

            if (userId) {
                setProfile(
                    normalizeProfile({
                        userId,
                        displayName,
                        isAvailable,
                        roles,
                        capabilities,
                        personality,
                        trustScore,
                        city,
                        languages: safeParseArray(languages),
                        interests: safeParseArray(interests),
                        vibeTags: safeParseArray(vibeTags),
                        travelStyle: safeParseArray(travelStyle),
                        helpTopics: safeParseArray(helpTopics),
                    })
                );
                setLatestReview(await getLatestReview());
                setIsLoadingProfile(false);
                return;
            }

            const saved = await getSavedProfile();
            setProfile(normalizeProfile(saved));
            setLatestReview(await getLatestReview());
            setIsLoadingProfile(false);
        };

        void loadProfile();
    }, []);

    const handleReset = async () => {
        await clearSavedProfile();
        router.replace("/onboarding");
    };

    if (isLoadingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    No saved profile was found. Create a profile to continue.
                </Text>
                <Button title="Go to onboarding" onPress={() => router.replace("/onboarding")} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, justifyContent: "center", flexGrow: 1 }}
        >
            <View>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>Your Aylix profile</Text>
                <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                    This is the local profile the app will use for the current MVP matching flow.
                </Text>

                <Text style={{ marginBottom: 8 }}>User ID: {profile.userId}</Text>
                <Text style={{ marginBottom: 8 }}>Name: {profile.displayName}</Text>
                <Text style={{ marginBottom: 8 }}>
                    Availability: {profile.isAvailable === false ? "Not available" : "Available to help"}
                </Text>
                <Text style={{ marginBottom: 8 }}>City: {profile.city}</Text>
                <Text style={{ marginBottom: 8 }}>Roles: {(profile.roles ?? []).join(", ") || "None set"}</Text>
                <Text style={{ marginBottom: 8 }}>
                    Capabilities: {(profile.capabilities ?? []).join(", ") || "None set"}
                </Text>
                <Text style={{ marginBottom: 8 }}>
                    Personality: {(profile.personality ?? []).join(", ") || "None set"}
                </Text>
                <Text style={{ marginBottom: 8 }}>Languages: {(profile.languages ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 8 }}>Interests: {(profile.interests ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 8 }}>Vibe: {(profile.vibeTags ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 8 }}>Travel style: {(profile.travelStyle ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 20 }}>Help topics: {(profile.helpTopics ?? []).join(", ")}</Text>

                <Button
                    title="What do you need?"
                    onPress={() => router.push("/request")}
                />
                <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>
                    Start a request to find available operators by intent.
                </Text>

                <Button
                    title="Open operator inbox"
                    onPress={() => router.push("/operator/inbox")}
                />
                <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>
                    View traveler requests that are currently nominated to you.
                </Text>

                {latestReview ? (
                    <View style={{ marginTop: 24, marginBottom: 20 }}>
                        <Text style={{ fontSize: 22, marginBottom: 12 }}>Latest review</Text>
                        <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>{latestReview.displayName}</Text>
                            <Text style={{ marginBottom: 4 }}>Rating: {latestReview.rating}</Text>
                            <Text>Helpful: {latestReview.helpfulText || "No note added"}</Text>
                        </View>
                    </View>
                ) : null}

                <Button title="Reset and start over" onPress={handleReset} />
            </View>
        </ScrollView>
    );
}
