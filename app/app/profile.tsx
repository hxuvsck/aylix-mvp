import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";
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

    if (!profile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading profile...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "white", justifyContent: "center" }}>
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

            <Button title="Reset and start over" onPress={handleReset} />
        </View>
    );
}
