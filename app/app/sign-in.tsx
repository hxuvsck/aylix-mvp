import { router } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Check, Field, Screen, Segmented, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { c, s } from "@/lib/theme";

// TR-02 Sign up / sign in (phone, +82 / +976)
export default function SignIn() {
  const { t } = useApp();
  const [cc, setCc] = useState<"+82" | "+976">("+82");
  const [num, setNum] = useState("");
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const digits = num.replace(/\D/g, "").replace(/^0/, "");
  const phone = `${cc}${digits}`;
  const valid = digits.length >= 7 && adult && terms;

  const send = async () => {
    setBusy(true); setErr("");
    try {
      await api.sendCode(phone);
      router.push({ pathname: "/verify", params: { phone } });
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={t("auth.send")} disabled={!valid} loading={busy} onPress={send} />}>
      <View style={{ gap: s(2) }}>
        <T k="h1">{t("auth.title")}</T>
        <T color={c.text2}>{t("auth.body")}</T>
      </View>
      <Segmented value={cc} onChange={setCc} options={[{ value: "+82", label: "🇰🇷 +82" }, { value: "+976", label: "🇲🇳 +976" }]} />
      <Field label={t("auth.phone")} value={num} onChangeText={setNum} keyboardType="phone-pad" autoComplete="tel" placeholder={cc === "+82" ? "10 1234 5678" : "9911 2233"} error={err} />
      <View>
        <Check checked={adult} onChange={setAdult} label={t("auth.adult")} />
        <Check checked={terms} onChange={setTerms} label={t("auth.terms")} />
      </View>
    </Screen>
  );
}
