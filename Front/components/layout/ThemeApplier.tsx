"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setTema, setSidebarColapsado } from "@/store/slices/uiSlice";

const TEMA_KEY = "repusense:tema";
const SIDEBAR_KEY = "repusense:sidebar";

export function ThemeApplier() {
  const dispatch = useAppDispatch();
  const tema = useAppSelector((s) => s.ui.tema);
  const sidebarColapsado = useAppSelector((s) => s.ui.sidebarColapsado);

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(TEMA_KEY);
      if (guardado === "claro" || guardado === "oscuro") {
        dispatch(setTema(guardado));
      } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        dispatch(setTema("claro"));
      }
    } catch {
      // noop
    }
    try {
      const guardadoSidebar = window.localStorage.getItem(SIDEBAR_KEY);
      if (guardadoSidebar === "true") {
        dispatch(setSidebarColapsado(true));
      } else if (guardadoSidebar === "false") {
        dispatch(setSidebarColapsado(false));
      }
    } catch {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (tema === "claro") {
      root.classList.remove("dark");
      root.classList.add("light");
      root.style.colorScheme = "light";
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    }
    try {
      window.localStorage.setItem(TEMA_KEY, tema);
    } catch {
      // noop
    }
  }, [tema]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_KEY, sidebarColapsado ? "true" : "false");
    } catch {
      // noop
    }
  }, [sidebarColapsado]);

  return null;
}
