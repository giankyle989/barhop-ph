import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  featured?: boolean;
}

export function Card({ children, className = "", featured = false }: CardProps) {
  return (
    <div className={`rounded-card bg-surface-card border border-border shadow-card transition-all duration-200 hover:border-border-hover ${featured ? "border-status-featured/30 glow-purple" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 pb-0 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}
