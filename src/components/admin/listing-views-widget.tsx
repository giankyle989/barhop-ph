// Server component — imports from @/lib/umami which is server-side only
import { getPageViews, getTotalPageViews } from "@/lib/umami";
import { buildListingUrl } from "@/lib/listing-helpers";

interface Props {
  region: string;
  city: string;
  slug: string;
}

export async function ListingViewsWidget({ region, city, slug }: Props) {
  const urlPath = buildListingUrl(region, city, slug);
  const [total, last30] = await Promise.all([
    getTotalPageViews(urlPath),
    getPageViews(urlPath, 30),
  ]);

  return (
    <div className="flex gap-4 text-sm">
      <div>
        <span className="text-content-muted">Total views:</span>{" "}
        <span className="font-semibold">{total.toLocaleString()}</span>
      </div>
      <div>
        <span className="text-content-muted">Last 30 days:</span>{" "}
        <span className="font-semibold">{last30.toLocaleString()}</span>
      </div>
    </div>
  );
}
