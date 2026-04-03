import { router } from "expo-router";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { capabilitiesOptions, createProfile, createUser, personalityOptions, roleOptions } from "../lib/api";
import { saveProfile } from "../lib/storage";

export default function OnboardingScreen() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [roles, setRoles] = useState<(typeof roleOptions)[number][]>([]);
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [personality, setPersonality] = useState<string[]>([]);
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

    function toggleSelection<T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) {
        setSelected(
            selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
        );
    }

    const handleCreate = async () => {
        if (isSubmitting) {
            return;
        }

        const trimmedName = name.trim();
        const trimmedCity = city.trim();

        if (!trimmedName) {
            setResult("ERROR: Name is required.");
            return;
        }

        try {
            setIsSubmitting(true);
            setResult("Creating...");

            const user = await createUser({
                email: `${Date.now()}@test.com`,
            });

            const profile = await createProfile({
                userId: user.id,
                displayName: trimmedName,
                isAvailable,
                roles,
                capabilities,
                personality,
                ...(trimmedCity ? { city: trimmedCity } : {}),
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
                    isAvailable: profile.isAvailable === false ? "false" : "true",
                    roles: JSON.stringify(profile.roles ?? []),
                    capabilities: JSON.stringify(profile.capabilities ?? []),
                    personality: JSON.stringify(profile.personality ?? []),
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

                <Text style={{ marginBottom: 8 }}>
                    Availability: {isAvailable ? "Available to help" : "Not available"}
                </Text>
                <View style={{ marginBottom: 10 }}>
                    <Button
                        title={isAvailable ? "Set as not available" : "Set as available"}
                        onPress={() => setIsAvailable((current) => !current)}
                    />
                </View>

                <Text style={{ marginBottom: 8 }}>Roles</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                    {roleOptions.map((role) => (
                        <View key={role} style={{ marginRight: 8, marginBottom: 8 }}>
                            <Button
                                title={roles.includes(role) ? `${role} selected` : role}
                                onPress={() => toggleSelection(role, roles, setRoles)}
                            />
                        </View>
                    ))}
                </View>

                <Text style={{ marginBottom: 8 }}>Capabilities</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                    {capabilitiesOptions.map((capability) => (
                        <View key={capability} style={{ marginRight: 8, marginBottom: 8 }}>
                            <Button
                                title={capabilities.includes(capability) ? `${capability} selected` : capability}
                                onPress={() => toggleSelection(capability, capabilities, setCapabilities)}
                            />
                        </View>
                    ))}
                </View>

                <Text style={{ marginBottom: 8 }}>Personality</Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 10 }}>
                    {personalityOptions.map((trait) => (
                        <View key={trait} style={{ marginRight: 8, marginBottom: 8 }}>
                            <Button
                                title={personality.includes(trait) ? `${trait} selected` : trait}
                                onPress={() => toggleSelection(trait, personality, setPersonality)}
                            />
                        </View>
                    ))}
                </View>

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
