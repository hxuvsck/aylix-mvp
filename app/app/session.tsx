import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import {
    getReservedSessionSummary,
    startRequestSession,
    type HelpIntent,
    type ReservedSessionSummary,
} from "../lib/api";
import { getSavedProfile } from "../lib/storage";

type SavedProfile = {
    userId?: string;
    displayName?: string;
};

const intentLabels: Record<HelpIntent, string> = {
    food: "Food",
    navigation: "Navigation",
    translation: "Translation",
    explore: "Explore together",
    emergency: "Emergency",
};

function getSingleParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

export default function SessionScreen() {
    const params = useLocalSearchParams<{ requestId?: string | string[] }>();
    const requestId = getSingleParam(params.requestId);

    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [summary, setSummary] = useState<ReservedSessionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadSummary = async () => {
        if (!requestId) {
            setIsLoading(false);
            return;
        }

        try {
            setError("");
            const savedProfile = await getSavedProfile();
            setProfile(savedProfile);
            const response = await getReservedSessionSummary(requestId, savedProfile?.userId);
            setSummary(response.summary);
        } catch (err: any) {
            setError(err.message ?? "Could not load reserved session.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadSummary();
    }, [requestId]);

    const handleStartSession = async () => {
        if (!requestId || !summary?.selectedOperatorId) {
            return;
        }

        try {
            setError("");
            await startRequestSession(requestId, {
                operatorId: summary.selectedOperatorId,
                userId: profile?.userId,
            });

            router.push({
                pathname: "/call",
                params: {
                    requestId,
                    userId: summary.selectedOperatorId,
                    displayName: summary.operator?.displayName ?? "Operator",
                    city: summary.operator?.city ?? "",
                    score: "0",
                    reasons: JSON.stringify([]),
                },
            });
        } catch (err: any) {
            setError(err.message ?? "Could not start the session.");
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading session handoff...</Text>
            </View>
        );
    }

    if (!requestId || !summary) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    This reserved session is not available right now.
                </Text>
                <Button title="Back to profile" onPress={() => router.replace("/profile")} />
            </View>
        );
    }

    const isReadyToStart = summary.paymentStatus === "reserved" && summary.requestStatus !== "in_call";

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Session ready</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                Reserved handoff before the live call placeholder begins.
            </Text>

            {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ marginBottom: 4 }}>Reserved</Text>
                <Text style={{ marginBottom: 4 }}>Request ID: {summary.requestId}</Text>
                <Text style={{ marginBottom: 4 }}>Intent: {intentLabels[summary.intent]}</Text>
                <Text style={{ marginBottom: 4 }}>Location: {summary.locationSummary}</Text>
                <Text style={{ marginBottom: 4 }}>
                    Quote: {summary.quotedAmount !== undefined ? `$${summary.quotedAmount}` : "Not quoted"} {summary.currency}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Estimated duration: {summary.estimatedDurationMinutes ?? 0} min
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Request status: {summary.requestStatus}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Payment status: {summary.paymentStatus}
                </Text>
                <Text>Description: {summary.description || "No description added"}</Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ marginBottom: 4 }}>Traveler: {summary.traveler.displayName}</Text>
                <Text style={{ marginBottom: 4 }}>Traveler city: {summary.traveler.city || "Unknown"}</Text>
                <Text>
                    Traveler languages: {(summary.traveler.languages ?? []).join(", ") || "None set"}
                </Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ marginBottom: 4 }}>Operator: {summary.operator?.displayName || "Not selected"}</Text>
                <Text style={{ marginBottom: 4 }}>Operator city: {summary.operator?.city || "Unknown"}</Text>
                <Text style={{ marginBottom: 4 }}>
                    Roles: {(summary.operator?.roles ?? []).join(", ") || "None set"}
                </Text>
                <Text>
                    Capabilities: {(summary.operator?.capabilities ?? []).join(", ") || "None set"}
                </Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ marginBottom: 4 }}>Timeline</Text>
                <Text style={{ marginBottom: 2 }}>Request created</Text>
                <Text style={{ marginBottom: 2 }}>Operator selected</Text>
                <Text style={{ marginBottom: 2 }}>Reserved</Text>
                <Text>Ready to start</Text>
            </View>

            {isReadyToStart ? (
                <View style={{ marginBottom: 12 }}>
                    <Button title="Start session" onPress={() => void handleStartSession()} />
                </View>
            ) : summary.requestStatus === "in_call" ? (
                <View style={{ marginBottom: 12 }}>
                    <Button
                        title="Continue to call"
                        onPress={() =>
                            router.push({
                                pathname: "/call",
                                params: {
                                    requestId,
                                    userId: summary.selectedOperatorId ?? "",
                                    displayName: summary.operator?.displayName ?? "Operator",
                                    city: summary.operator?.city ?? "",
                                    score: "0",
                                    reasons: JSON.stringify([]),
                                },
                            })
                        }
                    />
                </View>
            ) : null}

            <Button
                title="Back"
                onPress={() =>
                    router.replace(summary.viewerRole === "operator" ? "/operator/inbox" : "/request")
                }
            />
        </ScrollView>
    );
}
