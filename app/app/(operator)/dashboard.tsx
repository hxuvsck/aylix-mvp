import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Switch, View } from "react-native";
import { Badge, Button, Card, IconTile, Screen, T } from "@/components/ui";
import { useNow } from "@/hooks/useRequest";
import { api, useApp } from "@/lib/app";
import { ACCEPT_MIN, mnt, OPERATOR_SHARE } from "@/lib/rules";
import type { Offer, OperatorState, PayoutItem, Request } from "@/lib/types";
import { c, s } from "@/lib/theme";

// OP-03 Dashboard + OP-04 New Request (accept within 5 min)
export default function Dashboard() {
  const { t } = useApp();
  const [op, setOp] = useState<OperatorState>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [active, setActive] = useState<Request | null>(null);
  const [pay, setPay] = useState<PayoutItem[]>([]);

  const load = useCallback(async () => {
    const [o, f, a, p] = await Promise.all([api.operatorState(), api.pendingOffer(), api.activeOperatorRequest(), api.payouts()]);
    setOp(o); setOffer(f); setActive(a); setPay(p);
  }, []);

  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));
  useEffect(() => {
    const off = api.watchOffers(() => void load());
    const timer = setInterval(() => void load().catch(() => {}), 10000);
    return () => { off(); clearInterval(timer); };
  }, [load]);

  if (op && op.status !== "approved") {
    return (
      <Screen>
        <Card>
          <IconTile name="clock" tint={c.goldTint} color={c.goldText} />
          <T k="h2">{t("op.notApproved")}</T>
          <T color={c.text2}>{t("op.notApprovedBody")}</T>
        </Card>
      </Screen>
    );
  }

  const todayItems = pay.filter((p) => new Date(p.release_at).getTime() - 48 * 3600e3 > Date.now() - 86400e3);
  const hold = pay.filter((p) => p.status !== "paid").reduce((a, p) => a + p.amount_mnt, 0);

  return (
    <Screen>
      <Card style={{ flexDirection: "row", alignItems: "center", backgroundColor: op?.online ? c.greenTint : c.surface }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T k="h2" color={op?.online ? c.green : c.text}>{op?.online ? t("op.online") : t("op.offline")}</T>
          <T k="bodySm" color={c.text2}>{t("op.onlineHint")}</T>
        </View>
        <Switch
          accessibilityLabel={t("op.online")}
          value={!!op?.online}
          onValueChange={async (v) => { setOp((o) => (o ? { ...o, online: v } : o)); await api.setOnline(v); load(); }}
          trackColor={{ true: c.green, false: c.border }}
          thumbColor={c.surface}
        />
      </Card>

      {offer && <OfferCard offer={offer} onDone={load} />}

      {active && (
        <Card onPress={() => router.push(`/request/${active.id}`)} style={{ flexDirection: "row", alignItems: "center", borderColor: c.blue }}>
          <Feather name="message-circle" size={24} color={c.blue} />
          <View style={{ flex: 1 }}>
            <T style={{ fontWeight: "600" }}>{t("op.active")}</T>
            <T k="bodySm" color={c.text2}>{active.code} · {t(`home.${active.help_type}`)}</T>
          </View>
          <Feather name="chevron-right" size={20} color={c.text3} />
        </Card>
      )}

      <Card>
        <T k="label" color={c.text2}>{t("op.today")}</T>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1 }}>
            <T k="h1">{todayItems.length}</T>
            <T k="bodySm" color={c.text2}>{t("op.done")}</T>
          </View>
          <View style={{ flex: 1 }}>
            <T k="h1">{mnt(todayItems.reduce((a, p) => a + p.amount_mnt, 0))}</T>
            <T k="bodySm" color={c.text2}>{t("op.earned")}</T>
          </View>
        </View>
      </Card>
      <Card onPress={() => router.push("/(operator)/earnings")} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <T color={c.text2}>{t("op.nextPayout")}</T>
        <T k="title">{mnt(hold)}</T>
      </Card>
    </Screen>
  );
}

function OfferCard({ offer, onDone }: { offer: Offer; onDone: () => void }) {
  const { t } = useApp();
  const now = useNow();
  const left = Math.max(0, ACCEPT_MIN * 60 - Math.floor((now - new Date(offer.offered_at).getTime()) / 1000));
  const [busy, setBusy] = useState<"a" | "d" | null>(null);
  const r = offer.request;
  const respond = async (accept: boolean) => {
    setBusy(accept ? "a" : "d");
    try {
      await api.respondOffer(r.id, accept);
      if (accept) router.push(`/request/${r.id}`);
    } finally {
      setBusy(null);
      onDone();
    }
  };
  if (left === 0) return null;
  return (
    <Card style={{ borderColor: c.blue, borderWidth: 2 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Badge label={t("op.offer")} />
        <T k="bodySm" color={left < 60 ? c.redText : c.text2} style={{ fontWeight: "600", fontVariant: ["tabular-nums"] }}>
          {t("op.timeLeft", { m: Math.floor(left / 60), s: String(left % 60).padStart(2, "0") })}
        </T>
      </View>
      <T k="title">{t(`home.${r.help_type}`)}{r.district ? ` · ${r.district}` : ""}</T>
      <T color={c.text2}>{r.description}</T>
      <T k="bodySm" color={c.green} style={{ fontWeight: "600" }}>{t("op.youEarn", { amount: mnt(r.price_mnt * OPERATOR_SHARE) })}</T>
      <View style={{ flexDirection: "row", gap: s(2) }}>
        <Button kind="secondary" title={t("op.decline")} style={{ flex: 1 }} loading={busy === "d"} onPress={() => respond(false)} />
        <Button title={t("op.accept")} style={{ flex: 1 }} loading={busy === "a"} onPress={() => respond(true)} />
      </View>
    </Card>
  );
}
