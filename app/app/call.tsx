import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { updateRequestStatus } from "../lib/api";

function safeParseArray(value?: string) {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function getSingleParam(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
}

export default function CallScreen() {
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
    const [callState, setCallState] = useState<"connecting" | "connected">("connecting");
    const [durationSeconds, setDurationSeconds] = useState(0);

    const handleEndCall = () => {
        router.push({
            pathname: "/review",
            params: {
                requestId: requestId ?? "",
                userId,
                displayName,
                city: city ?? "",
                score: score ?? "0",
                reasons: JSON.stringify(reasons),
            },
        });
    };

    useEffect(() => {
        if (!userId || !displayName) {
            return;
        }

        const connectTimeout = setTimeout(() => {
            setCallState("connected");
        }, 1500);

        return () => {
            clearTimeout(connectTimeout);
        };
    }, [userId, displayName]);

    useEffect(() => {
        if (!requestId) {
            return;
        }

        void updateRequestStatus(requestId, "in_call");
    }, [requestId]);

    useEffect(() => {
        if (callState !== "connected") {
            return;
        }

        const durationInterval = setInterval(() => {
            setDurationSeconds((current) => current + 1);
        }, 1000);

        return () => {
            clearInterval(durationInterval);
        };
    }, [callState]);

    if (!userId || !displayName) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    Call details are missing. Return to your profile and start the call again.
                </Text>
                <Button title="Back to Profile" onPress={() => router.replace("/profile")} />
            </View>
        );
    }

    const formattedDuration = `${String(Math.floor(durationSeconds / 60)).padStart(2, "0")}:${String(
        durationSeconds % 60
    ).padStart(2, "0")}`;
    const statusText =
        callState === "connecting" ? `Connecting to ${displayName}...` : `Connected with ${displayName}`;

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, justifyContent: "center", flexGrow: 1 }}
        >
            <View>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>Audio Call</Text>
                <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                    {statusText}
                </Text>

                <Text style={{ fontSize: 18, marginBottom: 8 }}>{displayName}</Text>
                <Text style={{ marginBottom: 8 }}>City: {city || "Unknown"}</Text>
                <Text style={{ marginBottom: 8 }}>Score: {score ?? "0"}</Text>
                <Text style={{ marginBottom: 8 }}>
                    Status: {callState === "connecting" ? "Connecting..." : "Connected"}
                </Text>
                <Text style={{ marginBottom: 8 }}>Duration: {formattedDuration}</Text>
                <Text style={{ marginBottom: 20 }}>
                    Reasons: {reasons.length > 0 ? reasons.join(", ") : "No reasons available"}
                </Text>

                <View style={{ marginBottom: 12 }}>
                    <Button title="End Call" onPress={handleEndCall} />
                </View>

                <Button title="Back to Profile" onPress={() => router.replace("/profile")} />
            </View>
        </ScrollView>
    );
}
