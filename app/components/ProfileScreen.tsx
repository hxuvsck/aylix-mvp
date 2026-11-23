import { router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { Button, Card, Field, Row, Screen, Segmented, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { langNames, type Lang } from "@/lib/strings";
import type { Role } from "@/lib/types";
import { s } from "@/lib/theme";

// SH-02 Profile + settings
export default function ProfileScreen() {
  const { t, me, lang, setLang, refreshMe } = useApp();
  const [name, setName] = useState(me?.full_name ?? "");
  useEffect(() => setName(me?.full_name ?? ""), [me?.full_name]);

  const changeLang = (l: Lang) => {
    setLang(l);
    api.updateProfile({ ui_lang: l }).catch(() => {});
  };

  return (
    <Screen>
      <Card>
        <Field label={t("profile.name")} value={name} onChangeText={setName} autoComplete="name" />
        <Button kind="secondary" title={t("profile.save")} onPress={async () => { await api.updateProfile({ full_name: name }); refreshMe(); }} />
        <Row label={t("profile.phone")} value={me?.phone ?? "—"} />
      </Card>
      <View style={{ gap: s(2) }}>
        <T k="bodySm" style={{ fontWeight: "500" }}>{t("profile.lang")}</T>
        <Segmented<Lang> value={lang} onChange={changeLang} options={(["en", "mn", "ko"] as Lang[]).map((l) => ({ value: l, label: langNames[l] }))} />
      </View>
      {api.demo && api.demoSetRole && (
        <View style={{ gap: s(2) }}>
          <T k="bodySm" style={{ fontWeight: "500" }}>{t("profile.demoRole")}</T>
          <Segmented<Role>
            value={me?.role ?? "traveler"}
            onChange={async (r) => { api.demoSetRole!(r); await refreshMe(); router.replace("/"); }}
            options={[{ value: "traveler", label: "Traveler" }, { value: "operator", label: "Operator" }, { value: "admin", label: "Admin" }]}
          />
        </View>
      )}
      <Button kind="ghost" icon="log-out" title={t("profile.signOut")} onPress={async () => { await api.signOut(); await refreshMe(); router.replace("/welcome"); }} />
    </Screen>
  );
}
