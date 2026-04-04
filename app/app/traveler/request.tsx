import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { getReservedSessionSummary, type HelpIntent, type ReservedSessionSummary } from "../../lib/api";
import { getLifecycleStatus, getLifecycleStatusLabel } from "../../lib/request-status";
import { getSavedProfile, getSavedTravelerRequests, type SavedTravelerRequest } from "../../lib/storage";

type SavedProfile = {
    userId?: string;
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

export default function TravelerRequestDetailScreen() {
    const params = useLocalSearchParams<{ requestId?: string | string[] }>();
    const requestId = getSingleParam(params.requestId);

    const [requestItem, setRequestItem] = useState<SavedTravelerRequest | null>(null);
    const [summary, setSummary] = useState<ReservedSessionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRequest = async () => {
            const profile = (await getSavedProfile()) as SavedProfile | null;
            const savedRequests = await getSavedTravelerRequests(profile?.userId);
            const nextRequest = savedRequests.find((item) => item.requestId === requestId) ?? null;
            setRequestItem(nextRequest);

            if (requestId && profile?.userId) {
                const response = await getReservedSessionSummary(requestId, profile.userId).catch(() => null);
                setSummary(response?.summary ?? null);
            }

            setIsLoading(false);
        };

        void loadRequest();
    }, [requestId]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading Request Detail...</Text>
            </View>
        );
    }

    if (!requestId || !requestItem) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    This request is not available right now. Return to My Requests to choose another one.
                </Text>
                <Button title="Back to My Requests" onPress={() => router.replace("/traveler/requests")} />
            </View>
        );
    }

    const statusLabel = getLifecycleStatusLabel(requestItem.status);
    const lifecycleStatus = getLifecycleStatus(requestItem.status);
    const canOpenSession = lifecycleStatus === "accepted" || lifecycleStatus === "in_session" || lifecycleStatus === "completed";
    const reviewTarget = summary?.operator ?? null;
    const canLeaveReview = lifecycleStatus === "completed" && Boolean(summary && !summary.hasReview && reviewTarget);
    const nextActionLabel =
        lifecycleStatus === "accepted"
            ? "Go to session"
            : lifecycleStatus === "in_session"
              ? "Continue session"
              : canLeaveReview
                ? "Leave review"
                : lifecycleStatus === "completed"
                ? "View session summary"
                : lifecycleStatus === "matched" || lifecycleStatus === "pending" || lifecycleStatus === "searching"
                  ? "Waiting for operator"
                  : "No further action";

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Request Detail</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 20 }}>
                Review the current request and continue with the next available step.
            </Text>

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 16 }}>
                <Text style={{ marginBottom: 4 }}>
                    Operator: {summary?.operator?.displayName || requestItem.operatorDisplayName || "Not selected yet"}
                </Text>
                <Text style={{ marginBottom: 4 }}>Status: {statusLabel}</Text>
                <Text style={{ marginBottom: 4 }}>
                    Created: {new Date(requestItem.createdAt).toLocaleString()}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Quote: {requestItem.quotedAmount !== undefined ? `$${requestItem.quotedAmount}` : "Not quoted"} {requestItem.currency ?? ""}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Session info: {summary?.estimatedDurationMinutes ? `${summary.estimatedDurationMinutes} min` : "Not ready yet"}
                </Text>
                <Text>
                    Intent: {summary?.intent ? intentLabels[summary.intent] : requestItem.intent ?? "Unknown"}
                </Text>
            </View>

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, marginBottom: 8 }}>Next Step</Text>
                <Text>{nextActionLabel}</Text>
            </View>

            {canLeaveReview && reviewTarget ? (
                <View style={{ marginBottom: 12 }}>
                    <Button
                        title="Leave review"
                        onPress={() =>
                            router.push({
                                pathname: "/review",
                                params: {
                                    requestId,
                                    userId: reviewTarget.userId,
                                    displayName: reviewTarget.displayName,
                                    city: reviewTarget.city ?? "",
                                    score: "0",
                                    reasons: JSON.stringify([]),
                                },
                            })
                        }
                    />
                </View>
            ) : null}

            {canOpenSession && summary ? (
                <View style={{ marginBottom: 12 }}>
                    <Button
                        title={lifecycleStatus === "completed" ? "View session summary" : nextActionLabel}
                        onPress={() =>
                            router.push({
                                pathname: "/session",
                                params: { requestId },
                            })
                        }
                    />
                </View>
            ) : null}

            <Button title="Back to My Requests" onPress={() => router.replace("/traveler/requests")} />
        </ScrollView>
    );
}
