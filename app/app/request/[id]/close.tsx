import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Field, IconTile, Screen, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { c, s } from "@/lib/theme";

// TR-11 Solved or not solved
export default function Close() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const [choice, setChoice] = useState<"solved" | "not_solved" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!choice) return;
    setBusy(true);
    try {
      await api.close(id, choice, reason.trim() || undefined);
      router.dismissTo(`/request/${id}`);
    } finally {
      setBusy(false);
    }
  };

  const Option = ({ v, icon, tint, color }: { v: "solved" | "not_solved"; icon: "thumbs-up" | "thumbs-down"; tint: string; color: string }) => (
    <Card onPress={() => setChoice(v)} style={[{ flex: 1, alignItems: "center", paddingVertical: s(6) }, choice === v && { borderColor: color, borderWidth: 2 }]}>
      <IconTile name={icon} tint={tint} color={color} size={56} />
      <T k="title">{t(v === "solved" ? "close.solved" : "close.notSolved")}</T>
    </Card>
  );

  return (
    <Screen footer={<Button title={t("close.submit")} disabled={!choice || (choice === "not_solved" && reason.trim().length < 5)} loading={busy} onPress={submit} />}>
      <View style={{ flexDirection: "row", gap: s(3) }}>
        <Option v="solved" icon="thumbs-up" tint={c.greenTint} color={c.green} />
        <Option v="not_solved" icon="thumbs-down" tint={c.redTint} color={c.redText} />
      </View>
      {choice === "not_solved" && (
        <Field label={t("close.reason")} value={reason} onChangeText={setReason} multiline hint={t("close.reasonHint")} />
      )}
    </Screen>
  );
}
