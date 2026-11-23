import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { IconName } from "@/components/ui";
import { c } from "@/lib/theme";

export function AppTabs({ tabs }: { tabs: { name: string; title: string; icon: IconName }[] }) {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.blue,
        tabBarInactiveTintColor: c.text3,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.hairline },
        headerStyle: { backgroundColor: c.surface },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: "600", color: c.text },
        sceneStyle: { backgroundColor: c.page },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{ title: tab.title, tabBarIcon: ({ color, size }) => <Feather name={tab.icon} size={size - 2} color={color} /> }}
        />
      ))}
    </Tabs>
  );
}
