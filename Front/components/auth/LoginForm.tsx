"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setVendedor } from "@/store/slices/authSlice";
import { VENDEDORES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { MailIcon, RadarIcon } from "@/components/ui/icons";
import { STORAGE_KEY } from "./AuthHydrator";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("valeria.rios@repusense.io");
  const [password, setPassword] = useState("repusense");
  const [cargando, setCargando] = useState(false);

  function ingresar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    const vendedor =
      VENDEDORES.find((v) => v.email.toLowerCase() === email.toLowerCase()) ??
      VENDEDORES[0];
    setTimeout(() => {
      dispatch(setVendedor(vendedor.id));
      try {
        window.localStorage.setItem(STORAGE_KEY, vendedor.id);
      } catch {
        // noop
      }
      router.replace("/");
    }, 550);
  }

  return (
    <form onSubmit={ingresar} className="space-y-5">
      <div>
        <label className="label" htmlFor="email">
          Email corporativo
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="tu@agencia.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" disabled={cargando} className="w-full">
        {cargando ? (
          <>
            <RadarIcon className="h-4 w-4 animate-spin" />
            Iniciando radar...
          </>
        ) : (
          <>
            <MailIcon className="h-4 w-4" />
            Iniciar sesión
          </>
        )}
      </Button>
      <p className="text-center text-[11px] text-slate-500">
        Demo: cualquier email inicia sesión. El operador se asigna según el email
        de la lista. También podés entrar con un clic usando el acceso rápido.
      </p>
    </form>
  );
}
