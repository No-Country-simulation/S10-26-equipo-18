"use client";

import StoreProvider from "@/store/provider";
import AuthHydrator from "@/components/auth/AuthHydrator";
import { ThemeApplier } from "@/components/layout/ThemeApplier";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ThemeApplier />
      <AuthHydrator />
      {children}
    </StoreProvider>
  );
}
