import Link from "next/link";
import type { ReactNode } from "react";

export function ListCard({
  active,
  onClick,
  href,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
}) {
  const className = `block w-full rounded-xl border p-4 text-left transition-colors ${
    active ? "border-orange-300 bg-orange-50" : "border-slate-200 bg-white hover:border-slate-300"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}

export function CardMetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 text-sm first:border-0 first:pt-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-slate-800">{children}</span>
    </div>
  );
}

export function CardMetaGrid({ children }: { children: ReactNode }) {
  return <div className="mt-3 space-y-2">{children}</div>;
}
