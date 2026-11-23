import { router } from "expo-router";
import { Image } from "expo-image";
import { Linking, View } from "react-native";
import { Button, Screen, Segmented, T } from "@/components/ui";
import { useApp } from "@/lib/app";
import { langNames, type Lang } from "@/lib/strings";
import { c, s } from "@/lib/theme";

// TR-01 Welcome + language
export default function Welcome() {
  const { t, lang, setLang } = useApp();
  return (
    <Screen
      footer={
        <>
          <Button title={t("welcome.start")} onPress={() => router.push("/sign-in")} />
          <Button kind="secondary" title={t("welcome.haveAccount")} onPress={() => router.push("/sign-in")} />
          <Button kind="ghost" title={t("welcome.operator")} onPress={() => Linking.openURL("https://aylix.io/operators/apply")} />
        </>
      }
    >
      <View style={{ paddingTop: s(16), gap: s(6) }}>
        <View style={{ alignItems: "center", gap: s(4) }}>
          <Image source={require("@/assets/images/logo.svg")} style={{ width: 72, height: 72 }} accessibilityLabel="Aylix" />
          <T k="display" color={c.navy} style={{ letterSpacing: 2 }}>AYLIX</T>
          <T k="body" color={c.text2} style={{ textAlign: "center", maxWidth: 300 }}>{t("welcome.tagline")}</T>
        </View>
        <View style={{ gap: s(2), marginTop: s(8) }}>
          <T k="bodySm" style={{ fontWeight: "500" }}>{t("welcome.lang")}</T>
          <Segmented<Lang> value={lang} onChange={setLang} options={(["en", "mn", "ko"] as Lang[]).map((l) => ({ value: l, label: langNames[l] }))} />
        </View>
      </View>
    </Screen>
  );
}
