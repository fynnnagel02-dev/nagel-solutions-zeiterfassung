"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

import { buildAppHref } from "@/src/lib/demo/paths";
import type { AppRole } from "@/src/lib/types/domain";

type AppRuntimeContextValue = {
  isDemo: boolean;
  role: AppRole;
  embed: boolean;
  basePath: string;
  showRoleSwitcher: boolean;
};

const AppRuntimeContext = createContext<AppRuntimeContextValue>({
  isDemo: false,
  role: "employee",
  embed: false,
  basePath: "",
  showRoleSwitcher: false,
});

export function AppRuntimeProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AppRuntimeContextValue;
}) {
  return <AppRuntimeContext.Provider value={value}>{children}</AppRuntimeContext.Provider>;
}

export function useAppRuntime() {
  return useContext(AppRuntimeContext);
}

export function useAppHref(path: string) {
  const runtime = useAppRuntime();
  return buildAppHref(path, runtime);
}
