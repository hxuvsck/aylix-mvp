import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useApp } from "@/lib/app";
import { c } from "@/lib/theme";

export default function Index() {
  const { me, ready } = useApp();
  if (!ready) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={c.blue} /></View>;
  if (!me) return <Redirect href="/welcome" />;
  if (me.role === "admin") return <Redirect href="/admin" />;
  if (me.role === "operator") return <Redirect href="/(operator)/dashboard" />;
  return <Redirect href="/(traveler)/home" />;
}
