import type { ReactNode } from "react";

type BadgeVariant = "default" | "open" | "closed" | "featured" | "neon";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-surface-overlay text-content-secondary",
  open: "bg-status-open/20 text-status-open",
  closed: "bg-status-closed/20 text-status-closed",
  featured: "bg-status-featured/20 text-status-featured border border-status-featured/30",
  neon: "bg-neon-purple/20 text-neon-purple",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
