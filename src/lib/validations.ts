import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Matches HH:MM from 00:00-23:59 plus exactly 24:00
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/);

const dayHoursSchema = z.object({
  open: timeSchema,
  close: timeSchema,
}).nullable();

export const openHoursSchema = z.object({
  monday: dayHoursSchema,
  tuesday: dayHoursSchema,
  wednesday: dayHoursSchema,
  thursday: dayHoursSchema,
  friday: dayHoursSchema,
  saturday: dayHoursSchema,
  sunday: dayHoursSchema,
});

export const socialLinksSchema = z.object({
  facebook: z.string().url().optional(),
  instagram: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  x: z.string().url().optional(),
});

export const menuItemSchema = z.object({
  item: z.string().min(1),
  price: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(1),
  date: z.string().optional(),
  recurrence: z.string().optional(),
  description: z.string().optional(),
});

export const createListingSchema = z.object({
  name: z.string().min(1).max(200),
  categories: z.array(z.string()).min(1),
  region: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().nullable(),
  gallery: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  openHours: openHoursSchema.optional(),
  menu: z.array(menuItemSchema).optional(),
  events: z.array(eventSchema).optional(),
  isPromoted: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  videoUrl: z.string().url().optional().nullable(),
  socialLinks: socialLinksSchema.optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  googlePlaceId: z.string().optional(),
});

export const updateListingSchema = createListingSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type OpenHours = z.infer<typeof openHoursSchema>;
export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type MenuItem = z.infer<typeof menuItemSchema>;
export type EventItem = z.infer<typeof eventSchema>;
