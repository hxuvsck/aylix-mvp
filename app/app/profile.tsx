import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import {
    resetLocalIdentity,
    getLatestReview,
    getSavedProfile,
    type LatestReview,
} from "../lib/storage";

type ProfileData = {
    userId?: string;
    displayName?: string;
    role?: "traveler" | "operator";
    isAvailable?: boolean;
    roles?: string[];
    capabilities?: string[];
    personality?: string[];
    trustScore?: number;
    hasExperience?: boolean;
    experienceNote?: string;
    responseSample?: string;
    availabilitySlots?: string[];
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
        role?: string | string[];
        hasExperience?: string | string[];
        experienceNote?: string | string[];
        responseSample?: string | string[];
        availabilitySlots?: string | string[];
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
                role: rawRole,
                hasExperience: rawHasExperience,
                experienceNote: rawExperienceNote,
                responseSample: rawResponseSample,
                availabilitySlots: rawAvailabilitySlots,
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
            const role = getSingleParam(rawRole);
            const hasExperience = getBooleanParam(rawHasExperience);
            const experienceNote = getSingleParam(rawExperienceNote);
            const responseSample = getSingleParam(rawResponseSample);
            const availabilitySlots = getSingleParam(rawAvailabilitySlots);
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
                        role: role === "operator" || role === "traveler" ? role : undefined,
                        isAvailable,
                        roles,
                        capabilities,
                        personality,
                        trustScore,
                        hasExperience,
                        experienceNote,
                        responseSample,
                        availabilitySlots: safeParseArray(availabilitySlots),
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
        await resetLocalIdentity();
        router.replace("/entry");
    };

    if (isLoadingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading Profile...</Text>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    No saved profile was found. Return to Entry to create a profile and continue.
                </Text>
                <Button title="Back to Entry" onPress={() => router.replace("/entry")} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, justifyContent: "center", flexGrow: 1 }}
        >
            <View>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>Profile</Text>
                <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                    This is the local demo profile the app is using right now.
                </Text>

                <Text style={{ marginBottom: 8 }}>Display name: {profile.displayName}</Text>
                <Text style={{ marginBottom: 8 }}>Role: {profile.role}</Text>
                <Text style={{ marginBottom: 8 }}>City: {profile.city}</Text>
                {profile.role === "operator" ? (
                    <>
                        <Text style={{ marginBottom: 8 }}>
                            Availability: {profile.isAvailable === false ? "Not available" : "Available to help"}
                        </Text>
                        <Text style={{ marginBottom: 8 }}>
                            Experience: {profile.hasExperience ? "Has prior experience" : "No prior experience noted"}
                        </Text>
                        <Text style={{ marginBottom: 8 }}>
                            Availability slots: {(profile.availabilitySlots ?? []).join(", ") || "Not set"}
                        </Text>
                        <Text style={{ marginBottom: 8 }}>
                            Experience note: {profile.experienceNote || "No experience note added"}
                        </Text>
                        <Text style={{ marginBottom: 8 }}>
                            Response sample: {profile.responseSample || "No response sample added"}
                        </Text>
                    </>
                ) : null}
                <Text style={{ marginBottom: 8 }}>User ID: {profile.userId}</Text>
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

                <Button
                    title="Completed sessions"
                    onPress={() => router.push("/history")}
                />
                <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>
                    Review your completed traveler sessions and submitted ratings.
                </Text>

                <Button
                    title="Operator history"
                    onPress={() => router.push("/operator/history")}
                />
                <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>
                    View completed sessions where you were selected as the operator.
                </Text>

                <Button
                    title="Operator earnings"
                    onPress={() => router.push("/operator/earnings")}
                />
                <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>
                    See mock earnings from completed paid operator sessions.
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

                <Button title="Start Over" onPress={handleReset} />
            </View>
        </ScrollView>
    );
}
