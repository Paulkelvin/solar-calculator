"use client";

import { useState } from "react";
import { contactSchema, type Contact } from "../../../../types/leads";

interface ContactStepProps {
  value?: Contact;
  onChange: (contact: Contact) => void;
}

export function ContactStep({ value, onChange }: ContactStepProps) {
  const [formValue, setFormValue] = useState<Contact>(
    value || { name: "", email: "", phone: "" }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const normalizeContact = (contact: Contact): Contact => ({
    ...contact,
    name: contact.name.trim(),
    email: contact.email.trim(),
    phone: contact.phone.replace(/\D/g, ""),
  });

  const validate = (updated: Contact) => {
    const normalized = normalizeContact(updated);
    const result = contactSchema.safeParse(normalized);
    if (result.success) {
      onChange(normalized);
      setErrors({});
    } else {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
    }
  };

  const handleChange = (field: keyof Contact, val: string) => {
    const updated = { ...formValue, [field]: val };
    setFormValue(updated);
    validate(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Enter your full name</label>
        <input
          type="text"
          value={formValue.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="John Doe"
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={formValue.email}
          onChange={(e) => handleChange("email", e.target.value)}
          placeholder="john@example.com"
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium">Phone Number</label>
        <input
          type="tel"
          value={formValue.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="3035551234"
          className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
        )}
      </div>

      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
        <p className="flex items-center gap-1.5">
          <svg className="h-3.5 w-3.5 flex-none" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          We'll use this contact info to follow up with your solar results. Your privacy is important to us.
        </p>
      </div>
    </div>
  );
}
