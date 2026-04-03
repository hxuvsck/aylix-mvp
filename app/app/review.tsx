import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { submitReview } from "../lib/api";
import { saveLatestReview, updateUserTrust } from "../lib/storage";

function getSingleParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

function safeParseArray(value?: string) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export default function ReviewScreen() {
    const params = useLocalSearchParams<{
        requestId?: string | string[];
        userId?: string | string[];
        displayName?: string | string[];
        city?: string | string[];
        score?: string | string[];
        reasons?: string | string[];
    }>();

    const requestId = getSingleParam(params.requestId);
    const userId = getSingleParam(params.userId);
    const displayName = getSingleParam(params.displayName);
    const city = getSingleParam(params.city);
    const score = getSingleParam(params.score);
    const reasons = safeParseArray(getSingleParam(params.reasons));
    const [rating, setRating] = useState<number | null>(null);
    const [helpfulText, setHelpfulText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmitReview = async () => {
        if (isSubmitting) {
            return;
        }

        if (!requestId || !userId || !displayName || rating === null) {
            return;
        }

        try {
            setIsSubmitting(true);
            setError("");
            await submitReview(requestId, {
                userId,
                rating,
                comment: helpfulText.trim() || undefined,
            });
            await saveLatestReview({
                userId,
                displayName,
                city,
                score,
                reasons,
                rating,
                helpfulText,
                submittedAt: new Date().toISOString(),
            });
            await updateUserTrust(userId, rating);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message ?? "Could not submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!requestId || !userId || !displayName) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    Review details are missing. Return to your profile and start the call again.
                </Text>
                <Button title="Back to Profile" onPress={() => router.replace("/profile")} />
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
                <Text style={{ fontSize: 28, marginBottom: 8 }}>Rate your session</Text>
                <Text style={{ fontSize: 18, marginBottom: 8 }}>{displayName}</Text>
                {requestId ? <Text style={{ marginBottom: 8 }}>Session completed</Text> : null}
                <Text style={{ marginBottom: 20, color: "#444" }}>
                    Share a quick rating and note about what was helpful.
                </Text>

                {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

                {isSuccess ? (
                    <View>
                        <Text style={{ marginBottom: 16 }}>Review submitted</Text>
                        <View style={{ marginBottom: 12 }}>
                            <Button title="Go to history" onPress={() => router.replace("/history")} />
                        </View>
                        <Button title="Back to profile" onPress={() => router.replace("/profile")} />
                    </View>
                ) : (
                    <>
                        <Text style={{ marginBottom: 10 }}>Rating: {rating ?? "Not selected"}</Text>
                        <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 16 }}>
                            {[1, 2, 3, 4, 5].map((value) => (
                                <View key={value} style={{ marginRight: 8, marginBottom: 8 }}>
                                    <Button title={String(value)} onPress={() => setRating(value)} />
                                </View>
                            ))}
                        </View>

                        <TextInput
                            placeholder="What was helpful?"
                            value={helpfulText}
                            onChangeText={setHelpfulText}
                            style={{ borderWidth: 1, marginBottom: 16, padding: 10 }}
                            multiline
                        />

                        <View style={{ marginBottom: 12 }}>
                            <Button
                                title={
                                    isSubmitting
                                        ? "Submitting review..."
                                        : rating === null
                                          ? "Select a rating to submit"
                                          : "Submit Review"
                                }
                                onPress={() => void handleSubmitReview()}
                                disabled={rating === null || isSubmitting}
                            />
                        </View>

                        <Button title="Back to Profile" onPress={() => router.replace("/profile")} />
                    </>
                )}
            </View>
        </ScrollView>
    );
}
