import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { getSavedProfile, getSavedTravelerRequests, resetLocalIdentity } from "../../lib/storage";

type SavedProfile = {
    displayName?: string;
    userId?: string;
    role?: "traveler" | "operator";
    city?: string;
};

type SavedTravelerRequest = {
    requestId: string;
    status: string;
    createdAt: string;
};

export default function TravelerHomeScreen() {
    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [requests, setRequests] = useState<SavedTravelerRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const savedProfile = await getSavedProfile();
            setProfile(savedProfile);
            setRequests(await getSavedTravelerRequests(savedProfile?.userId));
            setIsLoading(false);
        };

        void loadProfile();
    }, []);

    const handleStartOver = async () => {
        await resetLocalIdentity();
        router.replace("/entry");
    };

    const latestRequest = requests[0] ?? null;

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

            {profile?.displayName ? (
                <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                    <Text style={{ marginBottom: 4 }}>Hello, {profile.displayName}</Text>
                    <Text>City: {profile.city || "Not set"}</Text>
                </View>
            ) : null}

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, marginBottom: 8 }}>Request Summary</Text>
                {requests.length > 0 ? (
                    <>
                        <Text style={{ marginBottom: 4 }}>Total requests: {requests.length}</Text>
                        <Text>
                            Latest request status: {latestRequest?.status || "Unknown"}
                        </Text>
                    </>
                ) : (
                    <Text style={{ color: "#444" }}>
                        No requests yet. Start by finding an operator.
                    </Text>
                )}
            </View>

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

            <View style={{ marginBottom: 12 }}>
                <Button title="Profile" onPress={() => router.push("/profile")} />
            </View>

            <Button title="Start Over" onPress={() => void handleStartOver()} />
        </View>
    );
}
