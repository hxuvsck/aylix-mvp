import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/app";
import type { Message, Request } from "@/lib/types";

// Live Request + chat. Realtime pushes changes; a slow poll covers timer-driven changes (5/10-min rules).
export function useRequest(id: string | undefined) {
  const [req, setReq] = useState<Request | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState("");
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [r, m] = await Promise.all([api.getRequest(id), api.messages(id)]);
      setReq(r);
      setMessages(m);
      if (r.operator_id) setPartner(await api.partnerName(id));
      setError(false);
    } catch {
      setError(true);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    load();
    const off = api.watchRequest(id, load);
    const timer = setInterval(load, 5000);
    return () => { off(); clearInterval(timer); };
  }, [id, load]);

  return { req, messages, partner, error, reload: load };
}

export function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}
