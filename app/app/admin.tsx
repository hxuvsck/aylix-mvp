import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { Badge, Button, Card, Screen, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { mnt } from "@/lib/rules";
import { tone } from "@/lib/status";
import type { Application, Request } from "@/lib/types";
import { c, s } from "@/lib/theme";

// AD-02 Live Requests + payment confirm · AD-03 Not-solved review · AD-01 Applications (pilot admin, English)
export default function Admin() {
  const { t } = useApp();
  const [pay, setPay] = useState<Request[]>([]);
  const [live, setLive] = useState<Request[]>([]);
  const [reviews, setReviews] = useState<Request[]>([]);
  const [apps, setApps] = useState<Application[]>([]);

  const load = useCallback(async () => {
    const [p, l, r, a] = await Promise.all([
      api.adminRequests(["awaiting_payment"]),
      api.adminRequests(["searching", "matched"]),
      api.adminRequests(["under_review"]),
      api.adminApplications(),
    ]);
    setPay(p); setLive(l); setReviews(r); setApps(a);
  }, []);
  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));

  const Section = ({ title, children, count }: { title: string; count: number; children: React.ReactNode }) => (
    <View style={{ gap: s(2) }}>
      <T k="h2">{title} ({count})</T>
      {count === 0 ? <T color={c.text2}>{t("admin.none")}</T> : children}
    </View>
  );

  return (
    <Screen>
      <Section title={t("admin.payments")} count={pay.length}>
        {pay.map((r) => (
          <Card key={r.id}>
            <T style={{ fontWeight: "600" }}>{r.code} · {mnt(r.price_mnt)}</T>
            <T k="bodySm" color={c.text2} numberOfLines={2}>{r.description}</T>
            <Button title={t("admin.confirm")} onPress={async () => { await api.adminConfirmPayment(r.id); load(); }} />
          </Card>
        ))}
      </Section>
      <Section title={t("admin.live")} count={live.length}>
        {live.map((r) => (
          <Card key={r.id} onPress={() => router.push(`/request/${r.id}`)} style={{ flexDirection: "row", alignItems: "center", gap: s(3) }}>
            <T style={{ flex: 1, fontWeight: "600" }}>{r.code} · {r.language.toUpperCase()} · {r.district ?? r.city}</T>
            <Badge label={t(`status.${r.status}`)} tone={tone(r.status)} />
          </Card>
        ))}
      </Section>
      <Section title={t("admin.reviews")} count={reviews.length}>
        {reviews.map((r) => (
          <Card key={r.id}>
            <T style={{ fontWeight: "600" }}>{r.code}</T>
            <T k="bodySm" color={c.text2}>{r.not_solved_reason ?? ""}</T>
            <Button kind="ghost" title="Read chat" onPress={() => router.push(`/request/${r.id}`)} />
            <View style={{ flexDirection: "row", gap: s(2) }}>
              {([100, 50, 0] as const).map((pct) => (
                <Button key={pct} kind={pct === 0 ? "secondary" : "primary"} style={{ flex: 1 }} title={`${t("admin.decide")} ${pct}%`} onPress={async () => { await api.adminDecide(r.id, pct, ""); load(); }} />
              ))}
            </View>
          </Card>
        ))}
      </Section>
      <Section title={t("admin.applications")} count={apps.length}>
        {apps.map((a) => (
          <Card key={a.id}>
            <T style={{ fontWeight: "600" }}>{a.full_name}</T>
            <T k="bodySm" color={c.text2}>{a.contact} · {a.city}, {a.area}</T>
            <Badge label={a.review_status} tone="neutral" />
          </Card>
        ))}
      </Section>
      <Button kind="ghost" icon="user" title={t("tab.profile")} onPress={() => router.push("/(traveler)/profile")} />
    </Screen>
  );
}
