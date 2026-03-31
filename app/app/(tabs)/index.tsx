import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

import { createProfile, createUser } from "../../lib/api";

type FormState = {
  name: string;
  city: string;
  languages: string;
  interests: string;
};

const INITIAL_FORM_STATE: FormState = {
  name: "",
  city: "",
  languages: "",
  interests: "",
};

function splitCommaSeparatedValues(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function Index() {
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [result, setResult] = useState("Ready");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const handleCreateProfile = async () => {
    setIsSubmitting(true);
    setError("");
    setResult("Ready");

    try {
      const user = await createUser({
        email: `${Date.now()}@test.com`,
      });

      const profile = await createProfile({
        userId: user.id,
        displayName: form.name,
        city: form.city,
        languages: splitCommaSeparatedValues(form.languages),
        interests: splitCommaSeparatedValues(form.interests),
      });

      setResult(JSON.stringify(profile, null, 2));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";

      setError(message);
      setResult("Ready");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Aylix Onboarding
      </Text>

      <TextInput
        placeholder="Name"
        value={form.name}
        onChangeText={(value) => updateField("name", value)}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="City"
        value={form.city}
        onChangeText={(value) => updateField("city", value)}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Languages (comma separated)"
        value={form.languages}
        onChangeText={(value) => updateField("languages", value)}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Interests (comma separated)"
        value={form.interests}
        onChangeText={(value) => updateField("interests", value)}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />

      <Button
        title={isSubmitting ? "Creating..." : "Create Profile"}
        onPress={handleCreateProfile}
        disabled={isSubmitting}
      />

      {error ? (
        <Text style={{ marginTop: 20, color: "red" }}>Error: {error}</Text>
      ) : null}

      <Text style={{ marginTop: 20 }}>{result}</Text>
    </View>
  );
}
