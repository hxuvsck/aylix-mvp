import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

const API = "http://localhost:4000";

export default function Index() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [languages, setLanguages] = useState("");
  const [interests, setInterests] = useState("");
  const [result, setResult] = useState("Ready");

  const createProfile = async () => {
    try {
      setResult("Creating...");

      const userRes = await fetch(`${API}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: `${Date.now()}@test.com`,
        }),
      });

      const user = await userRes.json();

      const profileRes = await fetch(`${API}/profiles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          displayName: name,
          city,
          languages: languages.split(","),
          interests: interests.split(","),
        }),
      });

      const profile = await profileRes.json();

      setResult(JSON.stringify(profile, null, 2));
    } catch (err: any) {
      setResult("ERROR: " + err.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "white" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Aylix Onboarding
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

      <Button title="Create Profile" onPress={createProfile} />

      <Text style={{ marginTop: 20 }}>{result}</Text>
    </View>
  );
}