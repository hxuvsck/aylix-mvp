import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { createProfile, createUser, type Role } from "../lib/api";
import { getSelectedRole, saveProfile, type SelectedAppRole } from "../lib/storage";

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

const operatorRoleOptions = [
    { value: "guide", label: "Local Guide" },
    { value: "local", label: "Helper" },
    { value: "expert", label: "Concierge" },
] as const;

const operatorCapabilityOptions = [
    { value: "navigation", label: "Getting Around" },
    { value: "food", label: "Food & Places" },
    { value: "explore", label: "Booking Help" },
    { value: "translation", label: "Language Help" },
    { value: "emergency", label: "Emergency Support" },
] as const;

const availabilitySlotOptions = [
    "morning",
    "afternoon",
    "evening",
    "night",
    "anytime",
] as const;

export default function OnboardingScreen() {
    const [selectedRole, setSelectedRole] = useState<SelectedAppRole | null>(null);
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    const [name, setName] = useState("");
    const [city, setCity] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [roles, setRoles] = useState<Role[]>([]);
    const [capabilities, setCapabilities] = useState<string[]>([]);
    const [languages, setLanguages] = useState<string[]>([]);
    const [interests, setInterests] = useState<string[]>([]);
    const [vibe, setVibe] = useState<string[]>([]);
    const [travelStyle, setTravelStyle] = useState<string[]>([]);
    const [hasExperience, setHasExperience] = useState(false);
    const [experienceNote, setExperienceNote] = useState("");
    const [responseSample, setResponseSample] = useState("");
    const [availabilitySlots, setAvailabilitySlots] = useState<string[]>([]);
    const [result, setResult] = useState("Ready");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadSelectedRole = async () => {
            const role = await getSelectedRole();
            setSelectedRole(role);
            setIsLoadingRole(false);
        };

        void loadSelectedRole();
    }, []);

    function toggleSelection<T extends string>(value: T, selected: T[], setSelected: (next: T[]) => void) {
        setSelected(
            selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]
        );
    }

    const trimmedName = name.trim();
    const trimmedCity = city.trim();
    const trimmedExperienceNote = experienceNote.trim();
    const trimmedResponseSample = responseSample.trim();
    const isOperatorRole = selectedRole === "operator";
    const validationMessage = !trimmedName
        ? "Display name is required"
        : !trimmedCity
          ? "City is required"
          : isOperatorRole && languages.length === 0
            ? "Add at least one language"
          : isOperatorRole && roles.length === 0
            ? "Select at least one role"
            : isOperatorRole && capabilities.length === 0
              ? "Add at least one capability"
              : isOperatorRole && !trimmedResponseSample
                ? "Add a response sample"
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

    const renderMappedSelectableGroup = <T extends string>(
        label: string,
        options: readonly { value: T; label: string }[],
        selected: T[],
        setSelected: (next: T[]) => void
    ) => (
        <View style={{ marginBottom: 14 }}>
            <Text style={{ marginBottom: 8 }}>{label}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {options.map((option) => {
                    const isSelected = selected.includes(option.value);

                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => toggleSelection(option.value, selected, setSelected)}
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
                            <Text style={{ color: isSelected ? "#0a7ea4" : "#222" }}>{option.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
            <Text style={{ color: "#444" }}>
                Selected: {selected.length > 0
                    ? options
                          .filter((option) => selected.includes(option.value))
                          .map((option) => option.label)
                          .join(", ")
                    : "None"}
            </Text>
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

            const profilePayload = {
                userId: user.id,
                displayName: trimmedName,
                ...(trimmedCity ? { city: trimmedCity } : {}),
                languages,
                interests,
                vibeTags: vibe,
                travelStyle,
            };

            const profile = await createProfile({
                ...profilePayload,
                role: selectedRole ?? undefined,
                ...(isOperatorRole
                    ? {
                          isAvailable,
                          roles,
                          capabilities,
                          hasExperience,
                          ...(trimmedExperienceNote ? { experienceNote: trimmedExperienceNote } : {}),
                          responseSample: trimmedResponseSample,
                          availabilitySlots,
                      }
                    : {}),
            });

            await saveProfile({
                ...profile,
                role: selectedRole,
            });
            setResult("Profile created");

            if (selectedRole === "operator") {
                router.replace("/operator/home");
                return;
            }

            if (selectedRole === "traveler") {
                router.replace("/traveler/home");
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

    if (isLoadingRole) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white" }}>
                <Text>Loading onboarding...</Text>
            </View>
        );
    }

    if (!selectedRole) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "white", padding: 20 }}>
                <Text style={{ marginBottom: 12, textAlign: "center" }}>
                    Choose whether you are continuing as a traveler or operator before onboarding.
                </Text>
                <Button title="Back to Entry" onPress={() => router.replace("/entry")} />
            </View>
        );
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: "white" }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
            keyboardShouldPersistTaps="handled"
        >
            <View>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>
                    {selectedRole === "operator" ? "Operator Onboarding" : "Traveler Onboarding"}
                </Text>
                <Text style={{ fontSize: 16, marginBottom: 20, color: "#444" }}>
                    {selectedRole === "operator"
                        ? "Create your operator profile so travelers can discover the right kind of help."
                        : "Tell us how you travel so your traveler profile is ready for the MVP flow."}
                </Text>
                <Text style={{ marginBottom: 16, color: "#444" }}>
                    {selectedRole === "operator"
                        ? "Every operator profile needs a display name, city, at least one language, one role, one capability, and a short response sample."
                        : "Every traveler profile needs a display name and city."}
                </Text>

                <Text style={{ fontSize: 18, marginBottom: 12 }}>Basic identity</Text>
                <TextInput
                    placeholder="Display name"
                    value={name}
                    onChangeText={setName}
                    style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
                />

                {renderSingleSelectGroup("City", cityOptions, city, setCity)}

                {selectedRole === "operator" ? (
                    <>
                        <Text style={{ fontSize: 18, marginBottom: 12 }}>Languages</Text>
                        {renderSelectableGroup("Languages", languageOptions, languages, setLanguages)}

                        <Text style={{ fontSize: 18, marginBottom: 12 }}>How you help</Text>
                        {renderMappedSelectableGroup("Operator roles", operatorRoleOptions, roles, setRoles)}
                        {renderMappedSelectableGroup(
                            "Capabilities",
                            operatorCapabilityOptions,
                            capabilities,
                            setCapabilities
                        )}

                        <Text style={{ fontSize: 18, marginBottom: 12 }}>Experience</Text>
                        <Text style={{ marginBottom: 8 }}>
                            Experience: {hasExperience ? "I have prior experience helping travelers" : "I am new to helping travelers"}
                        </Text>
                        <View style={{ marginBottom: 12 }}>
                            <Button
                                title={hasExperience ? "Mark as new to this" : "Mark as experienced"}
                                onPress={() => setHasExperience((current) => !current)}
                            />
                        </View>
                        <TextInput
                            placeholder="Optional short note about your experience"
                            value={experienceNote}
                            onChangeText={setExperienceNote}
                            style={{ borderWidth: 1, marginBottom: 14, padding: 10 }}
                        />

                        <Text style={{ fontSize: 18, marginBottom: 12 }}>Behavior sample</Text>
                        <Text style={{ marginBottom: 8, color: "#444" }}>
                            If a traveler is lost at night in your city, what would you do?
                        </Text>
                        <TextInput
                            placeholder="Write a short response"
                            value={responseSample}
                            onChangeText={setResponseSample}
                            multiline
                            textAlignVertical="top"
                            style={{ borderWidth: 1, marginBottom: 14, padding: 10, minHeight: 110 }}
                        />

                        <Text style={{ fontSize: 18, marginBottom: 12 }}>Availability</Text>
                        <Text style={{ marginBottom: 8 }}>
                            Status: {isAvailable ? "Available to help" : "Not available right now"}
                        </Text>
                        <View style={{ marginBottom: 12 }}>
                            <Button
                                title={isAvailable ? "Set as not available" : "Set as available"}
                                onPress={() => setIsAvailable((current) => !current)}
                            />
                        </View>
                        {renderSelectableGroup(
                            "Availability slots",
                            availabilitySlotOptions,
                            availabilitySlots,
                            setAvailabilitySlots
                        )}
                    </>
                ) : (
                    <>
                        {renderSelectableGroup("Languages", languageOptions, languages, setLanguages)}
                        {renderSelectableGroup("Interests", interestOptions, interests, setInterests)}
                        {renderSelectableGroup("Vibe", vibeOptions, vibe, setVibe)}
                        {renderSelectableGroup("Travel style", travelStyleOptions, travelStyle, setTravelStyle)}
                    </>
                )}

                <Button
                    title={
                        isSubmitting
                            ? selectedRole === "operator"
                                ? "Saving your operator profile..."
                                : "Creating your profile..."
                            : selectedRole === "operator"
                              ? "Save Operator Profile"
                              : "Create Aylix Profile"
                    }
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
