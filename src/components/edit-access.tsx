"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { editHeaders, writeEditPin } from "@/lib/edit-session";

type EditAccessValue = {
  /** El servidor exige PIN (demo pública). */
  required: boolean;
  canEdit: boolean;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
};

const EditAccessContext = createContext<EditAccessValue>({
  required: false,
  canEdit: true,
  unlock: async () => false,
  lock: () => undefined,
});

export function useEditAccess() {
  return useContext(EditAccessContext);
}

export function EditAccessProvider({ children }: { children: ReactNode }) {
  const [required, setRequired] = useState(false);
  const [authorized, setAuthorized] = useState(true);

  const refresh = useCallback(async (pin?: string) => {
    if (pin !== undefined) writeEditPin(pin);
    const res = await fetch("/api/edit-access", { headers: editHeaders(), cache: "no-store" });
    if (!res.ok) return false;
    const json = (await res.json()) as { required?: boolean; authorized?: boolean };
    const nextRequired = Boolean(json.required);
    const nextAuthorized = Boolean(json.authorized);
    setRequired(nextRequired);
    setAuthorized(nextAuthorized);
    if (pin && !nextAuthorized) writeEditPin("");
    return !nextRequired || nextAuthorized;
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const lock = useCallback(() => {
    writeEditPin("");
    setAuthorized(false);
  }, []);

  const value = useMemo<EditAccessValue>(
    () => ({
      required,
      canEdit: !required || authorized,
      unlock: (pin) => refresh(pin.trim()),
      lock,
    }),
    [required, authorized, refresh, lock],
  );

  return <EditAccessContext.Provider value={value}>{children}</EditAccessContext.Provider>;
}

export function ReadOnlyNote() {
  const { required, canEdit } = useEditAccess();
  if (!required || canEdit) return null;
  return (
    <p className="text-sm text-slate-500">
      Demo en solo lectura. Desbloquea la edición en el menú para modificar.
    </p>
  );
}

export function EditUnlock() {
  const { required, canEdit, unlock, lock } = useEditAccess();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!required) return null;

  async function submit() {
    setBusy(true);
    setError(null);
    const ok = await unlock(pin);
    setBusy(false);
    if (!ok) {
      setError("PIN incorrecto");
      return;
    }
    setPin("");
    setOpen(false);
  }

  if (canEdit) {
    return (
      <button
        type="button"
        onClick={lock}
        className="mt-2 w-full rounded-lg border border-emerald-800 px-2 py-1.5 text-left text-xs text-emerald-300 hover:border-emerald-500"
      >
        Edición activa · bloquear
      </button>
    );
  }

  return (
    <div className="mt-2">
      {open ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="space-y-2"
        >
          <input
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="PIN de edición"
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-xs text-white outline-none focus:border-orange-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || !pin.trim()}
              className="rounded-lg bg-orange-500 px-2 py-1 text-xs font-medium text-white disabled:bg-slate-700"
            >
              {busy ? "…" : "Entrar"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-400">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-lg border border-slate-700 px-2 py-1.5 text-left text-xs text-slate-300 hover:border-slate-500 hover:text-white"
        >
          Desbloquear edición
        </button>
      )}
    </div>
  );
}
