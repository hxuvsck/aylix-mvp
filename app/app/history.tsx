import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import {
    getCompletedTravelerRequests,
    type CompletedTravelerRequestItem,
    type HelpIntent,
} from "../lib/api";
import { getSavedProfile } from "../lib/storage";

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

export default function HistoryScreen() {
    const [items, setItems] = useState<CompletedTravelerRequestItem[]>([]);
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

            const response = await getCompletedTravelerRequests(profile.userId);
            setItems(response.requests);
        } catch (err: any) {
            setError(err.message ?? "Could not load completed sessions.");
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
                <Text>Loading completed sessions...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Completed sessions</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                Your completed traveler sessions and review status.
            </Text>

            <View style={{ marginBottom: 16 }}>
                <Button title="Refresh history" onPress={() => void loadHistory()} />
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
                        {intentLabels[item.intent]}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>Location: {item.locationSummary}</Text>
                    <Text style={{ marginBottom: 4 }}>
                        Operator: {item.selectedOperator?.displayName || "Not available"}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Status: {item.status} • {item.paymentStatus}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Completed: {item.completedAt ? new Date(item.completedAt).toLocaleString() : "Unknown"}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>
                        Quote: {item.quotedAmount !== undefined ? `$${item.quotedAmount}` : "Not quoted"} {item.currency}
                    </Text>
                    <Text>
                        {item.review ? `★ ${item.review.rating}${item.review.comment ? ` • ${item.review.comment}` : ""}` : "No review submitted yet"}
                    </Text>
                </View>
            ))}

            <Button title="Back to profile" onPress={() => router.replace("/profile")} />
        </ScrollView>
    );
}
