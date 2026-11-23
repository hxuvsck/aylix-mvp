import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { makeDemoApi } from "./demoApi";
import { strings, type Key, type Lang } from "./strings";
import { makeSupabaseApi } from "./supabaseApi";
import type { Api, Me } from "./types";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const api: Api = url && key ? makeSupabaseApi(url, key) : makeDemoApi();

type Ctx = {
  me: Me | null;
  ready: boolean;
  refreshMe: () => Promise<void>;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key, vars?: Record<string, string | number>) => string;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const [lang, setLangState] = useState<Lang>("mn");

  const refreshMe = useCallback(async () => {
    try {
      setMe(await api.me());
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem("aylix-lang").then((l) => l && setLangState(l as Lang)).catch(() => {});
    refreshMe().finally(() => setReady(true));
    return api.onAuth(() => void refreshMe());
  }, [refreshMe]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem("aylix-lang", l).catch(() => {});
  }, []);

  const t = useCallback(
    (k: Key, vars?: Record<string, string | number>) => {
      let s = strings[lang][k] ?? strings.en[k] ?? k;
      if (vars) for (const [v, x] of Object.entries(vars)) s = s.replace(`{${v}}`, String(x));
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ me, ready, refreshMe, lang, setLang, t }), [me, ready, refreshMe, lang, setLang, t]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
