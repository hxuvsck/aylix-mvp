import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { getOperatorInbox, type OperatorInboxItem } from "../../lib/api";
import { getSavedProfile } from "../../lib/storage";

type SavedProfile = {
    userId?: string;
    displayName?: string;
};

const intentLabels: Record<OperatorInboxItem["intent"], string> = {
    food: "Food",
    navigation: "Navigation",
    translation: "Translation",
    explore: "Explore together",
    emergency: "Emergency",
};

export default function OperatorInboxScreen() {
    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [requests, setRequests] = useState<OperatorInboxItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadInbox = async () => {
        try {
            setError("");

            const savedProfile = await getSavedProfile();
            setProfile(savedProfile);

            if (!savedProfile?.userId) {
                setRequests([]);
                return;
            }

            const response = await getOperatorInbox(savedProfile.userId);
            setRequests(response.requests);
        } catch (err: any) {
            setError(err.message ?? "Could not load operator inbox.");
            setRequests([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadInbox();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading operator inbox...</Text>
            </View>
        );
    }

    if (!profile?.userId) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    No local operator profile is available yet. Create a profile first.
                </Text>
                <Button title="Go to onboarding" onPress={() => router.replace("/onboarding")} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Operator inbox</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                Incoming traveler requests nominated to {profile.displayName || "you"}.
            </Text>

            <View style={{ marginBottom: 16 }}>
                <Button title="Refresh inbox" onPress={() => void loadInbox()} />
            </View>

            <View style={{ marginBottom: 16 }}>
                <Button title="Completed sessions" onPress={() => router.push("/operator/history")} />
            </View>

            {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

            {!error && requests.length === 0 ? (
                <View style={{ marginTop: 24 }}>
                    <Text style={{ fontSize: 22, marginBottom: 8 }}>No active requests</Text>
                    <Text style={{ color: "#444", marginBottom: 20 }}>
                        Stay available — new traveler requests will appear here.
                    </Text>
                </View>
            ) : null}

            {requests.map((request) => (
                <View
                    key={request.requestId}
                    style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 12 }}
                >
                    <Text style={{ fontSize: 16, marginBottom: 4 }}>
                        {request.locationSummary}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Traveler: {request.travelerDisplayName || "Traveler"}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Intent: {intentLabels[request.intent]}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Quote: {request.quotedAmount !== undefined ? `$${request.quotedAmount}` : "Not quoted"} {request.currency}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Estimated duration: {request.estimatedDurationMinutes ?? 0} min
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Payment: {request.paymentStatus}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Request status: {request.requestStatus}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Accepted operators: {request.acceptedOperatorsCount}
                    </Text>
                    <Text style={{ marginBottom: 12 }}>
                        {request.description || "No additional details yet."}
                    </Text>
                    <Button
                        title="Respond"
                        onPress={() =>
                            router.push({
                                pathname: "/operator/request",
                                params: {
                                    requestId: request.requestId,
                                    travelerDisplayName: request.travelerDisplayName ?? "",
                                    travelerCity: request.travelerCity ?? "",
                                    locationSummary: request.locationSummary,
                                },
                            })
                        }
                    />
                </View>
            ))}

            <Button title="Back to Operator Home" onPress={() => router.replace("/operator/home")} />
        </ScrollView>
    );
}
