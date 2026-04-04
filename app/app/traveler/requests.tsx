import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, ScrollView, Text, View } from "react-native";
import { getSavedProfile, getSavedTravelerRequests } from "../../lib/storage";

type SavedProfile = {
    userId?: string;
};

type SavedTravelerRequest = {
    requestId: string;
    status: string;
    createdAt: string;
    operatorDisplayName?: string;
};

export default function TravelerRequestsScreen() {
    const [requests, setRequests] = useState<SavedTravelerRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRequests = async () => {
            const profile = (await getSavedProfile()) as SavedProfile | null;
            setRequests(await getSavedTravelerRequests(profile?.userId));
            setIsLoading(false);
        };

        void loadRequests();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading requests...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>My Requests</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                Review the requests created by this traveler profile.
            </Text>

            {requests.length === 0 ? (
                <Text style={{ color: "#444", marginBottom: 24 }}>No requests yet</Text>
            ) : null}

            {requests.map((request) => (
                <View
                    key={request.requestId}
                    style={{ borderWidth: 1, borderColor: "#ddd", padding: 12, marginBottom: 12 }}
                >
                    <Text style={{ marginBottom: 4 }}>
                        Operator: {request.operatorDisplayName || "Not selected yet"}
                    </Text>
                    <Text style={{ marginBottom: 4 }}>Status: {request.status}</Text>
                    <Text>Created: {new Date(request.createdAt).toLocaleString()}</Text>
                </View>
            ))}

            <Button title="Back to Traveler Home" onPress={() => router.back()} />
        </ScrollView>
    );
}
