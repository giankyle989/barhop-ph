"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { ImageUpload } from "@/components/admin/image-upload";
import { MultiSelect } from "@/components/admin/multi-select";
import { OpenHoursEditor } from "@/components/admin/open-hours-editor";
import { MenuEditor } from "@/components/admin/menu-editor";
import { EventsEditor } from "@/components/admin/events-editor";
import {
  REGIONS,
  CATEGORIES,
  TAGS,
  getRegionBySlug,
} from "@/lib/constants";
import type { OpenHours, MenuItem, EventItem, SocialLinks } from "@/lib/validations";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListingFormProps {
  /** Prisma Listing object for edit mode; undefined/null for create mode. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listing?: any;
  /** When true the viewer is a business-owner admin (restricted fields hidden). */
  isAdmin?: boolean;
}

type SubmitIntent = "draft" | "published";

// Default open hours: all days closed (null)
const DEFAULT_OPEN_HOURS: OpenHours = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border pb-6 mb-6 last:border-b-0 last:mb-0 last:pb-0">
      <h2 className="text-display-sm font-display text-content mb-4">{title}</h2>
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListingForm({ listing, isAdmin = false }: ListingFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(listing?.id);

  // ── Basic Info state ─────────────────────────────────────────────────────

  const [name, setName] = useState<string>(listing?.name ?? "");
  const [categories, setCategories] = useState<string[]>(listing?.categories ?? []);
  const [status, setStatus] = useState<string>(listing?.status ?? "draft");
  const [isPromoted, setIsPromoted] = useState<boolean>(listing?.isPromoted ?? false);

  // ── Location state ───────────────────────────────────────────────────────

  const [region, setRegion] = useState<string>(listing?.region ?? "");
  const [city, setCity] = useState<string>(listing?.city ?? "");
  const [address, setAddress] = useState<string>(listing?.address ?? "");
  const [latitude, setLatitude] = useState<string>(
    listing?.latitude != null ? String(listing.latitude) : ""
  );
  const [longitude, setLongitude] = useState<string>(
    listing?.longitude != null ? String(listing.longitude) : ""
  );

  // ── Media state ──────────────────────────────────────────────────────────

  const [imageUrl, setImageUrl] = useState<string>(listing?.imageUrl ?? "");
  const [gallery, setGallery] = useState<string[]>(listing?.gallery ?? []);
  const [videoUrl, setVideoUrl] = useState<string>(listing?.videoUrl ?? "");

  // ── Description state ────────────────────────────────────────────────────

  const [description, setDescription] = useState<string>(listing?.description ?? "");

  // ── Tags state ───────────────────────────────────────────────────────────

  const [tags, setTags] = useState<string[]>(listing?.tags ?? []);

  // ── Open Hours state ─────────────────────────────────────────────────────

  const [openHours, setOpenHours] = useState<OpenHours>(
    listing?.openHours ?? DEFAULT_OPEN_HOURS
  );

  // ── Menu state ───────────────────────────────────────────────────────────

  const [menu, setMenu] = useState<MenuItem[]>(listing?.menu ?? []);

  // ── Events state ─────────────────────────────────────────────────────────

  const [events, setEvents] = useState<EventItem[]>(listing?.events ?? []);

  // ── Contact & Social state ───────────────────────────────────────────────

  const [phone, setPhone] = useState<string>(listing?.phone ?? "");
  const [whatsapp, setWhatsapp] = useState<string>(listing?.whatsapp ?? "");
  const [email, setEmail] = useState<string>(listing?.email ?? "");
  const [facebook, setFacebook] = useState<string>(
    (listing?.socialLinks as SocialLinks | undefined)?.facebook ?? ""
  );
  const [instagram, setInstagram] = useState<string>(
    (listing?.socialLinks as SocialLinks | undefined)?.instagram ?? ""
  );
  const [tiktok, setTiktok] = useState<string>(
    (listing?.socialLinks as SocialLinks | undefined)?.tiktok ?? ""
  );
  const [xUrl, setXUrl] = useState<string>(
    (listing?.socialLinks as SocialLinks | undefined)?.x ?? ""
  );

  // ── Submit state ─────────────────────────────────────────────────────────

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────

  // Cities for the currently-selected region
  const cityOptions = region
    ? (getRegionBySlug(region)?.cities.map((c) => ({
        value: c.slug,
        label: c.name,
      })) ?? [])
    : [];

  // When region changes reset city selection if it no longer belongs to the new region
  function handleRegionChange(newRegion: string) {
    setRegion(newRegion);
    const newCities = getRegionBySlug(newRegion)?.cities ?? [];
    const cityStillValid = newCities.some((c) => c.slug === city);
    if (!cityStillValid) setCity("");
  }

  // Gallery helpers
  function handleGalleryUpload(url: string, index: number) {
    setGallery((prev) => {
      const next = [...prev];
      next[index] = url;
      return next;
    });
  }

  // ── Form submission ──────────────────────────────────────────────────────

  async function handleSubmit(intent: SubmitIntent) {
    setSubmitError(null);
    setIsSubmitting(true);

    // Build social links — omit empty strings to avoid URL validation failures
    const socialLinks: SocialLinks = {};
    if (facebook) socialLinks.facebook = facebook;
    if (instagram) socialLinks.instagram = instagram;
    if (tiktok) socialLinks.tiktok = tiktok;
    if (xUrl) socialLinks.x = xUrl;

    const payload: Record<string, unknown> = {
      // Super-admin fields — only included when not restricted
      ...(!isAdmin && {
        name,
        categories,
        status: intent === "draft" ? "draft" : "published",
        isPromoted,
        region,
        city,
        address,
        latitude: latitude !== "" ? parseFloat(latitude) : undefined,
        longitude: longitude !== "" ? parseFloat(longitude) : undefined,
      }),
      // Fields editable by both roles
      description: description || undefined,
      imageUrl: imageUrl || undefined,
      gallery: gallery.length > 0 ? gallery : undefined,
      videoUrl: videoUrl || undefined,
      tags: tags.length > 0 ? tags : undefined,
      openHours,
      menu: menu.length > 0 ? menu : undefined,
      events: events.length > 0 ? events : undefined,
      phone: phone || undefined,
      whatsapp: whatsapp || undefined,
      email: email || undefined,
      socialLinks:
        Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    };

    // When isAdmin triggers a PUT they can still set status to what the intent says.
    // Business owners cannot change status — that field is intentionally excluded.

    try {
      const url = isEditMode
        ? `/api/admin/listings/${listing.id}`
        : "/api/admin/listings";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }

      router.push("/admin/listings");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="w-full max-w-4xl"
    >
      {/* ── Section 1: Basic Info ── */}
      {!isAdmin && (
        <FormSection title="Basic Info">
          <div className="space-y-4">
            <Input
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Venue name"
              required
            />

            <div>
              <MultiSelect
                label="Categories"
                options={CATEGORIES.map((c) => c.name)}
                selected={categories}
                onChange={setCategories}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-content-secondary">
                  Promoted
                </span>
                <div className="flex items-center h-[38px]">
                  <Toggle
                    label="Promoted"
                    checked={isPromoted}
                    onChange={setIsPromoted}
                  />
                </div>
              </div>
            </div>
          </div>
        </FormSection>
      )}

      {/* ── Section 2: Location ── */}
      {!isAdmin && (
        <FormSection title="Location">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Region"
                value={region}
                onChange={(e) => handleRegionChange(e.target.value)}
                placeholder="Select region..."
                options={REGIONS.map((r) => ({
                  value: r.slug,
                  label: r.displayName,
                }))}
              />

              <Select
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={region ? "Select city..." : "Select a region first"}
                options={cityOptions}
                disabled={!region}
              />
            </div>

            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g. 14.5547"
                step="any"
                min={-90}
                max={90}
              />
              <Input
                label="Longitude"
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g. 121.0244"
                step="any"
                min={-180}
                max={180}
              />
            </div>
          </div>
        </FormSection>
      )}

      {/* ── Section 3: Media ── */}
      <FormSection title="Media">
        <div className="space-y-6">
          {/* Primary image */}
          <ImageUpload
            label="Primary Image"
            currentImage={imageUrl || undefined}
            onUpload={(url) => setImageUrl(url)}
          />

          {/* Gallery — show uploaded slots + one empty slot if under limit */}
          <div>
            <p className="text-sm font-medium text-content-secondary mb-2">
              Gallery{" "}
              <span className="text-content-muted font-normal">
                ({gallery.length}/10)
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Render all already-uploaded gallery images */}
              {gallery.map((url, index) => (
                <ImageUpload
                  key={index}
                  label={`Gallery image ${index + 1}`}
                  currentImage={url}
                  onUpload={(newUrl) => handleGalleryUpload(newUrl, index)}
                />
              ))}

              {/* Empty slot for the next upload, as long as under the 10-image cap */}
              {gallery.length < 10 && (
                <ImageUpload
                  key={gallery.length}
                  label={`Gallery image ${gallery.length + 1}`}
                  onUpload={(url) =>
                    setGallery((prev) => [...prev, url])
                  }
                />
              )}
            </div>
          </div>

          <Input
            label="Video URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            type="url"
          />
        </div>
      </FormSection>

      {/* ── Section 4: Description ── */}
      <FormSection title="Description">
        <Textarea
          label="Description (HTML)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="<p>Describe the venue...</p>"
          rows={6}
        />
        <p className="mt-1.5 text-xs text-content-muted">
          Supported tags: b, i, em, strong, a, br, p, ul, ol, li. Content is
          sanitized before saving.
        </p>
      </FormSection>

      {/* ── Section 5: Tags ── */}
      <FormSection title="Tags">
        <MultiSelect
          label="Tags"
          options={TAGS}
          selected={tags}
          onChange={setTags}
        />
      </FormSection>

      {/* ── Section 6: Open Hours ── */}
      <FormSection title="Open Hours">
        <OpenHoursEditor
          value={openHours}
          onChange={(v) => setOpenHours(v as OpenHours)}
        />
      </FormSection>

      {/* ── Section 7: Menu ── */}
      <FormSection title="Menu">
        <MenuEditor value={menu} onChange={setMenu} />
      </FormSection>

      {/* ── Section 8: Events ── */}
      <FormSection title="Events">
        <EventsEditor value={events} onChange={setEvents} />
      </FormSection>

      {/* ── Section 9: Contact & Social ── */}
      <FormSection title="Contact & Social">
        <div className="space-y-4">
          {/* Contact row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+63 917 123 4567"
              type="tel"
            />
            <Input
              label="WhatsApp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+63 917 123 4567"
              type="tel"
            />
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@venue.com"
              type="email"
            />
          </div>

          {/* Social links 2-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Facebook URL"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/venuepage"
              type="url"
            />
            <Input
              label="Instagram URL"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/venue"
              type="url"
            />
            <Input
              label="TikTok URL"
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="https://tiktok.com/@venue"
              type="url"
            />
            <Input
              label="X (Twitter) URL"
              value={xUrl}
              onChange={(e) => setXUrl(e.target.value)}
              placeholder="https://x.com/venue"
              type="url"
            />
          </div>
        </div>
      </FormSection>

      {/* ── Submit area ── */}
      <div className="pt-2">
        {submitError && (
          <div
            role="alert"
            className="mb-4 rounded bg-status-closed/10 border border-status-closed/30 px-4 py-3 text-sm text-status-closed"
          >
            {submitError}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => handleSubmit("draft")}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => handleSubmit("published")}
          >
            Publish
          </Button>
        </div>
      </div>
    </form>
  );
}
