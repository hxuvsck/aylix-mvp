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
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile</Text>

            <Text style={{ marginBottom: 8 }}>User ID: {profile.userId}</Text>
            <Text style={{ marginBottom: 8 }}>Name: {profile.displayName}</Text>
            <Text style={{ marginBottom: 8 }}>City: {profile.city}</Text>
            <Text style={{ marginBottom: 8 }}>Languages: {(profile.languages ?? []).join(", ")}</Text>
            <Text style={{ marginBottom: 20 }}>Interests: {(profile.interests ?? []).join(", ")}</Text>

            <Button title="Reset Profile" onPress={handleReset} />
        </View>
    );
}
