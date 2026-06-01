import type { HTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("glass-panel min-w-0 rounded-[1.35rem] p-4 md:p-5", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Button({
  className,
  children,
  variant = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "soft";
}) {
  const variants = {
    default:
      "border border-slate-700/70 bg-slate-900/70 text-slate-100 hover:bg-slate-800",
    primary:
      "border border-violet-300/20 bg-studio-violet text-white hover:bg-[#7051ed]",
    ghost: "text-slate-300 hover:bg-white/7 hover:text-white",
    soft:
      "border border-slate-700/60 bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition duration-200 active:translate-y-px",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  className,
  children,
  tone = "slate"
}: {
  className?: string;
  children: ReactNode;
  tone?: "slate" | "violet" | "cyan" | "mint" | "amber" | "rose";
}) {
  const tones = {
    slate: "border-slate-600/70 bg-slate-900/70 text-slate-200",
    violet: "border-violet-400/35 bg-violet-400/10 text-violet-200",
    cyan: "border-cyan-300/35 bg-cyan-300/10 text-cyan-100",
    mint: "border-emerald-300/35 bg-emerald-300/10 text-emerald-100",
    amber: "border-amber-300/35 bg-amber-300/10 text-amber-100",
    rose: "border-rose-300/35 bg-rose-300/10 text-rose-100"
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-lg border px-2.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

export function FieldLabel({
  label,
  children,
  className
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      {children}
    </label>
  );
}

export function InputShell({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-slate-700/70 bg-white/[0.055] px-3.5 py-3 text-sm text-slate-100 shadow-studio-inset",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TinyDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "size-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.12)]",
        className
      )}
    />
  );
}
