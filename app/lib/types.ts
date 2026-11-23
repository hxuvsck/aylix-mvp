import type { Lang } from "./strings";

export type Role = "traveler" | "operator" | "admin";
export type HelpType = "navigation" | "translation" | "local";
export type RequestStatus =
  | "awaiting_payment" | "searching" | "matched" | "closed_solved" | "under_review" | "closed" | "refunded" | "cancelled";

export type Me = { id: string; role: Role; phone: string | null; full_name: string | null; ui_lang: Lang };

export type Request = {
  id: string;
  code: string;
  created_at: string;
  traveler_id: string;
  operator_id: string | null;
  status: RequestStatus;
  help_type: HelpType;
  description: string;
  language: "mn" | "ko" | "en";
  city: string;
  district: string | null;
  price_mnt: number;
  searching_since: string | null;
  matched_at: string | null;
  closed_at: string | null;
  rematch_used: boolean;
  refund_pct: number | null;
  decision_note: string | null;
  not_solved_reason?: string | null;
};

export type Message = { id: number; request_id: string; sender_id: string | null; body: string; created_at: string };

export type Offer = { request_id: string; offered_at: string; request: Request };

export type OperatorState = { status: string; online: boolean; languages: string[] } | null;

export type PayoutItem = { request_id: string; amount_mnt: number; release_at: string; status: "on_hold" | "ready" | "paid" };

export type Application = { id: string; created_at: string; full_name: string; contact: string; city: string; area: string; review_status: string };

export type NewRequest = { help_type: HelpType; description: string; language: "mn" | "ko" | "en"; city: string; district: string | null };

export type Unsub = () => void;

export interface Api {
  demo: boolean;
  me(): Promise<Me | null>;
  onAuth(cb: () => void): Unsub;
  sendCode(phone: string): Promise<void>;
  verifyCode(phone: string, code: string, lang: Lang): Promise<void>;
  signOut(): Promise<void>;
  updateProfile(p: Partial<Pick<Me, "full_name" | "ui_lang">>): Promise<void>;

  createRequest(r: NewRequest): Promise<Request>;
  submitPayment(id: string, provider: "qpay" | "bank", ref: string): Promise<void>;
  getRequest(id: string): Promise<Request>;
  myRequests(): Promise<Request[]>;
  messages(id: string): Promise<Message[]>;
  watchRequest(id: string, cb: () => void): Unsub;
  sendMessage(id: string, body: string): Promise<void>;
  rematch(id: string): Promise<void>;
  close(id: string, outcome: "solved" | "not_solved", reason?: string): Promise<void>;
  rate(id: string, stars: number, tags: string[], review: string): Promise<void>;
  partnerName(id: string): Promise<string>;

  operatorState(): Promise<OperatorState>;
  setOnline(on: boolean): Promise<void>;
  pendingOffer(): Promise<Offer | null>;
  watchOffers(cb: () => void): Unsub;
  respondOffer(id: string, accept: boolean): Promise<void>;
  activeOperatorRequest(): Promise<Request | null>;
  payouts(): Promise<PayoutItem[]>;

  adminRequests(status: RequestStatus[]): Promise<Request[]>;
  adminConfirmPayment(id: string): Promise<void>;
  adminDecide(id: string, pct: 0 | 50 | 100, note: string): Promise<void>;
  adminApplications(): Promise<Application[]>;
  demoSetRole?(role: Role): void;
}
