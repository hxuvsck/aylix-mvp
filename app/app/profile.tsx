import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, ScrollView, Text, View } from "react-native";
import { getMatches, type Match } from "../lib/api";
import { clearSavedProfile, getSavedProfile } from "../lib/storage";

type ProfileData = {
    userId?: string;
    displayName?: string;
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

export default function ProfileScreen() {
    const params = useLocalSearchParams<{
        userId?: string;
        displayName?: string;
        city?: string;
        languages?: string;
        interests?: string;
        vibeTags?: string;
        travelStyle?: string;
        helpTopics?: string;
    }>();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [matchesError, setMatchesError] = useState("");
    const [isFindingMatches, setIsFindingMatches] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (params.userId) {
                setProfile({
                    userId: params.userId,
                    displayName: params.displayName,
                    city: params.city,
                    languages: safeParseArray(params.languages),
                    interests: safeParseArray(params.interests),
                    vibeTags: safeParseArray(params.vibeTags),
                    travelStyle: safeParseArray(params.travelStyle),
                    helpTopics: safeParseArray(params.helpTopics),
                });
                return;
            }

            const saved = await getSavedProfile();
            setProfile(saved);
        };

        void loadProfile();
    }, [params]);

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
            setMatches(response.matches);
        } catch (err: any) {
            setMatches([]);
            setMatchesError(err.message ?? "Could not load matches.");
        } finally {
            setIsFindingMatches(false);
        }
    };

    if (!profile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading profile...</Text>
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

                <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>Top matches</Text>

                {matchesError ? <Text style={{ marginBottom: 12 }}>ERROR: {matchesError}</Text> : null}

                {!matchesError && matches.length === 0 ? (
                    <Text style={{ marginBottom: 20, color: "#444" }}>
                        No strong matches yet. Try adjusting your profile or create more users.
                    </Text>
                ) : null}

                {matches.map((match) => (
                    <View
                        key={match.userId}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 4 }}>{match.displayName}</Text>
                        <Text style={{ marginBottom: 4 }}>City: {match.city ?? "Unknown"}</Text>
                        <Text style={{ marginBottom: 4 }}>Score: {match.score}</Text>
                        <Text>Reasons: {(match.reasons ?? []).join(", ")}</Text>
                    </View>
                ))}

                <Button title="Reset and start over" onPress={handleReset} />
            </View>
        </ScrollView>
    );
}
