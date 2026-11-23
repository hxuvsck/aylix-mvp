import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Platform, View } from "react-native";
import Chat from "@/components/Chat";
import { Badge, Button, Card, Center, Field, IconTile, Row, Screen, Segmented, T } from "@/components/ui";
import { useNow, useRequest } from "@/hooks/useRequest";
import { api, useApp } from "@/lib/app";
import { mnt, SEARCH_MIN } from "@/lib/rules";
import { tone } from "@/lib/status";
import type { Request } from "@/lib/types";
import { c, s } from "@/lib/theme";

// One route per Request; what it shows follows the Request's status.
export default function RequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { me, t } = useApp();
  const { req, messages, partner, reload } = useRequest(id);

  if (!req || !me) return <Center><ActivityIndicator color={c.blue} /></Center>;
  const isOperator = req.operator_id === me.id;
  const title = <Stack.Screen options={{ title: req.code }} />;

  if (req.status === "awaiting_payment" && !isOperator) return <>{title}<Pay req={req} /></>;
  if (req.status === "searching") return <>{title}<Finding req={req} /></>;
  if (req.status === "refunded") return <>{title}<Refunded req={req} /></>;
  if (req.status === "matched") {
    return (
      <>
        <Stack.Screen options={{ title: t("chat.with", { name: partner || "…" }) }} />
        <Chat
          requestId={req.id}
          messages={messages}
          meId={me.id}
          open
          onSent={reload}
          header={isOperator ? <OperatorBar req={req} /> : <TravelerBar req={req} reload={reload} />}
        />
      </>
    );
  }
  return <>{title}<Receipt req={req} partner={partner} isOperator={isOperator} /></>;
}

// TR-07 Review & pay
function Pay({ req }: { req: Request }) {
  const { t } = useApp();
  const [method, setMethod] = useState<"qpay" | "card">("qpay");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.submitPayment(req.id, "qpay", ref.trim());
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <Center>
          <ActivityIndicator color={c.blue} size="large" />
          <T k="h2">{t("find.payment")}</T>
          <T color={c.text2} style={{ textAlign: "center" }}>{t("find.paymentBody")}</T>
        </Center>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title={t("pay.submit")} disabled={method !== "qpay" || ref.trim().length < 2} loading={busy} onPress={submit} />}>
      <Card>
        <T k="label" color={c.text2}>{t(`home.${req.help_type}`)}</T>
        <T numberOfLines={3}>{req.description}</T>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderTopWidth: 1, borderColor: c.hairline, paddingTop: s(3) }}>
          <T k="title">{t("pay.total")}</T>
          <T k="h1">{mnt(req.price_mnt)}</T>
        </View>
        <T k="bodySm" color={c.text2}>{t("pay.includes")}</T>
      </Card>
      <View style={{ gap: s(2) }}>
        <T k="bodySm" style={{ fontWeight: "500" }}>{t("pay.method")}</T>
        <Segmented value={method} onChange={setMethod} options={[{ value: "qpay", label: t("pay.qpay") }, { value: "card", label: `${t("pay.card")}` }]} />
      </View>
      {method === "card" ? (
        <Card><Badge label={t("pay.soon")} tone="neutral" /></Card>
      ) : (
        <Card>
          <T>{t("pay.instructions", { amount: mnt(req.price_mnt), code: req.code })}</T>
          <T k="bodySm" color={c.text2}>{t("pay.account")}</T>
          <Field label={t("pay.ref")} value={ref} onChangeText={setRef} />
          <T k="bodySm" color={c.text2}>{t("pay.wait")}</T>
        </Card>
      )}
    </Screen>
  );
}

// TR-08 Finding your operator (also TR-09b rematch in progress)
function Finding({ req }: { req: Request }) {
  const { t } = useApp();
  const now = useNow();
  const since = req.searching_since ? new Date(req.searching_since).getTime() : now;
  const left = Math.max(0, SEARCH_MIN * 60 - Math.floor((now - since) / 1000));
  return (
    <Screen>
      <Center>
        <ActivityIndicator color={c.blue} size="large" />
        <T k="h1" style={{ textAlign: "center" }}>{t("find.title")}</T>
        <T color={c.text2} style={{ textAlign: "center" }}>{t("find.body")}</T>
        <T k="display" color={c.navy} style={{ fontVariant: ["tabular-nums"] }}>
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </T>
      </Center>
      <Card style={{ backgroundColor: c.greenTint, borderColor: "transparent" }}>
        <T k="bodySm" color={c.green}>{t("find.refundNote")}</T>
      </Card>
    </Screen>
  );
}

