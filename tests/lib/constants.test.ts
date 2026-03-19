// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  REGIONS,
  getRegionBySlug,
  getCityBySlug,
  CATEGORIES,
  getCategoryBySlug,
  TAGS,
} from "@/lib/constants";

describe("REGIONS", () => {
  it("NCR exists with correct displayName", () => {
    const ncr = getRegionBySlug("ncr");
    expect(ncr).toBeDefined();
    expect(ncr?.displayName).toBe("National Capital Region");
  });

  it("Makati is found under NCR", () => {
    const makati = getCityBySlug("ncr", "makati");
    expect(makati).toBeDefined();
    expect(makati?.name).toBe("Makati");
  });

  it("non-existent region returns undefined", () => {
    expect(getRegionBySlug("does-not-exist")).toBeUndefined();
  });

  it("non-existent city returns undefined", () => {
    expect(getCityBySlug("ncr", "does-not-exist")).toBeUndefined();
  });

  it("getCityBySlug returns undefined when region does not exist", () => {
    expect(getCityBySlug("does-not-exist", "makati")).toBeUndefined();
  });

  it("all 17 regions are present", () => {
    expect(REGIONS).toHaveLength(17);
  });

  it("all regions have at least one city", () => {
    for (const region of REGIONS) {
      expect(region.cities.length).toBeGreaterThan(0);
    }
  });

  it("all regions have required fields", () => {
    for (const region of REGIONS) {
      expect(region.name).toBeTruthy();
      expect(region.displayName).toBeTruthy();
      expect(region.slug).toBeTruthy();
    }
  });
});

describe("CATEGORIES", () => {
  it("has exactly 13 categories", () => {
    expect(CATEGORIES).toHaveLength(13);
  });

  it("Night Club exists in categories", () => {
    const nightClub = getCategoryBySlug("night-club");
    expect(nightClub).toBeDefined();
    expect(nightClub?.name).toBe("Night Club");
  });

  it("all categories have name and slug", () => {
    for (const category of CATEGORIES) {
      expect(category.name).toBeTruthy();
      expect(category.slug).toBeTruthy();
    }
  });

  it("getCategoryBySlug returns undefined for unknown slug", () => {
    expect(getCategoryBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("TAGS", () => {
  it("has exactly 22 tags", () => {
    expect(TAGS).toHaveLength(22);
  });

  it("Pet Friendly exists in tags", () => {
    expect(TAGS).toContain("Pet Friendly");
  });

  it("all tags are non-empty strings", () => {
    for (const tag of TAGS) {
      expect(typeof tag).toBe("string");
      expect(tag.length).toBeGreaterThan(0);
    }
  });
});
