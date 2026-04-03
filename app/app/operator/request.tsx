import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import {
    getReservedSessionSummary,
    getRequestState,
    respondToRequest,
    type HelpIntent,
    type ReservedSessionSummary,
    type RequestStateResponse,
} from "../../lib/api";
import { getSavedProfile } from "../../lib/storage";

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

export default function OperatorRequestScreen() {
    const params = useLocalSearchParams<{
        requestId?: string | string[];
        travelerDisplayName?: string | string[];
        travelerCity?: string | string[];
        locationSummary?: string | string[];
    }>();
    const requestId = getSingleParam(params.requestId);
    const travelerDisplayName = getSingleParam(params.travelerDisplayName);
    const travelerCity = getSingleParam(params.travelerCity);
    const locationSummary = getSingleParam(params.locationSummary);

    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [requestState, setRequestState] = useState<RequestStateResponse | null>(null);
    const [sessionSummary, setSessionSummary] = useState<ReservedSessionSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadRequest = async () => {
        if (!requestId) {
            setIsLoading(false);
            return;
        }

        try {
            setError("");
            const savedProfile = await getSavedProfile();
            setProfile(savedProfile);

            const [response, summaryResponse] = await Promise.all([
                getRequestState(requestId),
                getReservedSessionSummary(requestId, savedProfile?.userId),
            ]);
            setRequestState(response);
            setSessionSummary(summaryResponse.summary);
        } catch (err: any) {
            setError(err.message ?? "Could not load request details.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadRequest();
    }, [requestId]);

    const handleRespond = async (action: "accept" | "decline") => {
        if (!requestId || !profile?.userId) {
            return;
        }

        try {
            setError("");
            const response = await respondToRequest(requestId, {
                operatorId: profile.userId,
                action,
            });
            setRequestState(response);
            await loadRequest();
        } catch (err: any) {
            setError(err.message ?? "Could not send response.");
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading request details...</Text>
            </View>
        );
    }

    if (!requestId || !requestState || !profile?.userId) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    This request detail is not available right now.
                </Text>
                <Button title="Back to inbox" onPress={() => router.replace("/operator/inbox")} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Request details</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                Review this traveler request and send your response.
            </Text>

            {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

            <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                <Text style={{ marginBottom: 4 }}>
                    Traveler: {travelerDisplayName || "Traveler"}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Location: {locationSummary || travelerCity || "Location not set"}
                </Text>
                <Text style={{ marginBottom: 4 }}>Request ID: {requestState.request.id}</Text>
                <Text style={{ marginBottom: 4 }}>
                    Intent: {intentLabels[requestState.request.intent]}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Description: {requestState.request.description || "No description added"}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Request status: {requestState.request.status}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Payment: {requestState.request.paymentStatus}
                </Text>
                <Text style={{ marginBottom: 4 }}>
                    Quote: {requestState.request.quotedAmount !== undefined ? `$${requestState.request.quotedAmount}` : "Not quoted"} {requestState.request.currency}
                </Text>
                <Text>
                    Selected state: {sessionSummary?.isSelectedOperator ? "You were selected" : "Not selected yet"}
                </Text>
            </View>

            {sessionSummary?.isSelectedOperator && requestState.request.paymentStatus === "reserved" ? (
                <>
                    <Text style={{ fontSize: 20, marginBottom: 12 }}>You were selected</Text>
                    <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                        <Text style={{ marginBottom: 4 }}>
                            Traveler: {sessionSummary.traveler.displayName}
                        </Text>
                        <Text style={{ marginBottom: 4 }}>
                            Intent: {intentLabels[sessionSummary.intent]}
                        </Text>
                        <Text style={{ marginBottom: 4 }}>
                            Location: {sessionSummary.locationSummary}
                        </Text>
                        <Text style={{ marginBottom: 4 }}>
                            Quote: {sessionSummary.quotedAmount !== undefined ? `$${sessionSummary.quotedAmount}` : "Not quoted"} {sessionSummary.currency}
                        </Text>
                        <Text style={{ marginBottom: 12 }}>
                            Payment: {sessionSummary.paymentStatus}
                        </Text>
                        <Button
                            title="Continue to session"
                            onPress={() =>
                                router.push({
                                    pathname: "/session",
                                    params: { requestId },
                                })
                            }
                        />
                    </View>
                </>
            ) : ["nominated", "accepted"].includes(requestState.request.status) && !requestState.request.selectedOperatorId ? (
                <>
                    <View style={{ marginBottom: 8 }}>
                        <Button title="Send response: Accept" onPress={() => void handleRespond("accept")} />
                    </View>
                    <Button title="Send response: Decline" onPress={() => void handleRespond("decline")} />
                </>
            ) : (
                <Text style={{ marginBottom: 20, color: "#444" }}>
                    {requestState.request.selectedOperatorId && !sessionSummary?.isSelectedOperator
                        ? "Another operator was selected for this request."
                        : "This request is no longer open for operator responses."}
                </Text>
            )}

            <View style={{ marginTop: 20 }}>
                <Button title="Back to inbox" onPress={() => router.replace("/operator/inbox")} />
            </View>
        </ScrollView>
    );
}
