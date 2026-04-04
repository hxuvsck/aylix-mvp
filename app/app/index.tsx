import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, View } from "react-native";
import { saveSelectedRole, type SelectedAppRole } from "../lib/storage";

export default function EntryScreen() {
    const [selectedRole, setSelectedRole] = useState<SelectedAppRole | null>(null);

    const handleContinue = async (role: SelectedAppRole) => {
        setSelectedRole(role);
        await saveSelectedRole(role);
        router.push(role === "traveler" ? "/traveler/home" : "/operator/home");
    };

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 30, marginBottom: 8 }}>Welcome to Aylix</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                Choose how you want to continue in the MVP flow.
            </Text>

            <View style={{ marginBottom: 12 }}>
                <Button
                    title={
                        selectedRole === "traveler"
                            ? "Continue as Traveler selected"
                            : "Continue as Traveler"
                    }
                    onPress={() => void handleContinue("traveler")}
                />
            </View>

            <Button
                title={
                    selectedRole === "operator"
                        ? "Continue as Operator selected"
                        : "Continue as Operator"
                }
                onPress={() => void handleContinue("operator")}
            />
        </View>
    );
}