// TR-08b Auto-refunded
function Refunded({ req }: { req: Request }) {
  const { t } = useApp();
  return (
    <Screen footer={<Button title={t("refunded.again")} onPress={() => router.replace("/request/new")} />}>
      <Center>
        <IconTile name="rotate-ccw" tint={c.greenTint} color={c.green} size={64} />
        <T k="h1">{t("refunded.title")}</T>
        <T color={c.text2} style={{ textAlign: "center" }}>{t("refunded.body", { reason: req.decision_note ?? "", amount: mnt(req.price_mnt) })}</T>
      </Center>
    </Screen>
  );
}

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm(message)) onYes();
    return;
  }
  Alert.alert("", message, [{ text: "Cancel", style: "cancel" }, { text: "OK", onPress: onYes }]);
}

function TravelerBar({ req, reload }: { req: Request; reload: () => void }) {
  const { t } = useApp();
  return (
    <View style={{ flexDirection: "row", gap: s(2), padding: s(3), backgroundColor: c.surface, borderBottomWidth: 1, borderColor: c.hairline }}>
      <Button
        kind="secondary"
        icon="refresh-cw"
        title={req.rematch_used ? t("chat.rematchUsed") : t("chat.rematch")}
        disabled={req.rematch_used}
        style={{ flex: 1, height: 44 }}
        onPress={() => confirm(t("chat.rematchConfirm"), async () => { await api.rematch(req.id); reload(); })}
      />
      <Button kind="green" icon="check" title={t("chat.done")} style={{ flex: 1, height: 44 }} onPress={() => router.push(`/request/${req.id}/close`)} />
    </View>
  );
}

function OperatorBar({ req }: { req: Request }) {
  const { t } = useApp();
  return (
    <View style={{ padding: s(3), gap: 2, backgroundColor: c.blueTint }}>
      <T k="bodySm" style={{ fontWeight: "600" }}>{req.code} · {t(`home.${req.help_type}`)}{req.district ? ` · ${req.district}` : ""}</T>
      <T k="bodySm" color={c.text2}>{t("op.youEarn", { amount: mnt(req.price_mnt * 0.8) })}</T>
    </View>
  );
}

// TR-12 Session receipt
function Receipt({ req, partner, isOperator }: { req: Request; partner: string; isOperator: boolean }) {
  const { t } = useApp();
  const refund = req.refund_pct != null ? (req.price_mnt * req.refund_pct) / 100 : 0;
  return (
    <Screen
      footer={
        <>
          {!isOperator && (req.status === "closed_solved" || req.status === "under_review") && (
            <Button icon="star" title={t("receipt.rate")} onPress={() => router.push(`/request/${req.id}/rate`)} />
          )}
          <Button kind="secondary" title={t("receipt.home")} onPress={() => router.replace("/")} />
        </>
      }
    >
      <Center>
        <IconTile name={req.status === "closed_solved" ? "check-circle" : "file-text"} tint={c.greenTint} color={c.green} size={64} />
        <T k="h1">{t("receipt.title")}</T>
        <Badge label={t(`status.${req.status}`)} tone={tone(req.status)} />
      </Center>
      <Card>
        <Row label={t("receipt.code")} value={req.code} />
        <Row label={t("receipt.type")} value={t(`home.${req.help_type}`)} />
        {!isOperator && <Row label={t("receipt.operator")} value={partner || "—"} />}
        <Row label={t("receipt.paid")} value={mnt(req.price_mnt)} />
        {refund > 0 && <Row label={t("receipt.refund")} value={`− ${mnt(refund)} (${req.refund_pct}%)`} />}
      </Card>
      {!isOperator && <T k="bodySm" color={c.text2}>{t("receipt.review")}</T>}
    </Screen>
  );
}
