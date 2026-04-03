import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import {
    getCompletedOperatorSessions,
    type CompletedOperatorSessionItem,
    type HelpIntent,
} from "../../lib/api";
import { getSavedProfile } from "../../lib/storage";

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

export default function OperatorHistoryScreen() {
    const [items, setItems] = useState<CompletedOperatorSessionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadHistory = async () => {
        try {
            setError("");
            const profile = (await getSavedProfile()) as SavedProfile | null;

            if (!profile?.userId) {
                setItems([]);
                return;
            }

            const response = await getCompletedOperatorSessions(profile.userId);
            setItems(response.sessions);
        } catch (err: any) {
            setError(err.message ?? "Could not load completed operator sessions.");
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadHistory();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading completed operator sessions...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Operator history</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                Completed sessions where you were the selected operator.
            </Text>

            <View style={{ marginBottom: 16 }}>
                <Button title="Refresh history" onPress={() => void loadHistory()} />
            </View>

            <View style={{ marginBottom: 16 }}>
                <Button title="View earnings" onPress={() => router.push("/operator/earnings")} />
            </View>

            {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

            {!error && items.length === 0 ? (
                <Text style={{ color: "#444", marginBottom: 20 }}>No completed sessions yet</Text>
            ) : null}

            {items.map((item) => (
                <View
                    key={item.requestId}
                    style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 12 }}
                >
                    <Text style={{ fontSize: 16, marginBottom: 4 }}>
                        {item.traveler.displayName}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>Intent: {intentLabels[item.intent]}</Text>
                    <Text style={{ marginBottom: 4 }}>Location: {item.locationSummary}</Text>
                    <Text style={{ marginBottom: 4 }}>
                        Earned: {item.earnedAmount !== undefined ? `$${item.earnedAmount}` : "Not quoted"} {item.currency}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Completed: {item.completedAt ? new Date(item.completedAt).toLocaleString() : "Unknown"}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Payment: {item.paymentStatus}
                    </Text>
                    {item.paymentStatus === "paid" ? (
                        <Text style={{ marginBottom: 4 }}>Included in earnings</Text>
                    ) : null}
                    <Text>
                        {item.rating !== undefined ? `★ ${item.rating}${item.review?.comment ? ` • ${item.review.comment}` : ""}` : "No review yet"}
                    </Text>
                </View>
            ))}

            <Button title="Back to profile" onPress={() => router.replace("/profile")} />
        </ScrollView>
    );
}
