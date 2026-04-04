import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { getOperatorInbox } from "../../lib/api";
import { getSavedProfile, resetLocalIdentity, updateSavedProfile } from "../../lib/storage";

type SavedProfile = {
    displayName?: string;
    userId?: string;
    isAvailable?: boolean;
    role?: "traveler" | "operator";
    city?: string;
};

export default function OperatorHomeScreen() {
    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAvailable, setIsAvailable] = useState(true);
    const [incomingCount, setIncomingCount] = useState(0);

    useEffect(() => {
        const loadProfile = async () => {
            const savedProfile = await getSavedProfile();
            setProfile(savedProfile);
            setIsAvailable(savedProfile?.isAvailable !== false);
            if (savedProfile?.userId) {
                const response = await getOperatorInbox(savedProfile.userId).catch(() => ({ requests: [] }));
                setIncomingCount(response.requests.length);
            }
            setIsLoading(false);
        };

        void loadProfile();
    }, []);

    const handleToggleAvailability = async () => {
        const nextIsAvailable = !isAvailable;
        setIsAvailable(nextIsAvailable);

        const updatedProfile = await updateSavedProfile({ isAvailable: nextIsAvailable });
        if (updatedProfile) {
            setProfile(updatedProfile);
        }
    };

    const handleStartOver = async () => {
        await resetLocalIdentity();
        router.replace("/entry");
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading operator home...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Operator Home</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                {profile?.displayName
                    ? `Continue as ${profile.displayName} and manage operator flow.`
                    : "Create a profile when needed, then use the operator flow."}
            </Text>

            {profile?.displayName ? (
                <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                    <Text style={{ marginBottom: 4 }}>Hello, {profile.displayName}</Text>
                    <Text style={{ marginBottom: 4 }}>City: {profile.city || "Not set"}</Text>
                    <Text>Availability: {isAvailable ? "Available" : "Not Available"}</Text>
                </View>
            ) : null}

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, marginBottom: 8 }}>Operator Summary</Text>
                <Text style={{ marginBottom: 4 }}>Incoming requests: {incomingCount}</Text>
                <Text>Current availability: {isAvailable ? "Available" : "Not Available"}</Text>
            </View>

            {!profile?.userId ? (
                <View style={{ marginBottom: 12 }}>
                    <Button title="Create Profile" onPress={() => router.push("/onboarding")} />
                </View>
            ) : null}

            <View style={{ marginBottom: 12 }}>
                <Button title="Inbox" onPress={() => router.push("/operator/inbox")} />
            </View>

            <Text style={{ marginBottom: 8 }}>
                Availability: {isAvailable ? "Available" : "Not Available"}
            </Text>
            <View style={{ marginBottom: 24 }}>
                <Button
                    title={isAvailable ? "Set Not Available" : "Set Available"}
                    onPress={() => void handleToggleAvailability()}
                />
            </View>

            <View style={{ marginBottom: 12 }}>
                <Button title="Profile" onPress={() => router.push("/profile")} />
            </View>

            <Button title="Start Over" onPress={() => void handleStartOver()} />
        </View>
    );
}
