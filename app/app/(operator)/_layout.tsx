import { AppTabs } from "@/components/Tabs";
import { useApp } from "@/lib/app";

export default function OperatorTabs() {
  const { t } = useApp();
  return (
    <AppTabs
      tabs={[
        { name: "dashboard", title: t("tab.home"), icon: "home" },
        { name: "earnings", title: t("tab.earnings"), icon: "credit-card" },
        { name: "safety", title: t("tab.safety"), icon: "shield" },
        { name: "profile", title: t("tab.profile"), icon: "user" },
      ]}
    />
  );
}
