import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import {
    cancelRequest,
    expandRequest,
    getRequestState,
    helpIntentOptions,
    matchHelpRequest,
    reportNoShow,
    reserveRequest,
    retryRequest,
    startRequestSession,
    urgencyOptions,
    type HelpRequestStatus,
    type HelpIntent,
    type HelpRequest,
    type Match,
    type OperatorNomination,
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

type MatchWithTrust = Match & {
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
    const [selectedOperator, setSelectedOperator] = useState<MatchWithTrust | null>(null);
    const [acceptedOperators, setAcceptedOperators] = useState<MatchWithTrust[]>([]);
    const [pendingOperators, setPendingOperators] = useState<MatchWithTrust[]>([]);
    const [matchesError, setMatchesError] = useState("");
    const [isMatching, setIsMatching] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    const hydrateMatchesWithTrust = async (matches: Match[]) =>
        Promise.all(
            matches.map(async (match) => {
                const trust = await getUserTrust(match.userId);

                return {
                    ...match,
                    trustScore: trust.trustScore ?? match.trustScore ?? DEFAULT_TRUST_SCORE,
                    reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
                };
            })
        );

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

        const pollRequestState = async () => {
            try {
                const response = await getRequestState(activeRequest.id);

                const selectedOperatorResponse = response.selectedOperator;
                const [selectedWithTrust, acceptedWithTrust, pendingWithTrust] = await Promise.all([
                    selectedOperatorResponse
                        ? getUserTrust(selectedOperatorResponse.userId).then((trust) => ({
                              ...selectedOperatorResponse,
                              trustScore: trust.trustScore ?? selectedOperatorResponse.trustScore ?? DEFAULT_TRUST_SCORE,
                              reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
                          }))
                        : Promise.resolve(null),
                    hydrateMatchesWithTrust(response.acceptedOperators),
                    hydrateMatchesWithTrust(response.pendingOperators),
                ]);

                setActiveRequest(response.request);
                setNominations(response.nominations);
                setSelectedOperator(selectedWithTrust);
                setAcceptedOperators(acceptedWithTrust);
                setPendingOperators(pendingWithTrust);
            } catch (err: any) {
                setMatchesError(err.message ?? "Could not refresh request state.");
            }
        };

        const intervalId = setInterval(() => {
            void pollRequestState();
        }, 2500);

        return () => {
            clearInterval(intervalId);
        };
    }, [activeRequest?.id, activeRequest?.status]);

    const handleFindOperators = async () => {
        if (!profile?.userId) {
            setAcceptedOperators([]);
            setPendingOperators([]);
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

            const matchesWithTrust = await hydrateMatchesWithTrust(response.operators);

            setActiveRequest(response.request);
            setNominations(response.nominations);
            setSelectedOperator(null);
            setAcceptedOperators([]);
            setPendingOperators(matchesWithTrust);
        } catch (err: any) {
            setAcceptedOperators([]);
            setPendingOperators([]);
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
            const operatorsWithTrust = await hydrateMatchesWithTrust(response.operators);

            setActiveRequest(response.request);
            setNominations(response.nominations);
            setSelectedOperator(null);
            setAcceptedOperators([]);
            setPendingOperators(operatorsWithTrust);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not expand search.");
        }
    };

    const handleRetryRequest = async () => {
        if (!activeRequest?.id) {
            return;
        }

        try {
            setMatchesError("");
            const response = await retryRequest(activeRequest.id);
            const operatorsWithTrust = await hydrateMatchesWithTrust(response.operators);

            setHasRequested(true);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            setSelectedOperator(null);
            setAcceptedOperators([]);
            setPendingOperators(operatorsWithTrust);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not retry request.");
        }
    };

    const handleStartCall = async (match: Match) => {
        if (!activeRequest?.id) {
            return;
        }

        const response = await startRequestSession(activeRequest.id, match.userId);
        const trust = await getUserTrust(match.userId);
        const selectedMatch = {
            ...match,
            trustScore: trust.trustScore ?? match.trustScore ?? DEFAULT_TRUST_SCORE,
            reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
        };

        setActiveRequest(response.request);
        setNominations(response.nominations);
        setSelectedOperator(selectedMatch);
        setAcceptedOperators([]);
        setPendingOperators([]);

        router.push({
            pathname: "/call",
            params: {
                requestId: activeRequest?.id ?? "",
                userId: match.userId,
                displayName: match.displayName,
                city: match.city ?? "",
                score: String(match.score),
                reasons: JSON.stringify(match.reasons ?? []),
            },
        });
    };

    const handleReserveAndContinue = async (match: Match) => {
        if (!activeRequest?.id) {
            return;
        }

        try {
            const response = await reserveRequest(activeRequest.id);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            await handleStartCall(match);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not reserve this session.");
        }
    };

    const handleOpenCall = (match: Match) => {
        router.push({
            pathname: "/call",
            params: {
                requestId: activeRequest?.id ?? "",
                userId: match.userId,
                displayName: match.displayName,
                city: match.city ?? "",
                score: String(match.score),
                reasons: JSON.stringify(match.reasons ?? []),
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
            setSelectedOperator(null);
            setAcceptedOperators([]);
            setPendingOperators([]);
        } catch (err: any) {
            setMatchesError(err.message ?? "Could not cancel request.");
        }
    };

    const handleReportNoShow = async () => {
        if (!activeRequest?.id || !selectedOperator?.userId) {
            return;
        }

        try {
            const response = await reportNoShow(activeRequest.id, selectedOperator.userId);
            setActiveRequest(response.request);
            setNominations(response.nominations);
            setSelectedOperator(null);
            setAcceptedOperators([]);
            setPendingOperators([]);
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
                    <Text style={{ marginTop: 8, color: "#444" }}>Session reserved</Text>
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
                        <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>Active session</Text>
                        <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}>
                            <Text style={{ fontSize: 16, marginBottom: 4 }}>{selectedOperator.displayName}</Text>
                            <Text style={{ marginBottom: 4 }}>
                                Roles: {(selectedOperator.roles ?? []).join(", ") || "None set"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Capabilities: {(selectedOperator.capabilities ?? []).join(", ") || "None set"}
                            </Text>
                            <Text style={{ marginBottom: 4 }}>
                                Trust: ⭐ {selectedOperator.trustScore ?? DEFAULT_TRUST_SCORE} ({selectedOperator.reviewCount ?? DEFAULT_REVIEW_COUNT} reviews)
                            </Text>
                            <Text style={{ marginBottom: 12 }}>
                                Reasons: {(selectedOperator.reasons ?? []).join(", ") || "No reasons available"}
                            </Text>
                            {!isTerminal && activeRequest?.status === "in_call" ? (
                                <View style={{ marginBottom: 8 }}>
                                    <Button title="Call" onPress={() => handleOpenCall(selectedOperator)} />
                                </View>
                            ) : null}
                            {activeRequest?.status === "in_call" ? (
                                <Button title="Report no-show" onPress={() => void handleReportNoShow()} />
                            ) : null}
                        </View>
                    </>
                ) : null}

                <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>Accepted operators</Text>

                {matchesError ? <Text style={{ marginBottom: 12 }}>ERROR: {matchesError}</Text> : null}

                {!matchesError && !isMatching && hasRequested && acceptedOperators.length === 0 ? (
                    <Text style={{ marginBottom: 20, color: "#444" }}>No operator has accepted yet.</Text>
                ) : null}

                {!matchesError && !isMatching && acceptedOperators.length > 0
                    ? acceptedOperators.map((match) => (
                          <View
                              key={match.userId}
                              style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                          >
                              <Text style={{ fontSize: 16, marginBottom: 4 }}>{match.displayName}</Text>
                              <Text style={{ marginBottom: 4 }}>Roles: {(match.roles ?? []).join(", ") || "None set"}</Text>
                              <Text style={{ marginBottom: 4 }}>
                                  Capabilities: {(match.capabilities ?? []).join(", ") || "None set"}
                              </Text>
                              <Text style={{ marginBottom: 4 }}>
                                  Trust: ⭐ {match.trustScore ?? DEFAULT_TRUST_SCORE} ({match.reviewCount ?? DEFAULT_REVIEW_COUNT} reviews)
                              </Text>
                              <Text style={{ marginBottom: 12 }}>
                                  Reasons: {(match.reasons ?? []).join(", ") || "No reasons available"}
                              </Text>
                              {!isTerminal && activeRequest?.paymentStatus === "quoted" ? (
                                  <View style={{ marginBottom: 8 }}>
                                      <Button
                                          title="Confirm & Continue"
                                          onPress={() => void handleReserveAndContinue(match)}
                                      />
                                  </View>
                              ) : null}
                              {!isTerminal &&
                              (activeRequest?.paymentStatus === "reserved" || activeRequest?.paymentStatus === "none") ? (
                                  <Button title="Call" onPress={() => void handleStartCall(match)} />
                              ) : null}
                          </View>
                      ))
                    : null}

                <Text style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>Available operators</Text>

                {!matchesError && !isMatching && hasRequested && acceptedOperators.length === 0 && pendingOperators.length === 0 ? (
                    <Text style={{ marginBottom: 20, color: "#444" }}>
                        No one accepted yet. Try again or expand search.
                    </Text>
                ) : null}

                {!matchesError && !isMatching && pendingOperators.length > 0
                    ? pendingOperators.map((match) => (
                          <View
                              key={match.userId}
                              style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 10 }}
                          >
                              <Text style={{ fontSize: 16, marginBottom: 4 }}>{match.displayName}</Text>
                              <Text style={{ marginBottom: 4 }}>Roles: {(match.roles ?? []).join(", ") || "None set"}</Text>
                              <Text style={{ marginBottom: 4 }}>
                                  Capabilities: {(match.capabilities ?? []).join(", ") || "None set"}
                              </Text>
                              <Text style={{ marginBottom: 4 }}>
                                  Trust: ⭐ {match.trustScore ?? DEFAULT_TRUST_SCORE} ({match.reviewCount ?? DEFAULT_REVIEW_COUNT} reviews)
                              </Text>
                              <Text style={{ marginBottom: 12 }}>
                                  Reasons: {(match.reasons ?? []).join(", ") || "No reasons available"}
                              </Text>
                          </View>
                      ))
                    : null}

                <Button title="Back to profile" onPress={() => router.replace("/profile")} />
            </View>
        </ScrollView>
    );
}
