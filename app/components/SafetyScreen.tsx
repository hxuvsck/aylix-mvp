import { Feather } from "@expo/vector-icons";
import { Linking, View } from "react-native";
import { Button, Card, IconTile, Screen, T } from "@/components/ui";
import { useApp } from "@/lib/app";
import { EMERGENCY_NUMBERS } from "@/lib/rules";
import { c, s } from "@/lib/theme";

// SH-01 Safety Center
export default function SafetyScreen() {
  const { t } = useApp();
  return (
    <Screen>
      <EmergencyNumbers />
      <Card>
        <T k="title">{t("safety.rules")}</T>
        {(["r1", "r2", "r3", "r4", "r5"] as const).map((k) => (
          <View key={k} style={{ flexDirection: "row", gap: s(3), alignItems: "flex-start" }}>
            <Feather name="check-circle" size={20} color={c.green} style={{ marginTop: 2 }} />
            <T style={{ flex: 1 }}>{t(`safety.${k}`)}</T>
          </View>
        ))}
      </Card>
      <Button kind="secondary" icon="flag" title={t("safety.report")} onPress={() => Linking.openURL("mailto:hello@aylix.io?subject=Safety%20report")} />
    </Screen>
  );
}

export function EmergencyNumbers() {
  const { t } = useApp();
  const label = { police: t("emerg.police"), ambulance: t("emerg.ambulance"), travel: t("emerg.travel") };
  return (
    <View style={{ gap: s(2) }}>
      {EMERGENCY_NUMBERS.map((e) => (
        <Card key={e.n} onPress={() => Linking.openURL(`tel:${e.n}`)} style={{ flexDirection: "row", alignItems: "center" }}>
          <IconTile name="phone" tint={e.n === "1330" ? c.blueTint : c.redTint} color={e.n === "1330" ? c.blue : c.redText} />
          <View style={{ flex: 1 }}>
            <T k="h2">{e.n}</T>
            <T k="bodySm" color={c.text2}>{label[e.k]}</T>
          </View>
          <T color={c.blue} style={{ fontWeight: "600" }}>{t("safety.call")}</T>
        </Card>
      ))}
    </View>
  );
}
