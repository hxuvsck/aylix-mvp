import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider, useApp } from "@/lib/app";
import { c } from "@/lib/theme";

function Nav() {
  const { t } = useApp();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.surface },
        headerTintColor: c.navy,
        headerTitleStyle: { fontWeight: "600", color: c.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.page },
        headerBackTitle: t("common.back"),
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="sign-in" options={{ title: "" }} />
      <Stack.Screen name="verify" options={{ title: "" }} />
      <Stack.Screen name="(traveler)" options={{ headerShown: false }} />
      <Stack.Screen name="(operator)" options={{ headerShown: false }} />
      <Stack.Screen name="request/new" options={{ title: t("new.title") }} />
      <Stack.Screen name="request/[id]/index" options={{ title: "" }} />
      <Stack.Screen name="request/[id]/close" options={{ title: t("close.title"), presentation: "modal" }} />
      <Stack.Screen name="request/[id]/rate" options={{ title: "", presentation: "modal" }} />
      <Stack.Screen name="admin" options={{ title: t("admin.title") }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Nav />
      </AppProvider>
    </SafeAreaProvider>
  );
}
