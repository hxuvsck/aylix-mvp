import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { getSavedProfile, resetLocalIdentity } from "../../lib/storage";

type SavedProfile = {
    displayName?: string;
    userId?: string;
    role?: "traveler" | "operator";
};

export default function TravelerHomeScreen() {
    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setProfile(await getSavedProfile());
            setIsLoading(false);
        };

        void loadProfile();
    }, []);

    const handleStartOver = async () => {
        await resetLocalIdentity();
        router.replace("/entry");
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading traveler home...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Traveler Home</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                {profile?.displayName
                    ? `Continue as ${profile.displayName} and explore the traveler flow.`
                    : "Create a profile when needed, then use the traveler flow."}
            </Text>

            {!profile?.userId ? (
                <View style={{ marginBottom: 12 }}>
                    <Button title="Create Profile" onPress={() => router.push("/onboarding")} />
                </View>
            ) : null}

            <View style={{ marginBottom: 12 }}>
                <Button title="Find Operator" onPress={() => router.push("/request")} />
            </View>

            <View style={{ marginBottom: 12 }}>
                <Button title="My Requests" onPress={() => router.push("/traveler/requests")} />
            </View>

            <Button title="Start Over" onPress={() => void handleStartOver()} />
        </View>
    );
}
