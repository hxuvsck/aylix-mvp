import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { T } from "@/components/ui";
import { api, useApp } from "@/lib/app";
import type { Message } from "@/lib/types";
import { c, r, s } from "@/lib/theme";

// TR-10 / OP-05 Chat — the same screen for traveler and operator
export default function Chat({ requestId, messages, meId, open, header, onSent }: {
  requestId: string; messages: Message[]; meId: string; open: boolean; header?: React.ReactNode; onSent: () => void;
}) {
  const { t } = useApp();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroll = useRef<ScrollView>(null);

  useEffect(() => { setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50); }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await api.sendMessage(requestId, body);
      setText("");
      onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      {header}
      <ScrollView ref={scroll} contentContainerStyle={{ padding: s(4), gap: s(2) }}>
        <T k="bodySm" color={c.text3} style={{ textAlign: "center", marginBottom: s(2) }}>{t("chat.voice")} {t("chat.location")}</T>
        {messages.map((m) => {
          if (!m.sender_id) {
            return (
              <View key={m.id} style={{ alignSelf: "center", backgroundColor: c.neutralTint, borderRadius: r.pill, paddingHorizontal: s(3), paddingVertical: 4, maxWidth: "90%" }}>
                <T k="bodySm" color={c.text2} style={{ textAlign: "center" }}>{m.body}</T>
              </View>
            );
          }
          const mine = m.sender_id === meId;
          return (
            <View
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "82%", paddingHorizontal: s(4), paddingVertical: s(3),
                borderRadius: r.lg, backgroundColor: mine ? c.blue : c.surface, borderWidth: mine ? 0 : 1, borderColor: c.hairline,
                borderBottomRightRadius: mine ? 4 : r.lg, borderBottomLeftRadius: mine ? r.lg : 4,
              }}
            >
              <T color={mine ? c.onColor : c.text}>{m.body}</T>
              <T k="bodySm" color={mine ? "rgba(255,255,255,0.75)" : c.text3} style={{ fontSize: 11, alignSelf: "flex-end" }}>
                {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </T>
            </View>
          );
        })}
      </ScrollView>
      <SafeAreaView edges={["bottom"]} style={{ backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.hairline }}>
        {open ? (
          <View style={{ flexDirection: "row", alignItems: "flex-end", gap: s(2), padding: s(3) }}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t("chat.placeholder")}
              placeholderTextColor={c.text3}
              multiline
              accessibilityLabel={t("chat.placeholder")}
              onSubmitEditing={send}
              style={{ flex: 1, minHeight: 44, maxHeight: 120, borderWidth: 1, borderColor: c.border, borderRadius: 22, paddingHorizontal: s(4), paddingTop: 11, fontSize: 16, color: c.text, backgroundColor: c.surface }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("chat.send")}
              onPress={send}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: text.trim() ? c.blue : c.disabled, alignItems: "center", justifyContent: "center" }}
            >
              <Feather name="send" size={20} color={text.trim() ? c.onColor : c.text3} />
            </Pressable>
          </View>
        ) : (
          <T k="bodySm" color={c.text2} style={{ textAlign: "center", padding: s(4) }}>{t("chat.readonly")}</T>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
