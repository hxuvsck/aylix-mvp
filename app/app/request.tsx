import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import {
    getRequestState,
    helpIntentOptions,
    matchHelpRequest,
    urgencyOptions,
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
    const [acceptedOperators, setAcceptedOperators] = useState<MatchWithTrust[]>([]);
    const [pendingOperators, setPendingOperators] = useState<MatchWithTrust[]>([]);
    const [matchesError, setMatchesError] = useState("");
    const [isMatching, setIsMatching] = useState(false);
    const [hasRequested, setHasRequested] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            setProfile(await getSavedProfile());
            setIsLoadingProfile(false);
        };

        void loadProfile();
    }, []);

    useEffect(() => {
        if (!activeRequest?.id || activeRequest.status === "completed" || activeRequest.status === "cancelled") {
            return;
        }

        const pollRequestState = async () => {
            try {
                const response = await getRequestState(activeRequest.id);

                const [acceptedWithTrust, pendingWithTrust] = await Promise.all([
                    Promise.all(
                        response.acceptedOperators.map(async (match) => {
                            const trust = await getUserTrust(match.userId);
                            return {
                                ...match,
                                trustScore: trust.trustScore ?? match.trustScore ?? DEFAULT_TRUST_SCORE,
                                reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
                            };
                        })
                    ),
                    Promise.all(
                        response.pendingOperators.map(async (match) => {
                            const trust = await getUserTrust(match.userId);
                            return {
                                ...match,
                                trustScore: trust.trustScore ?? match.trustScore ?? DEFAULT_TRUST_SCORE,
                                reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
                            };
                        })
                    ),
                ]);

                setActiveRequest(response.request);
                setNominations(response.nominations);
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

            const matchesWithTrust = await Promise.all(
                response.matches.map(async (match) => {
                    const trust = await getUserTrust(match.userId);

                    return {
                        ...match,
                        trustScore: trust.trustScore ?? match.trustScore ?? DEFAULT_TRUST_SCORE,
                        reviewCount: trust.reviewCount ?? DEFAULT_REVIEW_COUNT,
                    };
                })
            );

            setActiveRequest(response.request);
            setNominations(response.nominations);
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

    const handleStartCall = (match: Match) => {
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
                              <Button title="Call" onPress={() => handleStartCall(match)} />
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
