import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Modal, View } from "react-native";
import { EmergencyNumbers } from "@/components/SafetyScreen";
import { Button, Field, Screen, Segmented, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { looksLikeEmergency } from "@/lib/rules";
import type { HelpType } from "@/lib/types";
import { c, r, s } from "@/lib/theme";

// TR-06 Describe + language + district · TR-06b Emergency redirect sheet
export default function NewRequest() {
  const { t, lang } = useApp();
  const params = useLocalSearchParams<{ type?: HelpType }>();
  const [helpType, setHelpType] = useState<HelpType>(params.type ?? "local");
  const [desc, setDesc] = useState("");
  const [language, setLanguage] = useState<"mn" | "ko" | "en">(lang);
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sheet, setSheet] = useState(false);
  const [overrode, setOverrode] = useState(false);

  const create = async () => {
    if (!overrode && looksLikeEmergency(desc)) { setSheet(true); return; }
    setBusy(true); setErr("");
    try {
      const req = await api.createRequest({ help_type: helpType, description: desc.trim(), language, city: "Seoul", district: district.trim() || null });
      router.replace(`/request/${req.id}`);
    } catch {
      setErr(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen footer={<Button title={t("new.next")} disabled={desc.trim().length < 10} loading={busy} onPress={create} />}>
      <Segmented<HelpType>
        value={helpType}
        onChange={setHelpType}
        options={(["navigation", "translation", "local"] as HelpType[]).map((h) => ({ value: h, label: t(`home.${h}`) }))}
      />
      <Field
        label={t("new.desc")}
        value={desc}
        onChangeText={(v) => { setDesc(v); setOverrode(false); }}
        multiline
        maxLength={2000}
        hint={t("new.descHint")}
        error={err}
      />
      <View style={{ gap: s(2) }}>
        <T k="bodySm" style={{ fontWeight: "500" }}>{t("new.lang")}</T>
        <Segmented value={language} onChange={setLanguage} options={[{ value: "mn", label: "Монгол" }, { value: "ko", label: "한국어" }, { value: "en", label: "English" }]} />
      </View>
      <Field label={t("new.district")} value={district} onChangeText={setDistrict} hint={t("new.districtHint")} placeholder="Hongdae, Mapo-gu" />

      <Modal visible={sheet} transparent animationType="slide" onRequestClose={() => setSheet(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(23,23,23,0.4)" }}>
          <View style={{ backgroundColor: c.page, borderTopLeftRadius: r.lg, borderTopRightRadius: r.lg, padding: s(4), gap: s(4), paddingBottom: s(8) }}>
            <T k="h2" color={c.redText}>{t("emerg.title")}</T>
            <T color={c.text2}>{t("emerg.body")}</T>
            <EmergencyNumbers />
            <Button kind="ghost" title={t("emerg.notEmergency")} onPress={() => { setOverrode(true); setSheet(false); }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
