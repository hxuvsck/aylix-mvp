import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function TravelerRequestsPlaceholderScreen() {
    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 28, marginBottom: 8 }}>My Requests</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                This placeholder will hold traveler request history and active requests.
            </Text>

            <Button title="Back to Traveler Home" onPress={() => router.back()} />
        </View>
    );
}
