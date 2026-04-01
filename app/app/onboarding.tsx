import { router } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { createProfile, createUser } from "../lib/api";
import { saveProfile } from "../lib/storage";

export default function OnboardingScreen() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [languages, setLanguages] = useState("");
    const [interests, setInterests] = useState("");
    const [vibe, setVibe] = useState("");
    const [travelStyle, setTravelStyle] = useState("");
    const [helpTopics, setHelpTopics] = useState("");
    const [result, setResult] = useState("Ready");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function splitCommaSeparatedValues(value: string) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

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
                languages: splitCommaSeparatedValues(languages),
                interests: splitCommaSeparatedValues(interests),
                vibeTags: splitCommaSeparatedValues(vibe),
                travelStyle: splitCommaSeparatedValues(travelStyle),
                helpTopics: splitCommaSeparatedValues(helpTopics),
            });

            await saveProfile(profile);
            setResult("Profile created");

            router.push({
                pathname: "/profile",
                params: {
                    userId: profile.userId,
                    displayName: profile.displayName,
                    city: profile.city ?? "",
                    languages: JSON.stringify(profile.languages ?? []),
                    interests: JSON.stringify(profile.interests ?? []),
                    vibeTags: JSON.stringify(profile.vibeTags ?? []),
                    travelStyle: JSON.stringify(profile.travelStyle ?? []),
                    helpTopics: JSON.stringify(profile.helpTopics ?? []),
                },
            });
        } catch (err: any) {
            setResult(`ERROR: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
            keyboardShouldPersistTaps="handled"
        >
            <View>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>Meet your Aylix profile</Text>
                <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                    Tell us how you travel and how you like to help so your profile feels match-ready.
                </Text>

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

                <TextInput
                    placeholder="Vibe (comma separated)"
                    value={vibe}
                    onChangeText={setVibe}
                    style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
                />

                <TextInput
                    placeholder="Travel style (comma separated)"
                    value={travelStyle}
                    onChangeText={setTravelStyle}
                    style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
                />

                <TextInput
                    placeholder="Help topics (comma separated)"
                    value={helpTopics}
                    onChangeText={setHelpTopics}
                    style={{ borderWidth: 1, marginBottom: 16, padding: 10 }}
                />

                <Button
                    title={isSubmitting ? "Creating your profile..." : "Create Aylix Profile"}
                    onPress={handleCreate}
                    disabled={isSubmitting}
                />

                <Text style={{ marginTop: 20 }}>{result}</Text>
            </View>
        </ScrollView>
    );
}
