import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Field, Screen, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { c, s } from "@/lib/theme";

// TR-03 Verify 6-digit code
export default function Verify() {
  const { t, lang, refreshMe } = useApp();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const verify = async () => {
    setBusy(true); setErr("");
    try {
      await api.verifyCode(phone, code, lang);
      await refreshMe();
      router.replace("/");
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={t("auth.verify")} disabled={code.length !== 6} loading={busy} onPress={verify} />}>
      <View style={{ gap: s(2) }}>
        <T k="h1">{t("auth.verifyTitle")}</T>
        <T color={c.text2}>{t("auth.verifyBody", { phone })}</T>
      </View>
      <Field
        label={t("auth.code")}
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        style={{ fontSize: 24, letterSpacing: 8, textAlign: "center" }}
        error={err}
        hint={api.demo ? t("auth.demoHint") : undefined}
      />
      <Button kind="ghost" title={t("auth.resend")} onPress={() => api.sendCode(phone)} />
    </Screen>
  );
}
