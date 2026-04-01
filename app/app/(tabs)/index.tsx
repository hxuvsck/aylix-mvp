import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { getSavedProfile } from "../../lib/storage";

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await getSavedProfile();
      setHasProfile(Boolean(profile));
      setLoading(false);
    };

    void loadProfile();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  if (hasProfile) {
    return <Redirect href="/profile" />;
  }

  return <Redirect href="/onboarding" />;
}
