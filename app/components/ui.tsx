import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text as RNText, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, useApp } from "@/lib/app";
import { c, r, s, shadow, type } from "@/lib/theme";

export type IconName = ComponentProps<typeof Feather>["name"];

type TextKind = keyof typeof type;
export function T({ k = "body", color = c.text, style, children, ...rest }: { k?: TextKind; color?: string; style?: StyleProp<TextStyle>; children: ReactNode; numberOfLines?: number }) {
  return <RNText style={[type[k], { color }, style]} {...rest}>{children}</RNText>;
}

export function Screen({ children, scroll = true, pad = true, footer }: { children: ReactNode; scroll?: boolean; pad?: boolean; footer?: ReactNode }) {
  const body = <View style={[{ gap: s(4) }, pad && { padding: s(4) }]}>{children}</View>;
  return (
    <SafeAreaView edges={["bottom"]} style={{ flex: 1, backgroundColor: c.page }}>
      {api.demo && <DemoBanner />}
      {scroll ? <ScrollView contentContainerStyle={{ paddingBottom: s(8) }} keyboardShouldPersistTaps="handled">{body}</ScrollView> : <View style={{ flex: 1 }}>{children}</View>}
      {footer && <View style={st.footer}>{footer}</View>}
    </SafeAreaView>
  );
}

function DemoBanner() {
  const { t } = useApp();
  return (
    <View style={{ backgroundColor: c.goldTint, paddingVertical: 6, paddingHorizontal: s(4) }}>
      <T k="bodySm" color={c.goldText}>{t("demo.banner")}</T>
    </View>
  );
}

type BtnKind = "primary" | "secondary" | "ghost" | "danger" | "green";
export function Button({ title, onPress, kind = "primary", icon, disabled, loading, style }: {
  title: string; onPress?: () => void; kind?: BtnKind; icon?: IconName; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const bg = { primary: c.blue, secondary: c.surface, ghost: "transparent", danger: c.redText, green: c.green }[kind];
  const fg = kind === "secondary" || kind === "ghost" ? c.navy : c.onColor;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        st.btn,
        { backgroundColor: off ? c.disabled : bg, borderColor: kind === "secondary" ? c.border : "transparent" },
        pressed && !off && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Feather name={icon} size={20} color={off ? c.text3 : fg} /> : null}
      <RNText style={[type.body, { fontWeight: "500", color: off ? c.text3 : fg, textAlign: "center", flexShrink: 1 }]}>{title}</RNText>
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const inner = [st.card, style];
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [inner, pressed && { opacity: 0.9 }]}>{children}</Pressable>
  ) : (
    <View style={inner}>{children}</View>
  );
}

export function IconTile({ name, tint = c.blueTint, color = c.blue, size = 48 }: { name: IconName; tint?: string; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: r.md, backgroundColor: tint, alignItems: "center", justifyContent: "center" }}>
      <Feather name={name} size={size / 2} color={color} />
    </View>
  );
}

export function Field({ label, hint, error, ...input }: TextInputProps & { label: string; hint?: string; error?: string }) {
  return (
    <View style={{ gap: s(2) }}>
      <T k="bodySm" style={{ fontWeight: "500" }}>{label}</T>
      <TextInput
        placeholderTextColor={c.text3}
        accessibilityLabel={label}
        {...input}
        style={[st.input, input.multiline && { minHeight: 120, textAlignVertical: "top", paddingTop: 12 }, error ? { borderColor: c.redText } : null, input.style]}
      />
      {error ? <T k="bodySm" color={c.redText}>{error}</T> : hint ? <T k="bodySm" color={c.text2}>{hint}</T> : null}
    </View>
  );
}

export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => onChange(!checked)} style={{ flexDirection: "row", gap: s(3), alignItems: "center", minHeight: 44 }}>
      <View style={[st.box, checked && { backgroundColor: c.blue, borderColor: c.blue }]}>
        {checked && <Feather name="check" size={16} color={c.onColor} />}
      </View>
      <T style={{ flex: 1 }}>{label}</T>
    </Pressable>
  );
}

export function Segmented<V extends string>({ value, options, onChange }: { value: V; options: { value: V; label: string }[]; onChange: (v: V) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: s(2) }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[st.seg, on && { borderColor: c.blue, borderWidth: 2, backgroundColor: c.blueTint }]}
          >
            <T k={o.label.length > 12 ? "bodySm" : "body"} style={{ fontWeight: on ? "600" : "500", textAlign: "center" }} color={on ? c.blue : c.text}>{o.label}</T>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ label, tone = "blue" }: { label: string; tone?: "blue" | "green" | "gold" | "red" | "neutral" }) {
  const map = {
    blue: [c.blueTint, c.blue], green: [c.greenTint, c.green], gold: [c.goldTint, c.goldText], red: [c.redTint, c.redText], neutral: [c.neutralTint, c.text2],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: bg, borderRadius: r.pill, paddingHorizontal: 10, height: 28, alignSelf: "flex-start" }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />
      <T k="bodySm" color={fg} style={{ fontWeight: "500" }}>{label}</T>
    </View>
  );
}

export function EmergencyStrip() {
  const { t } = useApp();
  return (
    <Pressable accessibilityRole="button" onPress={() => Linking.openURL("tel:112")} style={st.danger}>
      <Feather name="alert-triangle" size={20} color={c.redText} />
      <T k="bodySm" color={c.redText} style={{ flex: 1, fontWeight: "500" }}>{t("home.danger")}</T>
    </Pressable>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: s(3), borderBottomWidth: 1, borderColor: c.hairline, gap: s(4) }}>
      <T color={c.text2}>{label}</T>
      <T style={{ fontWeight: "500", flexShrink: 1, textAlign: "right" }}>{value}</T>
    </View>
  );
}

export function Center({ children }: { children: ReactNode }) {
  return <View style={{ alignItems: "center", gap: s(3), paddingVertical: s(6) }}>{children}</View>;
}

export const st = StyleSheet.create({
  btn: { minHeight: 48, borderRadius: r.sm, borderWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: s(2), paddingHorizontal: s(4) },
  card: { backgroundColor: c.surface, borderRadius: r.md, borderWidth: 1, borderColor: c.hairline, padding: s(4), gap: s(3), ...shadow },
  input: { minHeight: 48, borderWidth: 1, borderColor: c.border, borderRadius: r.sm, paddingHorizontal: s(4), backgroundColor: c.surface, fontSize: 16, color: c.text },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: c.border, alignItems: "center", justifyContent: "center", backgroundColor: c.surface },
  seg: { flex: 1, minHeight: 44, paddingHorizontal: 6, paddingVertical: 6, borderRadius: r.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  danger: { flexDirection: "row", alignItems: "center", gap: s(3), padding: s(3), paddingHorizontal: s(4), borderRadius: r.md, backgroundColor: c.redTint, minHeight: 48 },
  footer: { padding: s(4), gap: s(2), backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.hairline },
});
