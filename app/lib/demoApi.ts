// In-memory stand-in for Supabase so the whole flow can be clicked through before the backend exists.
// Operators "answer" on timers. Nothing is saved.
import type { Api, Me, Message, Offer, PayoutItem, Request, Role } from "./types";
import { OPERATOR_SHARE, PRICE_MNT } from "./rules";

const ME = "demo-me";
const OPS = [{ id: "op-bat", name: "Bat" }, { id: "op-saraa", name: "Saraa" }];
const TRAVELER = { id: "tr-anu", name: "Anu" };

const replies = [
  "Got it. Can you send me a photo of what you see, or tell me the exit number?",
  "OK. Walk to exit 3 and turn left — the ticket machine is next to the convenience store.",
  "On the machine, press the 한국어/English button at the top right, then “Card balance”.",
  "Did that work? If not, tell me what the screen says.",
];

export function makeDemoApi(): Api {
  let me: Me | null = null;
  let role: Role = "traveler";
  const requests = new Map<string, Request>();
  const msgs = new Map<string, Message[]>();
  const names = new Map<string, string>();
  const listeners = new Set<() => void>();
  const authListeners = new Set<() => void>();
  let online = false;
  let offer: Offer | null = null;
  let msgId = 1;
  const payouts: PayoutItem[] = [
    { request_id: "AX-7Q2K1D", amount_mnt: 20000, release_at: new Date(Date.now() - 86400e3).toISOString(), status: "paid" },
    { request_id: "AX-3M9T0B", amount_mnt: 20000, release_at: new Date(Date.now() + 30 * 3600e3).toISOString(), status: "on_hold" },
  ];

  const emit = () => listeners.forEach((l) => l());
  const later = (ms: number, fn: () => void) => setTimeout(() => { fn(); emit(); }, ms);
  const code = () => "AX-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const push = (rid: string, sender: string | null, body: string) => {
    const list = msgs.get(rid) ?? [];
    list.push({ id: msgId++, request_id: rid, sender_id: sender, body, created_at: new Date().toISOString() });
    msgs.set(rid, list);
  };
  const patch = (id: string, p: Partial<Request>) => requests.set(id, { ...requests.get(id)!, ...p });
  const match = (id: string, op: { id: string; name: string }) => {
    names.set(op.id, op.name);
    patch(id, { status: "matched", operator_id: op.id, matched_at: new Date().toISOString() });
    push(id, null, "An operator joined the chat.");
    later(1200, () => push(id, op.id, `Hi, I'm ${op.name}. I've read your Request — let's sort it out.`));
  };

  const api: Api = {
    demo: true,
    async me() { return me ? { ...me, role } : null; },
    onAuth(cb) { authListeners.add(cb); return () => authListeners.delete(cb); },
    async sendCode() {},
    async verifyCode(phone, _code, lang) {
      me = { id: ME, role, phone, full_name: null, ui_lang: lang };
      authListeners.forEach((l) => l());
    },
    async signOut() { me = null; authListeners.forEach((l) => l()); },
    async updateProfile(p) { if (me) me = { ...me, ...p }; },
    demoSetRole(r) { role = r; authListeners.forEach((l) => l()); },

    async createRequest(n) {
      const r: Request = {
        id: Math.random().toString(36).slice(2), code: code(), created_at: new Date().toISOString(), traveler_id: ME, operator_id: null,
        status: "awaiting_payment", ...n, price_mnt: PRICE_MNT, searching_since: null, matched_at: null, closed_at: null,
        rematch_used: false, refund_pct: null, decision_note: null,
      };
      requests.set(r.id, r);
      return r;
    },
    async submitPayment(id) {
      later(1500, () => {
        patch(id, { status: "searching", searching_since: new Date().toISOString() });
        push(id, null, "Payment confirmed. Finding your operator…");
      });
      setTimeout(() => { if (requests.get(id)?.status === "searching") { match(id, OPS[0]); emit(); } }, 5000);
    },
    async getRequest(id) {
      const r = requests.get(id);
      if (!r) throw new Error("not found");
      return r;
    },
    async myRequests() { return [...requests.values()].filter((r) => r.traveler_id === ME).reverse(); },
    async messages(id) { return [...(msgs.get(id) ?? [])]; },
    watchRequest(_id, cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async sendMessage(id, body) {
      const r = requests.get(id)!;
      const mine = role === "operator" ? r.operator_id! : ME;
      push(id, mine, body);
      emit();
      const other = role === "operator" ? r.traveler_id : r.operator_id;
      const n = (msgs.get(id) ?? []).filter((m) => m.sender_id === other).length;
      if (other && n <= replies.length) {
        later(1800, () => push(id, other, role === "operator" ? "Thank you! Trying that now." : replies[Math.min(n - 1, replies.length - 1)]));
      }
    },
    async rematch(id) {
      const r = requests.get(id)!;
      if (r.rematch_used) {
        patch(id, { status: "refunded", refund_pct: 100, decision_note: "Rematch already used — full refund." });
        emit();
        return;
      }
      patch(id, { status: "searching", operator_id: null, rematch_used: true, searching_since: new Date().toISOString() });
      push(id, null, "Rematch requested. Finding a new operator — they will see this chat.");
      emit();
      setTimeout(() => { match(id, OPS[1]); emit(); }, 3500);
    },
    async close(id, outcome, reason) {
      patch(id, outcome === "solved"
        ? { status: "closed_solved", closed_at: new Date().toISOString() }
        : { status: "under_review", closed_at: new Date().toISOString(), not_solved_reason: reason ?? null });
      push(id, null, outcome === "solved" ? "Closed as solved." : "Marked not solved. An Aylix reviewer will decide within 3 business days.");
      emit();
    },
    async rate() {},
    async partnerName(id) {
      const r = requests.get(id)!;
      return role === "operator" ? TRAVELER.name : names.get(r.operator_id ?? "") ?? "";
    },

    async operatorState() { return { status: "approved", online, languages: ["mn", "ko"] }; },
    async setOnline(on) {
      online = on;
      if (on && !offer) {
        setTimeout(() => {
          if (!online) return;
          const r: Request = {
            id: Math.random().toString(36).slice(2), code: code(), created_at: new Date().toISOString(), traveler_id: TRAVELER.id,
            operator_id: null, status: "searching", help_type: "local",
            description: "My T-money card says the balance is low but I can't find where to top it up at Hongdae station.",
            language: "mn", city: "Seoul", district: "Hongdae", price_mnt: PRICE_MNT, searching_since: new Date().toISOString(),
            matched_at: null, closed_at: null, rematch_used: false, refund_pct: null, decision_note: null,
          };
          requests.set(r.id, r);
          offer = { request_id: r.id, offered_at: new Date().toISOString(), request: r };
          emit();
        }, 2500);
      }
    },
    async pendingOffer() { return offer; },
    watchOffers(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async respondOffer(id, accept) {
      offer = null;
      if (accept) {
        patch(id, { status: "matched", operator_id: ME, matched_at: new Date().toISOString() });
        push(id, null, "An operator joined the chat.");
        push(id, TRAVELER.id, requests.get(id)!.description);
      }
      emit();
    },
    async activeOperatorRequest() { return [...requests.values()].find((r) => r.operator_id === ME && r.status === "matched") ?? null; },
    async payouts() {
      const mine = [...requests.values()].filter((r) => r.operator_id === ME && r.status === "closed_solved")
        .map<PayoutItem>((r) => ({ request_id: r.code, amount_mnt: PRICE_MNT * OPERATOR_SHARE, release_at: new Date(Date.now() + 48 * 3600e3).toISOString(), status: "on_hold" }));
      return [...mine, ...payouts];
    },

    async adminRequests(status) { return [...requests.values()].filter((r) => status.includes(r.status)); },
    async adminConfirmPayment(id) { patch(id, { status: "searching" }); emit(); },
    async adminDecide(id, pct, note) { patch(id, { status: "closed", refund_pct: pct, decision_note: note }); emit(); },
    async adminApplications() {
      return [{ id: "a1", created_at: new Date().toISOString(), full_name: "Temuulen B.", contact: "+82 10 1234 5678", city: "Seoul", area: "Mapo-gu", review_status: "applied" }];
    },
  };
  return api;
}
