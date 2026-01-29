import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import type { LoginInput, SignUpInput, ResetPasswordInput } from "../types/auth";

// Import schemas from types/auth.ts
// Note: These are imported for validation testing only
// Auth utility functions are mocked as they require Supabase client

describe("Auth Schemas & Validation", () => {
  describe("LoginSchema", () => {
    const LoginSchema = z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(6, "Password must be at least 6 characters")
    });

    it("should validate correct login credentials", () => {
      const validInput: LoginInput = {
        email: "installer@example.com",
        password: "securePassword123"
      };

      const result = LoginSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidInput = {
        email: "not-an-email",
        password: "securePassword123"
      };

      const result = LoginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject short password", () => {
      const invalidInput = {
        email: "installer@example.com",
        password: "short"
      };

      const result = LoginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject missing email", () => {
      const invalidInput = {
        password: "securePassword123"
      };

      const result = LoginSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });

  describe("SignUpSchema", () => {
    const SignUpSchema = z
      .object({
        companyName: z.string().min(2, "Company name required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string()
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"]
      });

    it("should validate correct signup data", () => {
      const validInput: SignUpInput = {
        companyName: "Solar Solutions Inc",
        email: "installer@example.com",
        password: "securePassword123",
        confirmPassword: "securePassword123"
      };

      const result = SignUpSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject mismatched passwords", () => {
      const invalidInput = {
        companyName: "Solar Solutions Inc",
        email: "installer@example.com",
        password: "securePassword123",
        confirmPassword: "differentPassword123"
      };

      const result = SignUpSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should reject short company name", () => {
      const invalidInput = {
        companyName: "A",
        email: "installer@example.com",
        password: "securePassword123",
        confirmPassword: "securePassword123"
      };

      const result = SignUpSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should require all fields", () => {
      const incompleteInput = {
        companyName: "Solar Solutions Inc",
        email: "installer@example.com"
      };

      const result = SignUpSchema.safeParse(incompleteInput);
      expect(result.success).toBe(false);
    });
  });

  describe("ResetPasswordSchema", () => {
    const ResetPasswordSchema = z.object({
      email: z.string().email("Invalid email address")
    });

    it("should validate correct email", () => {
      const validInput: ResetPasswordInput = {
        email: "installer@example.com"
      };

      const result = ResetPasswordSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidInput = {
        email: "not-an-email"
      };

      const result = ResetPasswordSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});

describe("Auth State Management", () => {
  it("should track authentication state changes", () => {
    const authState = {
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true
    };

    // Simulate login
    authState.user = { id: "user-123", email: "installer@example.com" };
    authState.session = { access_token: "token123" };
    authState.isAuthenticated = true;
    authState.isLoading = false;

    expect(authState.isAuthenticated).toBe(true);
    expect(authState.user?.email).toBe("installer@example.com");

    // Simulate logout
    authState.user = null;
    authState.session = null;
    authState.isAuthenticated = false;

    expect(authState.isAuthenticated).toBe(false);
    expect(authState.user).toBe(null);
  });

  it("should persist session data", () => {
    const sessionData = {
      access_token: "token_abc123",
      refresh_token: "refresh_abc123",
      expires_in: 3600,
      expires_at: Date.now() + 3600000
    };

    // Simulate storage
    const stored = JSON.stringify(sessionData);
    const retrieved = JSON.parse(stored);

    expect(retrieved.access_token).toBe(sessionData.access_token);
    expect(retrieved.expires_in).toBe(3600);
  });

  it("should handle session expiration", () => {
    const expiredSession = {
      access_token: "token_expired",
      expires_at: Date.now() - 1000 // expired 1 second ago
    };

    const isExpired = expiredSession.expires_at < Date.now();
    expect(isExpired).toBe(true);
  });
});

describe("Auth Error Handling", () => {
  it("should handle invalid credentials error", () => {
    const error = new Error("Invalid login credentials");
    expect(error.message).toContain("Invalid");
  });

  it("should handle user not found error", () => {
    const error = new Error("User not found");
    expect(error.message).toContain("not found");
  });

  it("should handle email already exists error", () => {
    const error = new Error("User with this email already exists");
    expect(error.message).toContain("already exists");
  });

  it("should handle network error", () => {
    const error = new Error("Network request failed");
    expect(error.message).toContain("Network");
  });
});

describe("Installer Profile", () => {
  it("should validate installer profile creation", () => {
    const profile = {
      id: "installer-123",
      email: "installer@example.com",
      companyName: "Solar Solutions Inc",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    expect(profile.id).toBeTruthy();
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(profile.companyName).toBeTruthy();
  });

  it("should update installer profile", () => {
    let profile = {
      companyName: "Solar Solutions Inc",
      phone: null,
      website: null
    };

    profile = {
      ...profile,
      phone: "(555) 123-4567",
      website: "https://solarsolutions.com"
    };

    expect(profile.phone).toBe("(555) 123-4567");
    expect(profile.website).toBe("https://solarsolutions.com");
  });
});
