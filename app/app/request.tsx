import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import {
    cancelRequest,
    expandRequest,
    getRequestResponses,
    getRequestState,
    helpIntentOptions,
    matchHelpRequest,
    reportNoShow,
    reserveRequest,
    retryRequest,
    urgencyOptions,
    type HelpIntent,
    type HelpRequest,
    type HelpRequestStatus,
    type OperatorNomination,
    type RequestResponseItem,
    type Urgency,
} from "../lib/api";
import {
    DEFAULT_REVIEW_COUNT,
    DEFAULT_TRUST_SCORE,
    getSavedProfile,
    getUserTrust,
} from "../lib/storage";

type SavedProfile = {
    userId?: string;
    displayName?: string;
};

type ResponseWithTrust = RequestResponseItem & {
    reviewCount?: number;
};

const terminalStatuses: HelpRequestStatus[] = ["completed", "cancelled", "expired", "timed_out", "missed"];

const intentLabels: Record<HelpIntent, string> = {
    food: "Food",
    navigation: "Navigation",
    translation: "Translation",
    explore: "Explore together",
    emergency: "Emergency",
};

export default function RequestScreen() {
    const [profile, setProfile] = useState<SavedProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [intent, setIntent] = useState<HelpIntent>("food");
    const [description, setDescription] = useState("");
    const [urgency, setUrgency] = useState<Urgency>("medium");
    const [activeRequest, setActiveRequest] = useState<HelpRequest | null>(null);
    const [nominations, setNominations] = useState<OperatorNomination[]>([]);
    const [selectedOperator, setSelectedOperator] = useState<ResponseWithTrust | null>(null);
    const [acceptedOperators, setAcceptedOperators] = useState<ResponseWithTrust[]>([]);
    const [pendingOperators, setPendingOperators] = useState<ResponseWithTrust[]>([]);
    const [declinedOperators, setDeclinedOperators] = useState<ResponseWithTrust[]>([]);
    const [matchesError, setMatchesError] = useState("");
    const [responsesError, setResponsesError] = useState("");
    const [isMatching, setIsMatching] = useState(false);
    const [isLoadingResponses, setIsLoadingResponses] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    const hydrateResponsesWithTrust = async (responses: RequestResponseItem[]) =>
        Promise.all(
            responses.map(async (response) => {
                const trust = await getUserTrust(response.operatorId);

                return {
                    ...response,
                    trustScore: trust.trustScore ?? response.trustScore ?? DEFAULT_TRUST_SCORE,
                    reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
                };
            })
        );

    const loadRequestView = async (requestId: string, userId?: string) => {
        setIsLoadingResponses(true);
        setResponsesError("");

        try {
            const [requestStateResponse, responsesResponse] = await Promise.all([
                getRequestState(requestId),
                getRequestResponses(requestId, userId),
            ]);

            const hydratedResponses = await hydrateResponsesWithTrust(responsesResponse.responses);
            const selectedResponse =
                hydratedResponses.find((response) => response.isSelected) ?? null;

            setActiveRequest(requestStateResponse.request);
            setNominations(requestStateResponse.nominations);
            setSelectedOperator(selectedResponse);
            setAcceptedOperators(
                hydratedResponses.filter(
                    (response) => response.nominationStatus === "accepted" && !response.isSelected
                )
            );
            setPendingOperators(
                hydratedResponses.filter((response) => response.nominationStatus === "pending")
            );
            setDeclinedOperators(
                hydratedResponses.filter((response) => response.nominationStatus === "declined")
            );
        } catch (err: any) {
            setResponsesError(err.message ?? "Could not load operator responses.");
        } finally {
            setIsLoadingResponses(false);
        }
    };

    useEffect(() => {
        const loadProfile = async () => {
            setProfile(await getSavedProfile());
            setIsLoadingProfile(false);
        };

        void loadProfile();
    }, []);

    useEffect(() => {
        if (!activeRequest?.id || terminalStatuses.includes(activeRequest.status)) {
            return;
        }

        const intervalId = setInterval(() => {
            void loadRequestView(activeRequest.id, profile?.userId);
        }, 2500);

        return () => {
            clearInterval(intervalId);
        };
    }, [activeRequest?.id, activeRequest?.status, profile?.userId]);

    const handleFindOperators = async () => {
        if (!profile?.userId) {
            setMatchesError("Profile is missing a user ID.");
            return;
        }

        try {
            setIsMatching(true);
            setMatchesError("");
            setHasRequested(true);

            const response = await matchHelpRequest({
                userId: profile.userId,
                intent,
                description: description.trim() || undefined,
                urgency,
            });

            setActiveRequest(response.request);
            setNominations(response.nominations);
            setSelectedOperator(null);
            setAcceptedOperators([]);
            setPendingOperators([]);
            setDeclinedOperators([]);

            await loadRequestView(response.request.id, profile.userId);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not load operators.");
        } finally {
            setIsMatching(false);
        }
    };

    const handleExpandSearch = async () => {
        if (!activeRequest?.id) {
            return;
        }

        try {
            setMatchesError("");
            const response = await expandRequest(activeRequest.id);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            await loadRequestView(response.request.id, profile?.userId);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not expand search.");
        }
    };

    const handleRetryRequest = async () => {
        if (!activeRequest?.id || !profile?.userId) {
            return;
        }

        try {
            setMatchesError("");
            const response = await retryRequest(activeRequest.id);
            setHasRequested(true);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            await loadRequestView(response.request.id, profile.userId);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not retry request.");
        }
    };

    const handleSelectOperator = async (response: ResponseWithTrust) => {
        if (!activeRequest?.id || !profile?.userId) {
            return;
        }

        try {
            setResponsesError("");
            const reserveResponse = await reserveRequest(activeRequest.id, {
                operatorId: response.operatorId,
                userId: profile.userId,
            });
            setActiveRequest(reserveResponse.request);
            setNominations(reserveResponse.nominations);
            await loadRequestView(reserveResponse.request.id, profile.userId);
        } catch (err: any) {
            setResponsesError(err.message ?? "Could not select this operator.");
        }
    };

    const handleContinueToSession = () => {
        if (!activeRequest?.id || !selectedOperator) {
            return;
        }

        router.push({
            pathname: "/session",
            params: {
                requestId: activeRequest.id,
            },
        });
    };

    const handleOpenCall = () => {
        if (!activeRequest?.id || !selectedOperator) {
            return;
        }

        router.push({
            pathname: "/call",
            params: {
                requestId: activeRequest.id,
                userId: selectedOperator.operatorId,
                displayName: selectedOperator.displayName,
                city: selectedOperator.city ?? "",
                score: "0",
                reasons: JSON.stringify(selectedOperator.reasons ?? []),
            },
        });
    };

    const handleCancelRequest = async () => {
        if (!activeRequest?.id) {
            return;
        }

        try {
            const response = await cancelRequest(activeRequest.id);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            await loadRequestView(response.request.id, profile?.userId);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not cancel request.");
        }
    };

    const handleReportNoShow = async () => {
        if (!activeRequest?.id || !selectedOperator?.operatorId) {
            return;
        }

        try {
            const response = await reportNoShow(activeRequest.id, selectedOperator.operatorId);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            await loadRequestView(response.request.id, profile?.userId);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not report no-show.");
        }
    };

    const terminalMessage =
        activeRequest?.status === "expired"
            ? "No operators responded in time."
            : activeRequest?.status === "timed_out"
              ? "An operator accepted, but the session did not start in time."
              : activeRequest?.status === "cancelled"
                ? "This request was cancelled."
                : activeRequest?.status === "completed"
                  ? "This session is complete."
                  : activeRequest?.status === "missed"
                    ? "This session was missed."
                    : "";
    const isTerminal = activeRequest ? terminalStatuses.includes(activeRequest.status) : false;
    const canRecover =
        activeRequest !== null &&
        ["expired", "timed_out", "missed"].includes(activeRequest.status);
    const retryLabel =
        activeRequest && activeRequest.retryCount > 0
            ? `Expanded search • Retry attempt ${activeRequest.retryCount}`
            : "";
    const hasAnyResponses =
        selectedOperator !== null ||
        acceptedOperators.length > 0 ||
        pendingOperators.length > 0 ||
        declinedOperators.length > 0;

    if (isLoadingProfile) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading request flow...</Text>
            </View>
        );
    }

    if (!profile?.userId) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    No profile is available yet. Create a profile before requesting help.
                </Text>
                <Button title="Go to onboarding" onPress={() => router.replace("/onboarding")} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, justifyContent: "center", flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
        >
            <View>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>What do you need?</Text>
                <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                    Choose the kind of help you need and we will rank available operators.
                </Text>

                <Text style={{ marginBottom: 8 }}>Intent</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 12 }}>
                    {helpIntentOptions.map((option) => (
                        <View key={option} style={{ marginRight: 8, marginBottom: 8 }}>
                            <Button
                                title={intent === option ? `${intentLabels[option]} selected` : intentLabels[option]}
                                onPress={() => setIntent(option)}
                            />
                        </View>
                    ))}
                </View>

                <TextInput
                    placeholder="Small description (optional)"
                    value={description}
                    onChangeText={setDescription}
                    style={{ borderWidth: 1, marginBottom: 12, padding: 10 }}
                />

                <Text style={{ marginBottom: 8 }}>Urgency</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
                    {urgencyOptions.map((option) => (
                        <View key={option} style={{ marginRight: 8, marginBottom: 8 }}>
                            <Button
                                title={urgency === option ? `${option} selected` : option}
                                onPress={() => setUrgency(option)}
                            />
                        </View>
                    ))}
                </View>

                <Button
                    title={isMatching ? "Finding operators..." : "Find operators"}
                    onPress={handleFindOperators}
                    disabled={isMatching}
                />

                {isMatching ? (
                    <Text style={{ marginTop: 12, color: "#444" }}>Ranking available operators...</Text>
                ) : null}

                {activeRequest ? (
                    <Text style={{ marginTop: 12, color: "#444" }}>
                        Request status: {activeRequest.status} • Nominations: {nominations.length}
                    </Text>
                ) : null}

                {activeRequest?.quotedAmount !== undefined ? (
                    <Text style={{ marginTop: 8, color: "#444" }}>
                        Estimated session price: ${activeRequest.quotedAmount} {activeRequest.currency}
                    </Text>
                ) : null}

                {activeRequest?.paymentStatus === "reserved" ? (
                    <Text style={{ marginTop: 8, color: "#444" }}>
                        Payment status: reserved
                    </Text>
                ) : null}

                {retryLabel ? <Text style={{ marginTop: 8, color: "#444" }}>{retryLabel}</Text> : null}

                {activeRequest && terminalStatuses.includes(activeRequest.status) ? (
                    <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>{terminalMessage}</Text>
                ) : null}

                {activeRequest && ["open", "nominated", "accepted"].includes(activeRequest.status) ? (
                    <View style={{ marginTop: 12 }}>
                        <Button title="Cancel request" onPress={() => void handleCancelRequest()} />
                    </View>
                ) : null}

                {activeRequest?.status === "missed" ? (
                    <Text style={{ marginTop: 12, marginBottom: 12, color: "#444" }}>
                        The operator didn’t connect. Try again or find another.
                    </Text>
                ) : null}

                {canRecover ? (
                    <View style={{ marginTop: 12 }}>
                        <View style={{ marginBottom: 8 }}>
                            <Button title="Find more operators" onPress={() => void handleExpandSearch()} />
                        </View>
                        <Button title="Try again" onPress={() => void handleRetryRequest()} />
                    </View>
                ) : null}

                {selectedOperator ? (
                    <>
                        <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>
                            {activeRequest?.status === "in_call" ? "Active session" : "Operator selected"}
                        </Text>
                        <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>{selectedOperator.displayName}</Text>
                            <Text style={{ marginBottom: 4 }}>Location: {selectedOperator.city || "Unknown"}</Text>
                            <Text style={{ marginBottom: 4 }}>
                                Languages: {(selectedOperator.languages ?? []).join(", ") || "None set"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Roles: {(selectedOperator.roles ?? []).join(", ") || "None set"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Capabilities: {(selectedOperator.capabilities ?? []).join(", ") || "None set"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Status: {activeRequest?.paymentStatus === "reserved" ? "Reserved" : "Selected"} • Payment {activeRequest?.paymentStatus ?? "none"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Request lock: {activeRequest?.selectedOperatorId ? "Locked to this operator" : "Not locked yet"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Intent: {activeRequest ? intentLabels[activeRequest.intent] : "Unknown"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Session info: {activeRequest?.quotedAmount !== undefined ? `$${activeRequest.quotedAmount} ${activeRequest.currency}` : "Not quoted"} • service handoff ready
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Trust: ⭐ {selectedOperator.trustScore ?? DEFAULT_TRUST_SCORE} ({selectedOperator.reviewCount ?? DEFAULT_REVIEW_COUNT} reviews)
                            </Text>
                            <Text style={{ marginBottom: 12 }}>
                                Reasons: {selectedOperator.reasons.join(", ") || "No reasons available"}
                            </Text>
                            {!isTerminal && activeRequest?.paymentStatus === "reserved" && activeRequest.status !== "in_call" ? (
                                <View style={{ marginBottom: 8 }}>
                                    <Button title="Continue to session" onPress={handleContinueToSession} />
                                </View>
                            ) : null}
                            {!isTerminal && activeRequest?.status === "in_call" ? (
                                <View style={{ marginBottom: 8 }}>
                                    <Button title="Call" onPress={handleOpenCall} />
                                </View>
                            ) : null}
                            {activeRequest?.status === "in_call" ? (
                                <Button title="Report no-show" onPress={() => void handleReportNoShow()} />
                            ) : null}
                        </View>
                    </>
                ) : null}

                <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>Operator responses</Text>

                {matchesError ? <Text style={{ marginBottom: 12 }}>ERROR: {matchesError}</Text> : null}
                {responsesError ? (
                    <View style={{ marginBottom: 12 }}>
                        <Text style={{ marginBottom: 8 }}>ERROR: {responsesError}</Text>
                        {activeRequest?.id ? (
                            <Button
                                title="Retry responses"
                                onPress={() => void loadRequestView(activeRequest.id, profile.userId)}
                            />
                        ) : null}
                    </View>
                ) : null}
                {isLoadingResponses ? (
                    <Text style={{ marginBottom: 12, color: "#444" }}>Loading operator responses...</Text>
                ) : null}
                {!responsesError && !isLoadingResponses && hasRequested && !hasAnyResponses ? (
                    <View style={{ marginBottom: 20 }}>
                        <Text style={{ fontSize: 18, marginBottom: 8 }}>No operator responses yet</Text>
                        <Text style={{ color: "#444" }}>
                            Responses from nominated operators will appear here.
                        </Text>
                    </View>
                ) : null}

                <Text style={{ fontSize: 20, marginTop: 12, marginBottom: 12 }}>Available operators to choose</Text>
                {!responsesError && !isLoadingResponses && acceptedOperators.length === 0 ? (
                    <Text style={{ marginBottom: 16, color: "#444" }}>
                        No accepted operators yet.
                    </Text>
                ) : null}
                {acceptedOperators.map((response) => (
                    <View
                        key={response.operatorId}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 4 }}>{response.displayName}</Text>
                        <Text style={{ marginBottom: 4 }}>Location: {response.city || "Unknown"}</Text>
                        <Text style={{ marginBottom: 4 }}>
                            Languages: {(response.languages ?? []).join(", ") || "None set"}
                        </Text>
                        <Text style={{ marginBottom: 4 }}>
                            Roles: {(response.roles ?? []).join(", ") || "None set"}
                        </Text>
                        <Text style={{ marginBottom: 4 }}>
                            Capabilities: {(response.capabilities ?? []).join(", ") || "None set"}
                        </Text>
                        <Text style={{ marginBottom: 4 }}>Status: Accepted</Text>
                        <Text style={{ marginBottom: 4 }}>
                            Trust: ⭐ {response.trustScore ?? DEFAULT_TRUST_SCORE} ({response.reviewCount ?? DEFAULT_REVIEW_COUNT} reviews)
                        </Text>
                        <Text style={{ marginBottom: 12 }}>
                            Reasons: {response.reasons.join(", ") || "No reasons available"}
                        </Text>
                        {response.selectable && activeRequest?.paymentStatus === "quoted" ? (
                            <Button
                                title="Select operator"
                                onPress={() => void handleSelectOperator(response)}
                            />
                        ) : (
                            <Text style={{ color: "#444" }}>
                                {selectedOperator ? "Selection finished" : "Waiting for selection to open"}
                            </Text>
                        )}
                    </View>
                ))}

                <Text style={{ fontSize: 20, marginTop: 16, marginBottom: 12 }}>Pending operators</Text>
                {!responsesError && !isLoadingResponses && pendingOperators.length === 0 ? (
                    <Text style={{ marginBottom: 16, color: "#444" }}>
                        No pending operators right now.
                    </Text>
                ) : null}
                {pendingOperators.map((response) => (
                    <View
                        key={response.operatorId}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 4 }}>{response.displayName}</Text>
                        <Text style={{ marginBottom: 4 }}>Status: Pending</Text>
                        <Text style={{ marginBottom: 4 }}>Location: {response.city || "Unknown"}</Text>
                        <Text>
                            Reasons: {response.reasons.join(", ") || "No reasons available"}
                        </Text>
                    </View>
                ))}

                <Text style={{ fontSize: 20, marginTop: 16, marginBottom: 12 }}>Declined operators</Text>
                {!responsesError && !isLoadingResponses && declinedOperators.length === 0 ? (
                    <Text style={{ marginBottom: 16, color: "#444" }}>
                        No operators have declined yet.
                    </Text>
                ) : null}
                {declinedOperators.map((response) => (
                    <View
                        key={response.operatorId}
                        style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 4 }}>{response.displayName}</Text>
                        <Text style={{ marginBottom: 4 }}>Status: Declined</Text>
                        <Text style={{ marginBottom: 4 }}>Location: {response.city || "Unknown"}</Text>
                        <Text>
                            Reasons: {response.reasons.join(", ") || "No reasons available"}
                        </Text>
                    </View>
                ))}

                <View style={{ marginTop: 20 }}>
                    <Button title="Back to profile" onPress={() => router.replace("/profile")} />
                </View>
            </View>
        </ScrollView>
    );
}
