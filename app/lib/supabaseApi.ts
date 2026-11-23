import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import type { Api, Application, Message, PayoutItem, Request } from "./types";

export function makeSupabaseApi(url: string, key: string): Api {
  const sb = createClient(url, key, {
    auth: {
      storage: Platform.OS === "web" ? undefined : AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });

  const uid = async () => (await sb.auth.getSession()).data.session?.user.id ?? null;
  // Throws on error; a missing row is an error too, so callers get a value or an exception.
  const ok = <T,>(r: { data: T | null; error: unknown }): T => {
    if (r.error) throw r.error;
    return r.data as T;
  };

  const api: Api = {
    demo: false,

    async me() {
      const id = await uid();
      if (!id) return null;
      return ok(await sb.from("profiles").select("id, role, phone, full_name, ui_lang").eq("id", id).single());
    },
    onAuth(cb) {
      const { data } = sb.auth.onAuthStateChange(() => cb());
      return () => data.subscription.unsubscribe();
    },
    async sendCode(phone) {
      ok(await sb.auth.signInWithOtp({ phone }));
    },
    async verifyCode(phone, token, lang) {
      ok(await sb.auth.verifyOtp({ phone, token, type: "sms" }));
      const id = await uid();
      if (id) await sb.from("profiles").update({ ui_lang: lang, accepted_terms_at: new Date().toISOString() }).eq("id", id);
    },
    async signOut() {
      await sb.auth.signOut();
    },
    async updateProfile(p) {
      const id = await uid();
      ok(await sb.from("profiles").update(p).eq("id", id!));
    },

    async createRequest(r) {
      return ok(await sb.rpc("create_request", {
        p_help_type: r.help_type, p_description: r.description, p_language: r.language, p_city: r.city, p_district: r.district,
      })) as Request;
    },
    async submitPayment(id, provider, ref) {
      ok(await sb.rpc("submit_payment", { rid: id, p_provider: provider, p_ref: ref }));
    },
    async getRequest(id) {
      return ok<Request>(await sb.from("requests").select("*").eq("id", id).single());
    },
    async myRequests() {
      const id = await uid();
      return ok<Request[]>(await sb.from("requests").select("*").eq("traveler_id", id!).order("created_at", { ascending: false }));
    },
    async messages(id) {
      return ok<Message[]>(await sb.from("messages").select("*").eq("request_id", id).order("id"));
    },
    watchRequest(id, cb) {
      const ch = sb
        .channel(`req-${id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "requests", filter: `id=eq.${id}` }, cb)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${id}` }, cb)
        .subscribe();
      return () => void sb.removeChannel(ch);
    },
    async sendMessage(id, body) {
      ok(await sb.from("messages").insert({ request_id: id, sender_id: await uid(), body }));
    },
    async rematch(id) {
      ok(await sb.rpc("request_rematch", { rid: id }));
    },
    async close(id, outcome, reason) {
      ok(await sb.rpc("close_request", { rid: id, p_outcome: outcome, p_reason: reason ?? null }));
    },
    async rate(id, stars, tags, review) {
      ok(await sb.rpc("rate_request", { rid: id, p_stars: stars, p_tags: tags, p_review: review || null }));
    },
    async partnerName(id) {
      const req = await api.getRequest(id);
      const me = await uid();
      const other = me === req.traveler_id ? req.operator_id : req.traveler_id;
      if (!other) return "";
      const { data } = await sb.from("profiles").select("full_name").eq("id", other).maybeSingle();
      return (data?.full_name ?? "").split(" ")[0] || "Operator";
    },

    async operatorState() {
      const id = await uid();
      const { data } = await sb.from("operators").select("status, online, languages").eq("id", id!).maybeSingle();
      return data ?? null;
    },
    async setOnline(on) {
      ok(await sb.rpc("set_online", { p_online: on }));
    },
    async pendingOffer() {
      const id = await uid();
      const { data } = await sb
        .from("request_offers")
        .select("request_id, offered_at, request:requests(*)")
        .eq("operator_id", id!)
        .eq("result", "pending")
        .order("offered_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as never) ?? null;
    },
    watchOffers(cb) {
      let ch: ReturnType<typeof sb.channel> | null = null;
      uid().then((id) => {
        ch = sb
          .channel(`offers-${id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "request_offers", filter: `operator_id=eq.${id}` }, cb)
          .subscribe();
      });
      return () => void (ch && sb.removeChannel(ch));
    },
    async respondOffer(id, accept) {
      ok(await sb.rpc("respond_offer", { rid: id, p_accept: accept }));
    },
    async activeOperatorRequest() {
      const id = await uid();
      const { data } = await sb.from("requests").select("*").eq("operator_id", id!).eq("status", "matched").maybeSingle();
      return data ?? null;
    },
    async payouts() {
      return ok<PayoutItem[]>(await sb.from("payout_items").select("request_id, amount_mnt, release_at, status").order("release_at", { ascending: false }));
    },

    async adminRequests(status) {
      return ok<Request[]>(await sb.from("requests").select("*").in("status", status).order("created_at", { ascending: false }).limit(100));
    },
    async adminConfirmPayment(id) {
      ok(await sb.rpc("admin_confirm_payment", { rid: id }));
    },
    async adminDecide(id, pct, note) {
      ok(await sb.rpc("admin_decide", { rid: id, p_refund_pct: pct, p_note: note }));
    },
    async adminApplications() {
      return ok<Application[]>(await sb.from("operator_applications").select("id, created_at, full_name, contact, city, area, review_status").order("created_at", { ascending: false }).limit(100));
    },
  };
  return api;
}
