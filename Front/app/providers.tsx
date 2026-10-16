"use client";

import StoreProvider from "@/store/provider";
import AuthHydrator from "@/components/auth/AuthHydrator";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <AuthHydrator />
      {children}
    </StoreProvider>
  );
}
