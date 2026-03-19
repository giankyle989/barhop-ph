"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Copy, Facebook, Instagram } from "lucide-react";

// TikTok and X (Twitter) don't have lucide icons — use SVG inlines
function TikTokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.85 4.85 0 0 1-1-.06z" />
    </svg>
  );
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  x?: string;
}

interface ListingContactProps {
  listingId: string;
  address: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  socialLinks?: SocialLinks | null;
}

export function ListingContact({
  listingId,
  address,
  phone,
  whatsapp,
  email,
  socialLinks,
}: ListingContactProps) {
  const [copied, setCopied] = useState(false);

  function trackContact(type: string) {
    window.umami?.track("contact_click", { type, listing_id: listingId });
  }

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackContact("copy_address");
    } catch {
      // Clipboard API may be blocked; silently fail
    }
  };

  // Format WhatsApp number: strip non-digits, add country code if not present
  const whatsappNumber = whatsapp?.replace(/\D/g, "");
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber.startsWith("63") ? whatsappNumber : `63${whatsappNumber.replace(/^0/, "")}`}`
    : null;

  const hasSocial = socialLinks && Object.values(socialLinks).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Address */}
      <div className="flex items-start gap-2">
        <MapPin
          size={16}
          className="mt-0.5 flex-shrink-0 text-content-muted"
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-content-secondary leading-snug">{address}</p>
          <button
            onClick={handleCopyAddress}
            className="mt-1 inline-flex items-center gap-1 text-xs text-content-muted hover:text-neon-purple transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-purple rounded"
            aria-live="polite"
          >
            <Copy size={11} aria-hidden="true" />
            {copied ? "Copied!" : "Copy address"}
          </button>
        </div>
      </div>

      {/* Phone */}
      {phone && (
        <div className="flex items-center gap-2">
          <Phone size={16} className="flex-shrink-0 text-content-muted" aria-hidden="true" />
          <a
            href={`tel:${phone}`}
            onClick={() => trackContact("phone")}
            className="text-sm text-content-secondary hover:text-neon-purple transition-colors"
          >
            {phone}
          </a>
        </div>
      )}

      {/* WhatsApp */}
      {whatsappUrl && (
        <div className="flex items-center gap-2">
          {/* WhatsApp brand icon via SVG */}
          <svg
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="currentColor"
            className="flex-shrink-0 text-content-muted"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact("whatsapp")}
            className="text-sm text-content-secondary hover:text-neon-purple transition-colors"
          >
            WhatsApp
          </a>
        </div>
      )}

      {/* Email */}
      {email && (
        <div className="flex items-center gap-2">
          <Mail size={16} className="flex-shrink-0 text-content-muted" aria-hidden="true" />
          <a
            href={`mailto:${email}`}
            onClick={() => trackContact("email")}
            className="text-sm text-content-secondary hover:text-neon-purple transition-colors break-all"
          >
            {email}
          </a>
        </div>
      )}

      {/* Social links */}
      {hasSocial && (
        <div className="flex items-center gap-3 pt-1">
          {socialLinks?.facebook && (
            <a
              href={socialLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact("social")}
              className="text-content-muted hover:text-neon-purple transition-colors"
              aria-label="Facebook page"
            >
              <Facebook size={18} aria-hidden="true" />
            </a>
          )}
          {socialLinks?.instagram && (
            <a
              href={socialLinks.instagram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact("social")}
              className="text-content-muted hover:text-neon-pink transition-colors"
              aria-label="Instagram profile"
            >
              <Instagram size={18} aria-hidden="true" />
            </a>
          )}
          {socialLinks?.tiktok && (
            <a
              href={socialLinks.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact("social")}
              className="text-content-muted hover:text-content transition-colors"
              aria-label="TikTok profile"
            >
              <TikTokIcon size={18} />
            </a>
          )}
          {socialLinks?.x && (
            <a
              href={socialLinks.x}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContact("social")}
              className="text-content-muted hover:text-content transition-colors"
              aria-label="X (Twitter) profile"
            >
              <XIcon size={18} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
