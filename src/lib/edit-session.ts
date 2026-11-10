"use client";

const PIN_KEY = "plantkeep-edit-pin";

export function readEditPin(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(PIN_KEY) ?? "";
}

export function writeEditPin(pin: string) {
  if (pin) sessionStorage.setItem(PIN_KEY, pin);
  else sessionStorage.removeItem(PIN_KEY);
}

export function editHeaders(): Record<string, string> {
  const pin = readEditPin();
  return pin ? { "x-plantkeep-edit": pin } : {};
}
