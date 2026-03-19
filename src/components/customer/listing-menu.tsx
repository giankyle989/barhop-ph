import Image from "next/image";

interface MenuItem {
  item: string;
  price: string;
  description?: string;
  image_url?: string;
}

interface ListingMenuProps {
  menu: MenuItem[] | null;
}

export function ListingMenu({ menu }: ListingMenuProps) {
  if (!menu || menu.length === 0) {
    return (
      <p className="text-sm text-content-muted py-2">No menu available</p>
    );
  }

  return (
    <ul className="divide-y divide-border" aria-label="Menu items">
      {menu.map((item, index) => (
        <li key={index} className="flex gap-3 py-3 first:pt-0 last:pb-0">
          {/* Optional item image */}
          {item.image_url && (
            <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border">
              <Image
                src={item.image_url}
                alt={item.item}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
          )}

          {/* Item details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-content text-sm leading-snug">
                {item.item}
              </span>
              <span className="flex-shrink-0 text-sm font-semibold text-neon-purple whitespace-nowrap">
                {item.price}
              </span>
            </div>
            {item.description && (
              <p className="mt-0.5 text-xs text-content-muted line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
