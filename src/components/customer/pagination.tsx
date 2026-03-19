import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
}

/** Build a URL for a given page number, preserving all other search params. */
function buildPageUrl(
  baseUrl: string,
  page: number,
  searchParams: Record<string, string>
): string {
  const params = new URLSearchParams(searchParams);
  if (page === 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${baseUrl}?${qs}` : baseUrl;
}

/**
 * Compute the window of up to 5 visible page numbers with ellipsis markers.
 * Returns an array where numbers are page indices and `null` represents "...".
 */
function getPageWindow(
  current: number,
  total: number
): Array<number | null> {
  if (total <= 7) {
    // Show all pages — no ellipsis needed
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: Array<number | null> = [];

  // Always show first page
  pages.push(1);

  const windowStart = Math.max(2, current - 2);
  const windowEnd = Math.min(total - 1, current + 2);

  if (windowStart > 2) {
    pages.push(null); // left ellipsis
  }

  for (let p = windowStart; p <= windowEnd; p++) {
    pages.push(p);
  }

  if (windowEnd < total - 1) {
    pages.push(null); // right ellipsis
  }

  // Always show last page
  pages.push(total);

  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;
  const pageWindow = getPageWindow(currentPage, totalPages);

  const navLinkBase =
    "flex items-center justify-center w-9 h-9 rounded text-sm transition-colors";
  const activeClass = "bg-neon-purple text-white font-medium";
  const inactiveClass =
    "bg-surface-card text-content-secondary border border-border hover:border-border-hover hover:text-content";
  const disabledClass =
    "bg-surface-card text-content-muted border border-border opacity-40 pointer-events-none";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {/* First */}
      {isFirst ? (
        <span className={`${navLinkBase} ${disabledClass}`} aria-disabled="true">
          <ChevronsLeft size={16} aria-hidden="true" />
          <span className="sr-only">First page</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(baseUrl, 1, searchParams)}
          className={`${navLinkBase} ${inactiveClass}`}
          aria-label="First page"
        >
          <ChevronsLeft size={16} aria-hidden="true" />
        </Link>
      )}

      {/* Previous */}
      {isFirst ? (
        <span className={`${navLinkBase} ${disabledClass}`} aria-disabled="true">
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(baseUrl, currentPage - 1, searchParams)}
          className={`${navLinkBase} ${inactiveClass}`}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </Link>
      )}

      {/* Page number window */}
      {pageWindow.map((page, index) =>
        page === null ? (
          <span
            key={`ellipsis-${index}`}
            className="flex items-center justify-center w-9 h-9 text-content-muted text-sm select-none"
            aria-hidden="true"
          >
            &hellip;
          </span>
        ) : (
          <Link
            key={page}
            href={buildPageUrl(baseUrl, page, searchParams)}
            className={`${navLinkBase} ${page === currentPage ? activeClass : inactiveClass}`}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {isLast ? (
        <span className={`${navLinkBase} ${disabledClass}`} aria-disabled="true">
          <ChevronRight size={16} aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(baseUrl, currentPage + 1, searchParams)}
          className={`${navLinkBase} ${inactiveClass}`}
          aria-label="Next page"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </Link>
      )}

      {/* Last */}
      {isLast ? (
        <span className={`${navLinkBase} ${disabledClass}`} aria-disabled="true">
          <ChevronsRight size={16} aria-hidden="true" />
          <span className="sr-only">Last page</span>
        </span>
      ) : (
        <Link
          href={buildPageUrl(baseUrl, totalPages, searchParams)}
          className={`${navLinkBase} ${inactiveClass}`}
          aria-label="Last page"
        >
          <ChevronsRight size={16} aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
