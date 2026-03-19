import { describe, it, expect } from "vitest";
import {
  loginSchema,
  openHoursSchema,
  socialLinksSchema,
  menuItemSchema,
  createListingSchema,
} from "../../src/lib/validations";

describe("loginSchema", () => {
  it("accepts valid login credentials", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "secret123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 6 characters", () => {
    const result = loginSchema.safeParse({
      email: "admin@example.com",
      password: "abc",
    });
    expect(result.success).toBe(false);
  });
});

describe("openHoursSchema", () => {
  const validHours = {
    monday: { open: "18:00", close: "02:00" },
    tuesday: { open: "18:00", close: "02:00" },
    wednesday: { open: "18:00", close: "02:00" },
    thursday: { open: "18:00", close: "02:00" },
    friday: { open: "18:00", close: "02:00" },
    saturday: { open: "18:00", close: "02:00" },
    sunday: { open: "18:00", close: "02:00" },
  };

  it("accepts valid open hours", () => {
    const result = openHoursSchema.safeParse(validHours);
    expect(result.success).toBe(true);
  });

  it("accepts 00:00 as close time (midnight)", () => {
    const result = openHoursSchema.safeParse({
      ...validHours,
      monday: { open: "20:00", close: "00:00" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts 24:00 as close time (end of day)", () => {
    const result = openHoursSchema.safeParse({
      ...validHours,
      friday: { open: "18:00", close: "24:00" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null for a day (closed)", () => {
    const result = openHoursSchema.safeParse({
      ...validHours,
      monday: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects informal time format like '5pm'", () => {
    const result = openHoursSchema.safeParse({
      ...validHours,
      monday: { open: "5pm", close: "2am" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time '24:30' (only 24:00 is allowed beyond 23:59)", () => {
    const result = openHoursSchema.safeParse({
      ...validHours,
      saturday: { open: "20:00", close: "24:30" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid minutes like '25:61'", () => {
    const result = openHoursSchema.safeParse({
      ...validHours,
      sunday: { open: "25:61", close: "02:00" },
    });
    expect(result.success).toBe(false);
  });
});

describe("socialLinksSchema", () => {
  it("accepts valid URLs for all platforms", () => {
    const result = socialLinksSchema.safeParse({
      facebook: "https://facebook.com/myvenue",
      instagram: "https://instagram.com/myvenue",
      tiktok: "https://tiktok.com/@myvenue",
      x: "https://x.com/myvenue",
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all links optional)", () => {
    const result = socialLinksSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts partial social links", () => {
    const result = socialLinksSchema.safeParse({
      instagram: "https://instagram.com/myvenue",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid URL", () => {
    const result = socialLinksSchema.safeParse({
      facebook: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("menuItemSchema", () => {
  it("accepts item with all fields", () => {
    const result = menuItemSchema.safeParse({
      item: "San Miguel",
      price: "₱80",
      description: "Ice cold San Mig",
      image_url: "https://cdn.example.com/sanmig.jpg",
    });
    expect(result.success).toBe(true);
  });

  it("accepts item with required fields only", () => {
    const result = menuItemSchema.safeParse({
      item: "Gin Pomelo",
      price: "₱120",
    });
    expect(result.success).toBe(true);
  });

  it("rejects item with empty name", () => {
    const result = menuItemSchema.safeParse({
      item: "",
      price: "₱80",
    });
    expect(result.success).toBe(false);
  });

  it("rejects item with empty price", () => {
    const result = menuItemSchema.safeParse({
      item: "San Miguel",
      price: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid image_url", () => {
    const result = menuItemSchema.safeParse({
      item: "San Miguel",
      price: "₱80",
      image_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("createListingSchema", () => {
  const minimalListing = {
    name: "The Palace Pool Club",
    categories: ["club"],
    region: "ncr",
    city: "bgc",
    address: "Upper McKinley Road, BGC, Taguig",
    latitude: 14.5547,
    longitude: 121.0472,
  };

  it("accepts a minimal valid listing", () => {
    const result = createListingSchema.safeParse(minimalListing);
    expect(result.success).toBe(true);
  });

  it("accepts a fully populated listing", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      description: "<p>Best club in BGC</p>",
      imageUrl: "https://cdn.example.com/palace.jpg",
      gallery: ["https://cdn.example.com/img1.jpg"],
      tags: ["rooftop", "pool"],
      isPromoted: true,
      status: "published",
      phone: "+63 2 8123 4567",
      email: "hello@palace.com",
      socialLinks: { instagram: "https://instagram.com/palaceclub" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects listing with missing name", () => {
    const { name: _name, ...withoutName } = minimalListing;
    const result = createListingSchema.safeParse(withoutName);
    expect(result.success).toBe(false);
  });

  it("rejects listing with empty name", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects listing with empty categories array", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      categories: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects latitude greater than 90", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      latitude: 91,
    });
    expect(result.success).toBe(false);
  });

  it("rejects latitude less than -90", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      latitude: -91,
    });
    expect(result.success).toBe(false);
  });

  it("rejects longitude greater than 180", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      longitude: 181,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email in listing", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status value", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      status: "pending",
    });
    expect(result.success).toBe(false);
  });

  it("accepts null imageUrl (explicitly cleared)", () => {
    const result = createListingSchema.safeParse({
      ...minimalListing,
      imageUrl: null,
    });
    expect(result.success).toBe(true);
  });
});
