import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-content-secondary mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded bg-surface-card border border-border px-3 py-2 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors ${error ? "border-status-closed focus:ring-status-closed" : ""} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-status-closed">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
