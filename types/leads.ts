import { z } from "zod";

export const addressSchema = z.object({
  street: z.string().min(1, "Address required"),
  city: z.string().min(1, "City required"),
  state: z.string().min(2, "State required"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Valid ZIP required"),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const usageSchema = z.object({
  billAmount: z.number().positive("Bill amount must be positive").optional(),
  monthlyKwh: z.number().positive("kWh must be positive").optional()
}).refine(
  (data) => data.billAmount || data.monthlyKwh,
  "Provide either bill amount or monthly kWh"
);

export const roofSchema = z.object({
  roofType: z.enum(["asphalt", "metal", "tile", "flat", "other"]),
  squareFeet: z.number().positive("Square feet must be positive"),
  sunExposure: z.enum(["poor", "fair", "good", "excellent"])
});

export const preferencesSchema = z.object({
  wantsBattery: z.boolean(),
  financingType: z.enum(["cash", "loan", "lease", "ppa"]),
  creditScore: z.number().min(300, "Credit score min 300").max(850, "Credit score max 850").default(700),
  timeline: z.enum(["immediate", "3-months", "6-months", "12-months"]),
  notes: z.string().max(500, "Notes max 500 chars").optional()
});

export const contactSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().regex(/^\d{10,}$/, "Valid phone required")
});

export const calculatorFormSchema = z.object({
  address: addressSchema,
  usage: usageSchema,
  roof: roofSchema,
  preferences: preferencesSchema,
  contact: contactSchema
});

export type Address = z.infer<typeof addressSchema>;
export type Usage = z.infer<typeof usageSchema>;
export type Roof = z.infer<typeof roofSchema>;
export type Preferences = z.infer<typeof preferencesSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type CalculatorForm = z.infer<typeof calculatorFormSchema>;

export interface Lead {
  id: string;
  installer_id: string;
  address: Address;
  usage: Usage;
  roof: Roof;
  preferences: Preferences;
  contact: Contact;
  lead_score: number;
  status: 'new' | 'contacted' | 'converted' | 'lost';
  created_at: string;
  updated_at: string;
}
