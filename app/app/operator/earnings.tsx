import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import {
    getOperatorEarnings,
    type HelpIntent,
    type OperatorEarningsSnapshot,
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

export default function OperatorEarningsScreen() {
    const [snapshot, setSnapshot] = useState<OperatorEarningsSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const loadEarnings = async () => {
        try {
            setError("");
            const profile = (await getSavedProfile()) as SavedProfile | null;

            if (!profile?.userId) {
                setSnapshot(null);
                return;
            }

            const response = await getOperatorEarnings(profile.userId);
            setSnapshot(response);
        } catch (err: any) {
            setError(err.message ?? "Could not load operator earnings.");
            setSnapshot(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadEarnings();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading earnings...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 20, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>Operator earnings</Text>
            <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                Mock earnings visibility from completed paid sessions.
            </Text>

            <View style={{ marginBottom: 16 }}>
                <Button title="Refresh earnings" onPress={() => void loadEarnings()} />
            </View>

            {error ? <Text style={{ marginBottom: 16 }}>ERROR: {error}</Text> : null}

            {snapshot ? (
                <>
                    <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 12 }}>
                        <Text style={{ marginBottom: 4 }}>Net Earnings</Text>
                        <Text style={{ fontSize: 22 }}>${snapshot.netEarnings.toFixed(2)} {snapshot.currency}</Text>
                    </View>
                    <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 12 }}>
                        <Text style={{ marginBottom: 4 }}>Completed Sessions</Text>
                        <Text style={{ fontSize: 22 }}>{snapshot.completedSessions}</Text>
                    </View>
                    <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                        <Text style={{ marginBottom: 4 }}>Average Rating</Text>
                        <Text style={{ fontSize: 22 }}>
                            {snapshot.averageRating === null ? "No ratings yet" : `★ ${snapshot.averageRating}`}
                        </Text>
                    </View>

                    <View style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 20 }}>
                        <Text style={{ marginBottom: 4 }}>Gross Earnings: ${snapshot.grossEarnings.toFixed(2)} {snapshot.currency}</Text>
                        <Text style={{ marginBottom: 4 }}>Pending: ${snapshot.pendingEarnings.toFixed(2)} {snapshot.currency}</Text>
                        <Text>Paid Out: ${snapshot.paidOutEarnings.toFixed(2)} {snapshot.currency}</Text>
                    </View>

                    <Text style={{ fontSize: 22, marginBottom: 12 }}>Recent earnings</Text>
                    {snapshot.recentTransactions.length === 0 ? (
                        <Text style={{ color: "#444", marginBottom: 20 }}>No completed sessions yet</Text>
                    ) : (
                        snapshot.recentTransactions.map((item) => (
                            <View
                                key={item.requestId}
                                style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 12 }}
                            >
                                <Text style={{ fontSize: 16, marginBottom: 4 }}>{item.travelerName}</Text>
                                <Text style={{ marginBottom: 4 }}>Intent: {intentLabels[item.intent]}</Text>
                                <Text style={{ marginBottom: 4 }}>Net: ${item.netAmount.toFixed(2)} {snapshot.currency}</Text>
                                <Text style={{ marginBottom: 4 }}>
                                    Completed: {item.completedAt ? new Date(item.completedAt).toLocaleString() : "Unknown"}
                                </Text>
                                <Text style={{ marginBottom: 4 }}>Payout: {item.payoutStatus}</Text>
                                <Text>{item.rating === null ? "No rating yet" : `★ ${item.rating}`}</Text>
                            </View>
                        ))
                    )}
                </>
            ) : !error ? (
                <Text style={{ color: "#444", marginBottom: 20 }}>No completed sessions yet</Text>
            ) : null}

            <Button title="Back to profile" onPress={() => router.replace("/profile")} />
        </ScrollView>
    );
}
