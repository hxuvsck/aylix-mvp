import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Badge, Card, Center, Row, Screen, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { mnt } from "@/lib/rules";
import type { PayoutItem } from "@/lib/types";
import { c, s } from "@/lib/theme";

// OP-07 Earnings
export default function Earnings() {
  const { t } = useApp();
  const [items, setItems] = useState<PayoutItem[]>([]);
  useFocusEffect(useCallback(() => { api.payouts().then(setItems).catch(() => {}); }, []));
  const sum = (st: PayoutItem["status"]) => items.filter((i) => i.status === st).reduce((a, i) => a + i.amount_mnt, 0);

  return (
    <Screen>
      <Card>
        <Row label={t("earn.hold")} value={mnt(sum("on_hold"))} />
        <Row label={t("earn.ready")} value={mnt(sum("ready"))} />
        <Row label={t("earn.paid")} value={mnt(sum("paid"))} />
        <T k="bodySm" color={c.text2}>{t("earn.schedule")}</T>
      </Card>
      {items.length === 0 && <Center><T color={c.text2}>{t("earn.empty")}</T></Center>}
      {items.map((i) => (
        <Card key={i.request_id} style={{ flexDirection: "row", alignItems: "center", gap: s(3) }}>
          <View style={{ flex: 1, gap: 4 }}>
            <T style={{ fontWeight: "600" }}>{i.request_id.length > 12 ? i.request_id.slice(0, 8) : i.request_id}</T>
            <Badge label={t(i.status === "on_hold" ? "earn.hold" : i.status === "ready" ? "earn.ready" : "earn.paid")} tone={i.status === "paid" ? "green" : i.status === "ready" ? "blue" : "gold"} />
          </View>
          <T k="title">{mnt(i.amount_mnt)}</T>
        </Card>
      ))}
    </Screen>
  );
}
