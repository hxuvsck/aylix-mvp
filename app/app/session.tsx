import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import {
    completeActiveSession,
    getReservedSessionSummary,
    startRequestSession,
    type HelpIntent,
    type ReservedSessionSummary,
} from "../lib/api";
import { getLifecycleStatusLabel } from "../lib/request-status";
import { getSavedProfile, saveTravelerRequest } from "../lib/storage";

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

function formatElapsed(startedAt?: string) {
    if (!startedAt) {
        return "00:00";
    }

    const started = new Date(startedAt).getTime();

    if (Number.isNaN(started)) {
        return "00:00";
    }

    const seconds = Math.max(0, Math.floor((Date.now() - started) / 1000));
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function SessionScreen() {
    const params = useLocalSearchParams<{ requestId?: string | string[] }>();
    const requestId = getSingleParam(params.requestId);

    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [summary, setSummary] = useState<ReservedSessionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState("");

    const syncTravelerRequest = async (nextSummary: ReservedSessionSummary, travelerUserId?: string) => {
        if (!travelerUserId) {
            return;
        }

        await saveTravelerRequest({
            requestId: nextSummary.requestId,
            travelerUserId,
            status: nextSummary.requestStatus,
            paymentStatus: nextSummary.paymentStatus,
            createdAt: nextSummary.startedAt ?? nextSummary.completedAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            intent: nextSummary.intent,
            ...(nextSummary.quotedAmount !== undefined ? { quotedAmount: nextSummary.quotedAmount } : {}),
            ...(nextSummary.currency ? { currency: nextSummary.currency } : {}),
            ...(nextSummary.operator?.userId ? { operatorId: nextSummary.operator.userId } : {}),
            ...(nextSummary.operator?.displayName ? { operatorDisplayName: nextSummary.operator.displayName } : {}),
            ...(nextSummary.locationSummary ? { city: nextSummary.locationSummary } : {}),
        });
    };

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
            await syncTravelerRequest(response.summary, response.summary.traveler.userId);
        } catch (err: any) {
            setError(err.message ?? "Could not load reserved session.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadSummary();
    }, [requestId]);

    useEffect(() => {
        if (!requestId || !summary || ["completed", "cancelled", "expired", "timed_out", "missed"].includes(summary.requestStatus)) {
            return;
        }

        const intervalId = setInterval(() => {
            void loadSummary();
        }, 2500);

        return () => {
            clearInterval(intervalId);
        };
    }, [requestId, summary?.requestStatus]);

    const handleStartSession = async () => {
        if (!requestId || !summary?.selectedOperatorId || isMutating) {
            return;
        }

        try {
            setIsMutating(true);
            setError("");
            await startRequestSession(requestId, {
                operatorId: summary.selectedOperatorId,
                userId: profile?.userId,
            });
            await loadSummary();
        } catch (err: any) {
            setError(err.message ?? "Could not start the session.");
        } finally {
            setIsMutating(false);
        }
    };

    const handleCompleteSession = async () => {
        if (!requestId || !summary?.selectedOperatorId || isMutating) {
            return;
        }

        try {
            setIsMutating(true);
            setError("");
            await completeActiveSession(requestId, {
                operatorId: summary.selectedOperatorId,
                userId: profile?.userId,
            });
            await loadSummary();
        } catch (err: any) {
            setError(err.message ?? "Could not complete the session.");
        } finally {
            setIsMutating(false);
        }
    };

    const handleLeaveReview = () => {
        if (!summary) {
            return;
        }

        const counterpart =
            summary.viewerRole === "operator"
                ? summary.traveler
                : summary.operator;

        if (!counterpart) {
            return;
        }

        router.push({
            pathname: "/review",
            params: {
                requestId: summary.requestId,
                userId: counterpart.userId,
                displayName: counterpart.displayName,
                city: counterpart.city ?? "",
                score: "0",
                reasons: JSON.stringify([]),
            },
        });
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading Session...</Text>
            </View>
        );
    }

    if (!requestId || !summary) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    No active session is available right now. Return to your current request to continue.
                </Text>
                <Button title="Back to Home" onPress={() => router.replace("/entry")} />
            </View>
        );
    }

    const stage =
        summary.requestStatus === "completed"
            ? "completed"
            : summary.requestStatus === "in_call"
              ? "active"
              : "reserved";
    const elapsed = formatElapsed(summary.startedAt);
    const title =
        stage === "active"
            ? "Session in progress"
            : stage === "completed"
              ? "Session Summary"
              : "Session ready";
    const subtitle =
        stage === "active"
            ? "This is the active session placeholder for the current request."
            : stage === "completed"
              ? "Review what happened in this session and continue to the next step."
              : "This session is ready to begin when both sides are set.";
    const statusLabel =
        stage === "active" ? "In progress" : stage === "completed" ? "Completed" : "Reserved";

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>{title}</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                {subtitle}
            </Text>

            {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ marginBottom: 4 }}>Status: {statusLabel}</Text>
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
                    Lifecycle: {getLifecycleStatusLabel(summary.requestStatus)}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Payment status: {summary.paymentStatus}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Started: {summary.startedAt ? new Date(summary.startedAt).toLocaleString() : "Not started yet"}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Completed: {summary.completedAt ? new Date(summary.completedAt).toLocaleString() : "Not completed yet"}
                </Text>
                {stage === "active" ? (
                    <Text style={{ marginBottom: 4 }}>Elapsed: {elapsed}</Text>
                ) : null}
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
                <Text style={{ marginBottom: 2 }}>{stage === "active" || stage === "completed" ? "In progress" : "Ready to start"}</Text>
                {stage === "completed" ? <Text>Completed</Text> : null}
            </View>

            {stage === "reserved" ? (
                <View style={{ marginBottom: 12 }}>
                    <Button
                        title={isMutating ? "Starting Session..." : "Open Session"}
                        onPress={() => void handleStartSession()}
                        disabled={isMutating}
                    />
                </View>
            ) : null}

            {stage === "active" ? (
                <View style={{ marginBottom: 12 }}>
                    <Button
                        title={isMutating ? "Completing Session..." : "Complete Session"}
                        onPress={() => void handleCompleteSession()}
                        disabled={isMutating}
                    />
                </View>
            ) : null}

            {stage === "completed" && !summary.hasReview ? (
                <View style={{ marginBottom: 12 }}>
                    <Button title="Leave Review" onPress={handleLeaveReview} />
                </View>
            ) : null}

            {stage === "completed" && summary.hasReview ? (
                <Text style={{ marginBottom: 12 }}>
                    Review submitted
                </Text>
            ) : null}

            <Button
                title={summary.viewerRole === "operator" ? "Back to Operator Home" : "Back to Traveler Home"}
                onPress={() =>
                    router.replace(summary.viewerRole === "operator" ? "/operator/home" : "/traveler/home")
                }
            />
        </ScrollView>
    );
}
