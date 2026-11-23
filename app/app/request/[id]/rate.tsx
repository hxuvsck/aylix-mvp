import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Center, Field, Screen, T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import { c, r, s } from "@/lib/theme";

const TAGS = ["fast", "area", "clear", "kind"] as const;

// TR-13 Rate operator
export default function Rate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useApp();
  const [name, setName] = useState("");
  const [stars, setStars] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => { api.partnerName(id).then(setName).catch(() => {}); }, [id]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.rate(id, stars, tags, review.trim());
      setDone(true);
      setTimeout(() => router.dismissTo("/"), 900);
    } finally {
      setBusy(false);
    }
  };

  if (done) return <Screen><Center><Feather name="heart" size={48} color={c.green} /><T k="h1">{t("rate.thanks")}</T></Center></Screen>;

  return (
    <Screen footer={<Button title={t("rate.submit")} disabled={!stars} loading={busy} onPress={submit} />}>
      <T k="h1" style={{ textAlign: "center" }}>{t("rate.title", { name: name || "…" })}</T>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: s(2) }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} accessibilityRole="button" accessibilityLabel={`${n}`} onPress={() => setStars(n)} style={{ padding: 4 }}>
            <Feather name="star" size={40} color={n <= stars ? c.gold : c.border} />
          </Pressable>
        ))}
      </View>
      <T k="bodySm" style={{ fontWeight: "500" }}>{t("rate.tags")}</T>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: s(2) }}>
        {TAGS.map((tag) => {
          const on = tags.includes(tag);
          return (
            <Pressable
              key={tag}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => setTags((p) => (on ? p.filter((x) => x !== tag) : [...p, tag]))}
              style={{ height: 40, paddingHorizontal: s(4), borderRadius: r.pill, borderWidth: 1, justifyContent: "center", borderColor: on ? c.blue : c.border, backgroundColor: on ? c.blueTint : c.surface }}
            >
              <T k="bodySm" color={on ? c.blue : c.text} style={{ fontWeight: "500" }}>{t(`rate.tag.${tag}`)}</T>
            </Pressable>
          );
        })}
      </View>
      <Field label={t("rate.review")} value={review} onChangeText={setReview} multiline maxLength={1000} hint={t("rate.public")} />
    </Screen>
  );
}
