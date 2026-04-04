import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import { getLifecycleStatus, getLifecycleStatusLabel, isActiveLifecycleStatus } from "../../lib/request-status";
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
    updatedAt: string;
    operatorDisplayName?: string;
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
    const currentRequest = requests.find((request) => isActiveLifecycleStatus(request.status)) ?? null;

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading Traveler Home...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Traveler Home</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                {profile?.displayName
                    ? `Welcome back, ${profile.displayName}. Continue your traveler journey from here.`
                    : "Create your traveler profile to begin requesting help."}
            </Text>

            {profile?.displayName ? (
                <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                    <Text style={{ marginBottom: 4 }}>Hello, {profile.displayName}</Text>
                    <Text>City: {profile.city || "Not set"}</Text>
                </View>
            ) : null}

            {currentRequest ? (
                <View style={{ borderWidth: 1, borderColor: "#0a7ea4", padding: 12, marginBottom: 20, backgroundColor: "#e7f6fb" }}>
                    <Text style={{ fontSize: 16, marginBottom: 8 }}>Current Request</Text>
                    <Text style={{ marginBottom: 4 }}>
                        Operator: {currentRequest.operatorDisplayName || "Not selected yet"}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Status: {getLifecycleStatusLabel(currentRequest.status)}
                    </Text>
                    <Text style={{ marginBottom: 12 }}>
                        Updated: {new Date(currentRequest.updatedAt).toLocaleString()}
                    </Text>
                    <Button
                        title={
                            ["accepted", "in_session"].includes(getLifecycleStatus(currentRequest.status))
                                ? "Open Session"
                                : "View Request"
                        }
                        onPress={() =>
                            router.push({
                                pathname:
                                    ["accepted", "in_session"].includes(getLifecycleStatus(currentRequest.status))
                                        ? "/session"
                                        : "/traveler/request",
                                params: { requestId: currentRequest.requestId },
                            })
                        }
                    />
                </View>
            ) : null}

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, marginBottom: 8 }}>Request Summary</Text>
                {requests.length > 0 ? (
                    <>
                        <Text style={{ marginBottom: 4 }}>Total requests: {requests.length}</Text>
                        <Text>
                            Latest request status: {latestRequest ? getLifecycleStatusLabel(latestRequest.status) : "Unknown"}
                        </Text>
                    </>
                ) : (
                    <Text style={{ color: "#444" }}>
                        No requests yet. Tap Find Operator to start your first request.
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
