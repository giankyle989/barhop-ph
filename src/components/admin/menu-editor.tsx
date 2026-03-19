"use client";

import { Button } from "@/components/ui/button";

interface MenuItem {
  item: string;
  price: string;
  description?: string;
}

interface MenuEditorProps {
  value: MenuItem[];
  onChange: (value: MenuItem[]) => void;
}

const inputClass =
  "rounded bg-surface-card border border-border px-3 py-2 text-content placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-neon-purple focus:border-transparent transition-colors text-sm w-full";

export function MenuEditor({ value, onChange }: MenuEditorProps) {
  function addItem() {
    onChange([...value, { item: "", price: "", description: "" }]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof MenuItem, fieldValue: string) {
    const updated = value.map((entry, i) =>
      i === index ? { ...entry, [field]: fieldValue } : entry
    );
    onChange(updated);
  }

  return (
    <div className="w-full space-y-3">
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((menuItem, index) => (
            <div
              key={index}
              className="rounded bg-surface-card border border-border px-3 py-3"
            >
              {/* Desktop: single row */}
              <div className="hidden sm:grid grid-cols-[1fr_120px_1fr_auto] gap-2 items-start">
                <input
                  type="text"
                  aria-label={`Menu item ${index + 1} name`}
                  placeholder="Item name"
                  value={menuItem.item}
                  onChange={(e) => updateItem(index, "item", e.target.value)}
                  className={inputClass}
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted text-sm select-none pointer-events-none">
                    ₱
                  </span>
                  <input
                    type="text"
                    aria-label={`Menu item ${index + 1} price`}
                    placeholder="0.00"
                    value={menuItem.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    className={`${inputClass} pl-7`}
                  />
                </div>
                <input
                  type="text"
                  aria-label={`Menu item ${index + 1} description`}
                  placeholder="Description (optional)"
                  value={menuItem.description ?? ""}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  aria-label={`Remove menu item ${index + 1}`}
                  onClick={() => removeItem(index)}
                  className="mt-0.5 p-2 rounded text-status-closed hover:bg-status-closed/10 focus:outline-none focus:ring-2 focus:ring-status-closed focus:ring-offset-1 focus:ring-offset-surface transition-colors shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Mobile: stacked */}
              <div className="sm:hidden space-y-2">
                <div className="flex items-start gap-2">
                  <input
                    type="text"
                    aria-label={`Menu item ${index + 1} name`}
                    placeholder="Item name"
                    value={menuItem.item}
                    onChange={(e) => updateItem(index, "item", e.target.value)}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove menu item ${index + 1}`}
                    onClick={() => removeItem(index)}
                    className="mt-0.5 p-2 rounded text-status-closed hover:bg-status-closed/10 focus:outline-none focus:ring-2 focus:ring-status-closed focus:ring-offset-1 focus:ring-offset-surface transition-colors shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted text-sm select-none pointer-events-none">
                    ₱
                  </span>
                  <input
                    type="text"
                    aria-label={`Menu item ${index + 1} price`}
                    placeholder="0.00"
                    value={menuItem.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    className={`${inputClass} pl-7`}
                  />
                </div>
                <input
                  type="text"
                  aria-label={`Menu item ${index + 1} description`}
                  placeholder="Description (optional)"
                  value={menuItem.description ?? ""}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addItem}
        className="w-full border-dashed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5" aria-hidden="true">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        Add Menu Item
      </Button>
    </div>
  );
}
