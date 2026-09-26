import { z } from "zod";

const opt = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optUrl = z.string().trim().max(300).url("Enter a full link starting with https://").optional().or(z.literal(""));

export const identitySchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  cac: opt(30),
  category: z.string().trim().min(1, "Required").max(60),
  tagline: z.string().trim().min(1, "Required").max(160),
  about: z.string().trim().min(20, "Write at least a couple of sentences").max(1500),
  years: z.string().trim().min(1, "Required").max(20),
});

export const contactSchema = z.object({
  whatsapp: z.string().trim().regex(/^[+0-9()\-\s]{7,20}$/, "Enter a valid number"),
  phone: z.string().trim().regex(/^[+0-9()\-\s]{7,20}$/, "Enter a valid number"),
  email: z.string().trim().email("Enter a valid email").max(255),
  address: opt(300),
  instagram: optUrl,
  facebook: optUrl,
  tiktok: optUrl,
  website: optUrl,
});

export const GOALS = ["Sales", "Bookings", "Inquiries", "Credibility", "A combination"] as const;
export const goalsSchema = z.object({
  goal: z.enum(GOALS, { errorMap: () => ({ message: "Choose a goal" }) }),
  customer: z.string().trim().min(10, "Tell us a little more").max(800),
});

export const contentSchema = z.object({
  logoPath: opt(300),
  logoHelp: z.boolean(),
  colors: opt(120),
  colorHelp: z.boolean(),
  products: z
    .array(z.object({ name: z.string().trim().min(1, "Name required").max(100), description: opt(400), price: opt(40) }))
    .min(1, "Add at least one product or service")
    .max(40),
  photoPaths: z.array(z.string().max(300)).max(20),
  testimonials: opt(2000),
  hours: z.string().trim().min(1, "Required").max(300),
}).refine((d) => !!d.logoPath || d.logoHelp, { message: "Upload a logo or ask for design help", path: ["logoPath"] })
  .refine((d) => !!d.colors || d.colorHelp, { message: "Enter your colours or ask us to help", path: ["colors"] });

export const PAGES = ["Home", "About", "Services", "Gallery", "Contact", "Blog", "Other"] as const;
export const DOMAIN = ["I already have one", "Please buy one for me", "I have a preferred name"] as const;
export const structureSchema = z.object({
  pages: z.array(z.enum(PAGES)).min(1, "Pick at least one page"),
  pagesOther: opt(200),
  references: opt(600),
  domainStatus: z.enum(DOMAIN, { errorMap: () => ({ message: "Choose an option" }) }),
  domainName: opt(120),
});

export const consentSchema = z.object({ caseStudy: z.boolean(), publicMedia: z.boolean() });

export const stepSchemas = [identitySchema, contactSchema, goalsSchema, contentSchema, structureSchema, consentSchema] as const;
export const STEP_TITLES = ["Business identity", "Contact & channels", "Goals & audience", "Content & assets", "Structure & preferences", "Campaign consent"];
