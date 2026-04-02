import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import { getMatches, type Match } from "../lib/api";
import {
    clearSavedProfile,
    DEFAULT_REVIEW_COUNT,
    DEFAULT_TRUST_SCORE,
    getLatestReview,
    getSavedProfile,
    getUserTrust,
    type LatestReview,
} from "../lib/storage";

type ProfileData = {
    userId?: string;
    displayName?: string;
    isAvailable?: boolean;
    city?: string;
    languages?: string[];
    interests?: string[];
    vibeTags?: string[];
    travelStyle?: string[];
    helpTopics?: string[];
    trustScore?: number;
    reviewCount?: number;
};

type MatchWithTrust = Match & {
    trustScore?: number;
    reviewCount?: number;
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

function normalizeProfile(profile?: ProfileData | null) {
    if (!profile) {
        return null;
    }

    return {
        ...profile,
        isAvailable: profile.isAvailable ?? true,
        trustScore: profile.trustScore ?? DEFAULT_TRUST_SCORE,
        reviewCount: profile.reviewCount ?? DEFAULT_REVIEW_COUNT,
    };
}

export default function ProfileScreen() {
    const params = useLocalSearchParams<{
        userId?: string | string[];
        displayName?: string | string[];
        isAvailable?: string | string[];
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
    const [matches, setMatches] = useState<MatchWithTrust[]>([]);
    const [matchesError, setMatchesError] = useState("");
    const [isFindingMatches, setIsFindingMatches] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const {
                userId: rawUserId,
                displayName: rawDisplayName,
                isAvailable: rawIsAvailable,
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

    const handleFindMatches = async () => {
        if (!profile?.userId) {
            setMatches([]);
            setMatchesError("Profile is missing a user ID.");
            return;
        }

        try {
            setIsFindingMatches(true);
            setMatchesError("");

            const response = await getMatches(profile.userId);
            const matchesWithTrust = await Promise.all(
                response.matches.map(async (match) => {
                    const trust = await getUserTrust(match.userId);

                    return {
                        ...match,
                        trustScore: trust.trustScore,
                        reviewCount: trust.reviewCount,
                    };
                })
            );

            setMatches(matchesWithTrust);
        } catch (err: any) {
            setMatches([]);
            setMatchesError(err.message ?? "Could not load matches.");
        } finally {
            setIsFindingMatches(false);
        }
    };

    const handleStartCall = (match: Match) => {
        router.push({
            pathname: "/call",
            params: {
                userId: match.userId,
                displayName: match.displayName,
                city: match.city ?? "",
                score: String(match.score),
                reasons: JSON.stringify(match.reasons ?? []),
            },
        });
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
                <Text style={{ marginBottom: 8 }}>Languages: {(profile.languages ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 8 }}>Interests: {(profile.interests ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 8 }}>Vibe: {(profile.vibeTags ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 8 }}>Travel style: {(profile.travelStyle ?? []).join(", ")}</Text>
                <Text style={{ marginBottom: 20 }}>Help topics: {(profile.helpTopics ?? []).join(", ")}</Text>

                <Button
                    title={isFindingMatches ? "Finding matches..." : "Find Matches"}
                    onPress={handleFindMatches}
                    disabled={isFindingMatches}
                />
                {isFindingMatches ? (
                    <Text style={{ marginTop: 12, color: "#444" }}>Looking for strong matches...</Text>
                ) : null}

                <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>Top matches</Text>

                {matchesError ? <Text style={{ marginBottom: 12 }}>ERROR: {matchesError}</Text> : null}

                {!matchesError && !isFindingMatches && matches.length === 0 ? (
                    <Text style={{ marginBottom: 20, color: "#444" }}>
                        No strong matches yet. Try adjusting your profile or create more users.
                    </Text>
                ) : null}

                {!matchesError && !isFindingMatches && matches.length > 0 ? matches.map((match) => (
                    <View
                        key={match.userId}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 4 }}>{match.displayName}</Text>
                        <Text style={{ marginBottom: 4 }}>City: {match.city ?? "Unknown"}</Text>
                        <Text style={{ marginBottom: 4 }}>Available now</Text>
                        <Text style={{ marginBottom: 4 }}>Score: {match.score}</Text>
                        <Text style={{ marginBottom: 4 }}>
                            ⭐ {match.trustScore ?? DEFAULT_TRUST_SCORE} ({match.reviewCount ?? DEFAULT_REVIEW_COUNT} reviews)
                        </Text>
                        <Text style={{ marginBottom: 12 }}>Reasons: {(match.reasons ?? []).join(", ")}</Text>
                        <Button title="Start Call" onPress={() => handleStartCall(match)} />
                    </View>
                )) : null}

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
