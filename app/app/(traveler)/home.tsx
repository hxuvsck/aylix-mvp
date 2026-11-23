import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { EmergencyNumbers } from "@/components/SafetyScreen";
import { Card, EmergencyStrip, IconTile, Screen, T, type IconName } from "@/components/ui";
import { useNow } from "@/hooks/useRequest";
import { api, useApp } from "@/lib/app";
import { isOpen, mnt, PRICE_MNT } from "@/lib/rules";
import type { HelpType, Request } from "@/lib/types";
import { c, s } from "@/lib/theme";

const types: { k: HelpType; icon: IconName }[] = [
  { k: "navigation", icon: "map-pin" },
  { k: "translation", icon: "globe" },
  { k: "local", icon: "help-circle" },
];

// TR-05 Home / pick help type · TR-04 outside-hours variant
export default function Home() {
  const { t } = useApp();
  const now = useNow(30000);
  const open = isOpen(new Date(now));
  const [active, setActive] = useState<Request | null>(null);

  useFocusEffect(useCallback(() => {
    api.myRequests().then((rs) => setActive(rs.find((r) => ["awaiting_payment", "searching", "matched"].includes(r.status)) ?? null)).catch(() => {});
  }, []));

  if (!open) {
    return (
      <Screen>
        <Card style={{ alignItems: "flex-start" }}>
          <IconTile name="moon" tint={c.navyTint} color={c.navy} />
          <T k="h1">{t("home.closedTitle")}</T>
          <T color={c.text2}>{t("home.closedBody")}</T>
        </Card>
        <EmergencyNumbers />
      </Screen>
    );
  }

  return (
    <Screen>
      {active && (
        <Card onPress={() => router.push(`/request/${active.id}`)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: c.blueTint, borderColor: c.blue }}>
          <Feather name="message-circle" size={24} color={c.blue} />
          <View style={{ flex: 1 }}>
            <T style={{ fontWeight: "600" }}>{t("home.active")}</T>
            <T k="bodySm" color={c.text2}>{active.code} · {t(`status.${active.status}`)}</T>
          </View>
          <T color={c.blue} style={{ fontWeight: "600" }}>{t("home.open")}</T>
        </Card>
      )}
      <T k="h1">{t("home.hi")}</T>
      {types.map(({ k, icon }) => (
        <Card key={k} onPress={() => router.push({ pathname: "/request/new", params: { type: k } })} style={{ flexDirection: "row", alignItems: "center", gap: s(4) }}>
          <IconTile name={icon} />
          <View style={{ flex: 1, gap: 2 }}>
            <T k="title">{t(`home.${k}`)}</T>
            <T k="bodySm" color={c.text2}>{t(`home.${k}.sub`)}</T>
          </View>
          <Feather name="chevron-right" size={20} color={c.text3} />
        </Card>
      ))}
      <Card style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: s(3) }}>
        <T k="bodySm" color={c.text2}>{t("home.price")}</T>
        <T k="title">{mnt(PRICE_MNT)}</T>
      </Card>
      <EmergencyStrip />
    </Screen>
  );
}
