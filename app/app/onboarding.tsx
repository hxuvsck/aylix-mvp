import { router } from "expo-router";
import { useState } from "react";
import { Button, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { capabilitiesOptions, createProfile, createUser, personalityOptions, roleOptions } from "../lib/api";
import { getSelectedRole, saveProfile } from "../lib/storage";

const languageOptions = [
    "English",
    "Mongolian",
    "Korean",
    "Japanese",
    "Chinese",
    "Russian",
    "German",
    "French",
    "Spanish",
    "Turkish",
] as const;

const travelStyleOptions = [
    "Budget",
    "Standard",
    "Luxury",
    "Adventure",
    "Cultural",
    "Food & Dining",
    "Nightlife",
    "Nature",
    "Relaxation",
    "Business",
] as const;

const interestOptions = [
    "Food",
    "Culture",
    "History",
    "Nature",
    "Shopping",
    "Nightlife",
    "Photography",
    "Events",
    "Wellness",
    "Local Living",
] as const;

const vibeOptions = [
    "Calm",
    "Friendly",
    "Energetic",
    "Professional",
    "Adventurous",
    "Luxury",
    "Social",
    "Flexible",
] as const;

const helpTopicOptions = [
    "City Navigation",
    "Local Recommendations",
    "Food & Restaurants",
    "Nightlife",
    "Culture & History",
    "Shopping",
    "Translation Help",
    "Emergency Help",
    "Transport Guidance",
    "Trip Planning",
    "Visa & Documents",
    "Business Assistance",
] as const;

const cityOptions = [
    "Ulaanbaatar",
    "Seoul",
    "Tokyo",
    "Osaka",
    "Bangkok",
    "Paris",
    "Berlin",
    "New York",
    "Bali",
] as const;

export default function OnboardingScreen() {
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [roles, setRoles] = useState<(typeof roleOptions)[number][]>([]);
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [personality, setPersonality] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [vibe, setVibe] = useState<string[]>([]);
    const [travelStyle, setTravelStyle] = useState<string[]>([]);
    const [helpTopics, setHelpTopics] = useState<string[]>([]);
    const [result, setResult] = useState("Ready");
    const [isSubmitting, setIsSubmitting] = useState(false);

    function toggleSelection<T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) {
        setSelected(
            selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
        );
    }

    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const operatorIntent = roles.length > 0 || capabilities.length > 0 || languages.length > 0;
    const validationMessage = !trimmedName
        ? "Display name is required"
        : !trimmedCity
          ? "City is required"
          : operatorIntent && roles.length === 0
            ? "Select at least one role"
            : operatorIntent && capabilities.length === 0
              ? "Add at least one capability"
              : operatorIntent && languages.length === 0
                ? "Add at least one language"
                : "";

    const renderSelectableGroup = (
        label: string,
        options: readonly string[],
        selected: string[],
        setSelected: (next: string[]) => void
    ) => (
        <View style={{ marginBottom: 14 }}>
            <Text style={{ marginBottom: 8 }}>{label}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {options.map((option) => {
                    const isSelected = selected.includes(option);

                    return (
                        <Pressable
                            key={option}
                            onPress={() => toggleSelection(option, selected, setSelected)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderWidth: 1,
                                borderColor: isSelected ? "#0a7ea4" : "#bbb",
                                backgroundColor: isSelected ? "#e7f6fb" : "#fff",
                                borderRadius: 999,
                                marginRight: 8,
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ color: isSelected ? "#0a7ea4" : "#222" }}>{option}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <Text style={{ color: "#444" }}>
                Selected: {selected.length > 0 ? selected.join(", ") : "None"}
            </Text>
        </View>
    );

    const renderSingleSelectGroup = (
        label: string,
        options: readonly string[],
        selected: string,
        setSelected: (next: string) => void
    ) => (
        <View style={{ marginBottom: 14 }}>
            <Text style={{ marginBottom: 8 }}>{label}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {options.map((option) => {
                    const isSelected = selected === option;

                    return (
                        <Pressable
                            key={option}
                            onPress={() => setSelected(option)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderWidth: 1,
                                borderColor: isSelected ? "#0a7ea4" : "#bbb",
                                backgroundColor: isSelected ? "#e7f6fb" : "#fff",
                                borderRadius: 999,
                                marginRight: 8,
                                marginBottom: 8,
                            }}
                        >
                            <Text style={{ color: isSelected ? "#0a7ea4" : "#222" }}>{option}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <Text style={{ color: "#444" }}>Selected: {selected || "None"}</Text>
        </View>
    );

    const handleCreate = async () => {
        if (isSubmitting) {
            return;
        }

        if (validationMessage) {
            setResult(`ERROR: ${validationMessage}`);
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
                languages,
                interests,
                vibeTags: vibe,
                travelStyle,
                helpTopics,
            });

            await saveProfile(profile);
            setResult("Profile created");

            const selectedRole = await getSelectedRole();

            if (selectedRole === "operator") {
                router.push("/operator/home");
                return;
            }

            if (selectedRole === "traveler") {
                router.push("/traveler/home");
                return;
            }

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
                <Text style={{ marginBottom: 16, color: "#444" }}>
                    Every profile needs a display name and city. To appear as a helper, add at least one role,
                    one capability, and one language.
                </Text>

                <TextInput
                    placeholder="Name"
                    value={name}
                    onChangeText={setName}
                    style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
                />

                {renderSingleSelectGroup("City", cityOptions, city, setCity)}

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

                {renderSelectableGroup("Languages", languageOptions, languages, setLanguages)}
                {renderSelectableGroup("Interests", interestOptions, interests, setInterests)}
                {renderSelectableGroup("Vibe", vibeOptions, vibe, setVibe)}
                {renderSelectableGroup("Travel style", travelStyleOptions, travelStyle, setTravelStyle)}
                {renderSelectableGroup("Help topics", helpTopicOptions, helpTopics, setHelpTopics)}

                <Button
                    title={isSubmitting ? "Creating your profile..." : "Create Aylix Profile"}
                    onPress={handleCreate}
                    disabled={isSubmitting || Boolean(validationMessage)}
                />

                {validationMessage && !isSubmitting ? (
                    <Text style={{ marginTop: 12, color: "#444" }}>{validationMessage}</Text>
                ) : null}
                <Text style={{ marginTop: 20 }}>{result}</Text>
            </View>
        </ScrollView>
    );
}
