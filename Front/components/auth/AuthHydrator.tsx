"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setHydrated, setVendedor } from "@/store/slices/authSlice";

export const STORAGE_KEY = "repusense.vendedor";

export default function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(STORAGE_KEY);
      if (guardado) dispatch(setVendedor(guardado));
    } catch {
      // localStorage no disponible
    }
    dispatch(setHydrated(true));
  }, [dispatch]);

  return null;
}
