// src/components/Providers.tsx
"use client";

import { Provider } from "react-redux";
import { useMemo } from "react";
  import { makeStore, AppStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  const store = useMemo<AppStore>(() => {
    return makeStore();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
