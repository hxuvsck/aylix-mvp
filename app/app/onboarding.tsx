import { router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { createProfile, createUser } from "../lib/api";

export default function OnboardingScreen() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [languages, setLanguages] = useState("");
    const [interests, setInterests] = useState("");
    const [result, setResult] = useState("Ready");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        try {
            setIsSubmitting(true);
            setResult("Creating...");

            const user = await createUser({
                email: `${Date.now()}@test.com`,
            });

            const profile = await createProfile({
                userId: user.id,
                displayName: name || "Anonymous",
                city,
                languages: languages
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                interests: interests
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
            });

            setResult("Profile created");

            router.push({
                pathname: "/profile",
                params: {
                    userId: profile.userId,
                    displayName: profile.displayName,
                    city: profile.city ?? "",
                    languages: JSON.stringify(profile.languages ?? []),
                    interests: JSON.stringify(profile.interests ?? []),
                },
            });
        } catch (err: any) {
            setResult(`ERROR: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, backgroundColor: "white", justifyContent: "center" }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Aylix Onboarding</Text>

            <TextInput
                placeholder="Name"
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />

            <TextInput
                placeholder="City"
                value={city}
                onChangeText={setCity}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />

            <TextInput
                placeholder="Languages (comma separated)"
                value={languages}
                onChangeText={setLanguages}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />

            <TextInput
                placeholder="Interests (comma separated)"
                value={interests}
                onChangeText={setInterests}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />

            <Button
                title={isSubmitting ? "Creating..." : "Create Profile"}
                onPress={handleCreate}
                disabled={isSubmitting}
            />

            <Text style={{ marginTop: 20 }}>{result}</Text>
        </View>
    );
}