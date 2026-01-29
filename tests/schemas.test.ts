import { describe, it, expect } from "vitest";
import {
  addressSchema,
  usageSchema,
  roofSchema,
  preferencesSchema,
  contactSchema,
  calculatorFormSchema
} from "../types/leads";

describe("Zod Schemas - Validation", () => {
  describe("addressSchema", () => {
    it("should validate a correct address", () => {
      const valid = {
        street: "123 Main St",
        city: "Denver",
        state: "CO",
        zip: "80202"
      };
      const result = addressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject missing street", () => {
      const invalid = { street: "", city: "Denver", state: "CO", zip: "80202" };
      const result = addressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject invalid ZIP format", () => {
      const invalid = {
        street: "123 Main St",
        city: "Denver",
        state: "CO",
        zip: "invalid"
      };
      const result = addressSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should accept ZIP+4 format", () => {
      const valid = {
        street: "123 Main St",
        city: "Denver",
        state: "CO",
        zip: "80202-1234"
      };
      const result = addressSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe("usageSchema", () => {
    it("should validate by bill amount", () => {
      const valid = { billAmount: 120 };
      const result = usageSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should validate by monthly kWh", () => {
      const valid = { monthlyKwh: 900 };
      const result = usageSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject both empty", () => {
      const invalid = { billAmount: undefined, monthlyKwh: undefined };
      const result = usageSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject negative bill", () => {
      const invalid = { billAmount: -100 };
      const result = usageSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("roofSchema", () => {
    it("should validate correct roof data", () => {
      const valid = {
        roofType: "asphalt",
        squareFeet: 2500,
        sunExposure: "good"
      };
      const result = roofSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid roof type", () => {
      const invalid = {
        roofType: "invalid",
        squareFeet: 2500,
        sunExposure: "good"
      };
      const result = roofSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject zero square feet", () => {
      const invalid = {
        roofType: "asphalt",
        squareFeet: 0,
        sunExposure: "good"
      };
      const result = roofSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("preferencesSchema", () => {
    it("should validate correct preferences", () => {
      const valid = {
        wantsBattery: true,
        financingType: "loan",
        timeline: "immediate",
        notes: "Test notes"
      };
      const result = preferencesSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid financing type", () => {
      const invalid = {
        wantsBattery: false,
        financingType: "invalid",
        timeline: "immediate"
      };
      const result = preferencesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should limit notes to 500 chars", () => {
      const invalid = {
        wantsBattery: false,
        financingType: "cash",
        timeline: "immediate",
        notes: "x".repeat(501)
      };
      const result = preferencesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("contactSchema", () => {
    it("should validate correct contact", () => {
      const valid = {
        name: "John Doe",
        email: "john@example.com",
        phone: "3035551234"
      };
      const result = contactSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalid = {
        name: "John Doe",
        email: "invalid-email",
        phone: "3035551234"
      };
      const result = contactSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("should reject short phone number", () => {
      const invalid = {
        name: "John Doe",
        email: "john@example.com",
        phone: "123"
      };
      const result = contactSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("calculatorFormSchema", () => {
    it("should validate complete form", () => {
      const valid = {
        address: {
          street: "123 Main",
          city: "Denver",
          state: "CO",
          zip: "80202"
        },
        usage: { billAmount: 120 },
        roof: { roofType: "asphalt", squareFeet: 2500, sunExposure: "good" },
        preferences: {
          wantsBattery: false,
          financingType: "cash",
          timeline: "immediate"
        },
        contact: {
          name: "John",
          email: "j@ex.com",
          phone: "3035551234"
        }
      };
      const result = calculatorFormSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });
});
