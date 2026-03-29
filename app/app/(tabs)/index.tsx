import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

const API_BASE =
  Platform.OS === "web"
    ? "http://localhost:4000"
    : "http://192.168.1.5:4000"; // ← replace with your IPv4

export default function Index() {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((res) => res.json())
      .then((data) => setStatus(JSON.stringify(data)))
      .catch((err) => setStatus(`Error: ${err.message}`));
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 12 }}>
        Aylix MVP
      </Text>
      <Text>{status}</Text>
    </View>
  );
}