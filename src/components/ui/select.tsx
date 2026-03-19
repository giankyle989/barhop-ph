import { forwardRef, type SelectHTMLAttributes } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = "", id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-content-secondary mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full rounded bg-surface-card border border-border px-3 py-2 text-content focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors appearance-none cursor-pointer ${error ? "border-status-closed focus:ring-status-closed" : ""} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-surface-card text-content-muted">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface-card text-content">
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-status-closed">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";
