import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Badge, Card, Center, Screen, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { mnt } from "@/lib/rules";
import type { Request } from "@/lib/types";
import { tone } from "@/lib/status";
import { c } from "@/lib/theme";


// TR-14 Request history
export default function Requests() {
  const { t } = useApp();
  const [list, setList] = useState<Request[] | null>(null);
  useFocusEffect(useCallback(() => { api.myRequests().then(setList).catch(() => setList([])); }, []));

  return (
    <Screen>
      {list?.length === 0 && <Center><T color={c.text2}>{t("history.empty")}</T></Center>}
      {list?.map((r) => {
        const cost = r.refund_pct != null ? r.price_mnt * (100 - r.refund_pct) / 100 : r.price_mnt;
        return (
          <Card key={r.id} onPress={() => router.push(`/request/${r.id}`)}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T style={{ fontWeight: "600" }}>{r.code} · {t(`home.${r.help_type}`)}</T>
              <T style={{ fontWeight: "600" }}>{mnt(cost)}</T>
            </View>
            <T k="bodySm" color={c.text2} numberOfLines={2}>{r.description}</T>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Badge label={t(`status.${r.status}`) + (r.refund_pct ? ` · ${r.refund_pct}%` : "")} tone={tone(r.status)} />
              <T k="bodySm" color={c.text3}>{new Date(r.created_at).toLocaleDateString()}</T>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
