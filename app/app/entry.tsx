import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";
import {
    getSavedProfile,
    resetLocalIdentity,
    saveSelectedRole,
    type SelectedAppRole,
} from "../lib/storage";

type SavedProfile = {
    displayName?: string;
    role?: SelectedAppRole;
};

export default function EntryScreen() {
    const [selectedRole, setSelectedRole] = useState<SelectedAppRole | null>(null);
    const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            setSavedProfile(await getSavedProfile());
            setIsLoading(false);
        };

        void loadProfile();
    }, []);

    const handleChooseRole = async (role: SelectedAppRole) => {
        setSelectedRole(role);
        await saveSelectedRole(role);
        router.push("/onboarding");
    };

    const handleContinue = () => {
        if (savedProfile?.role === "operator") {
            router.replace("/operator/home");
            return;
        }

        router.replace("/traveler/home");
    };

    const handleStartOver = async () => {
        await resetLocalIdentity();
        setSavedProfile(null);
        setSelectedRole(null);
        router.replace("/entry");
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading entry...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: "white" }}>
            <Text style={{ fontSize: 30, marginBottom: 8 }}>Choose Your Demo Path</Text>
            <Text style={{ fontSize: 16, color: "#444", marginBottom: 24 }}>
                Start as a traveler or operator and continue the current MVP flow.
            </Text>

            {savedProfile?.displayName ? (
                <>
                    <View style={{ marginBottom: 12 }}>
                        <Button
                            title={`Continue as ${savedProfile.displayName}`}
                            onPress={handleContinue}
                        />
                    </View>
                    <Button title="Start Over" onPress={() => void handleStartOver()} />
                </>
            ) : (
                <>
                    <View style={{ marginBottom: 12 }}>
                        <Button
                            title={
                                selectedRole === "traveler"
                                    ? "Continue as Traveler selected"
                                    : "Continue as Traveler"
                            }
                            onPress={() => void handleChooseRole("traveler")}
                        />
                    </View>

                    <Button
                        title={
                            selectedRole === "operator"
                                ? "Continue as Operator selected"
                                : "Continue as Operator"
                        }
                        onPress={() => void handleChooseRole("operator")}
                    />
                </>
            )}
        </View>
    );
}
