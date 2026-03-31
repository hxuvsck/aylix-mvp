import { router, useLocalSearchParams } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ProfileScreen() {
    const params = useLocalSearchParams<{
        userId?: string;
        displayName?: string;
        city?: string;
        languages?: string;
        interests?: string;
    }>();

    const languages = params.languages ? JSON.parse(params.languages) : [];
    const interests = params.interests ? JSON.parse(params.interests) : [];

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "white", justifyContent: "center" }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile</Text>

            <Text style={{ marginBottom: 8 }}>User ID: {params.userId}</Text>
            <Text style={{ marginBottom: 8 }}>Name: {params.displayName}</Text>
            <Text style={{ marginBottom: 8 }}>City: {params.city}</Text>
            <Text style={{ marginBottom: 8 }}>Languages: {languages.join(", ")}</Text>
            <Text style={{ marginBottom: 20 }}>Interests: {interests.join(", ")}</Text>

            <Button title="Back to Onboarding" onPress={() => router.push("/onboarding")} />
        </View>
    );
}