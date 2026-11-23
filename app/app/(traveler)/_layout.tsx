import { AppTabs } from "@/components/Tabs";
import { useApp } from "@/lib/app";

export default function TravelerTabs() {
  const { t } = useApp();
  return (
    <AppTabs
      tabs={[
        { name: "home", title: t("tab.home"), icon: "home" },
        { name: "requests", title: t("tab.requests"), icon: "list" },
        { name: "safety", title: t("tab.safety"), icon: "shield" },
        { name: "profile", title: t("tab.profile"), icon: "user" },
      ]}
    />
  );
}
