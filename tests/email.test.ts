import { describe, it, expect } from "vitest";

// Mock email template functions
function customerSubmissionEmail(
  customerName: string,
  systemSize: number,
  address: string,
  annualProduction: number
) {
  return {
    html: `
      <h1>Thank you for your solar inquiry, ${customerName}!</h1>
      <p>We're analyzing your solar potential for ${address}.</p>
      <p><strong>Estimated System Size:</strong> ${systemSize} kW</p>
      <p><strong>Annual Production:</strong> ${annualProduction.toLocaleString()} kWh</p>
    `,
    text: `Thank you for your solar inquiry, ${customerName}!\nWe're analyzing your solar potential for ${address}.\nEstimated System Size: ${systemSize} kW\nAnnual Production: ${annualProduction.toLocaleString()} kWh`
  };
}

function installerLeadEmail(
  installerName: string,
  customerName: string,
  systemSize: number,
  address: string,
  leadScore: number
) {
  return {
    html: `
      <h1>New Solar Lead for ${installerName}</h1>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>System Size:</strong> ${systemSize} kW</p>
      <p><strong>Lead Score:</strong> ${leadScore}/100</p>
    `,
    text: `New Solar Lead for ${installerName}\nCustomer: ${customerName}\nAddress: ${address}\nSystem Size: ${systemSize} kW\nLead Score: ${leadScore}/100`
  };
}

describe("Email Templates", () => {
  describe("Customer Submission Email", () => {
    it("should render customer email with all details", () => {
      const email = customerSubmissionEmail(
        "John Smith",
        8.5,
        "123 Main St, Denver, CO 80202",
        10200
      );

      expect(email.html).toContain("John Smith");
      expect(email.html).toContain("8.5 kW");
      expect(email.html).toContain("10,200"); // formatted with comma
      expect(email.html).toContain("123 Main St");
    });

    it("should have both HTML and plain text versions", () => {
      const email = customerSubmissionEmail(
        "Jane Doe",
        6.0,
        "456 Oak Ave, Boulder, CO 80301",
        7200
      );

      expect(email.html).toBeTruthy();
      expect(email.text).toBeTruthy();
      expect(email.html).toContain("<h1>");
      expect(email.text).toContain("Thank you");
    });

    it("should format production numbers with commas", () => {
      const email = customerSubmissionEmail(
        "Test User",
        5.0,
        "Test Address",
        12000
      );

      // Annual production should be formatted with comma separator
      expect(email.html).toContain("12,000");
      expect(email.text).toContain("12,000");
    });

    it("should include customer name and address", () => {
      const customerName = "Bob Johnson";
      const address = "789 Elm St, Fort Collins, CO 80525";
      const email = customerSubmissionEmail(customerName, 7.0, address, 8400);

      expect(email.html).toContain(customerName);
      expect(email.html).toContain(address);
      expect(email.text).toContain(customerName);
      expect(email.text).toContain(address);
    });
  });

  describe("Installer Lead Email", () => {
    it("should render installer email with lead details", () => {
      const email = installerLeadEmail(
        "Solar Team",
        "John Smith",
        8.5,
        "123 Main St, Denver, CO 80202",
        78
      );

      expect(email.html).toContain("Solar Team");
      expect(email.html).toContain("John Smith");
      expect(email.html).toContain("8.5 kW");
      expect(email.html).toContain("78");
    });

    it("should include lead score prominently", () => {
      const email = installerLeadEmail(
        "Solar Company",
        "Customer Name",
        5.0,
        "Address",
        85
      );

      expect(email.html).toContain("Lead Score");
      expect(email.html).toContain("85/100");
      expect(email.text).toContain("Lead Score: 85/100");
    });

    it("should have both HTML and plain text versions", () => {
      const email = installerLeadEmail(
        "Installer",
        "Customer",
        6.0,
        "123 Test St",
        70
      );

      expect(email.html).toBeTruthy();
      expect(email.text).toBeTruthy();
      expect(email.html).toContain("<h1>");
      expect(email.text).toContain("New Solar Lead");
    });

    it("should display all lead information", () => {
      const installerName = "Premier Solar";
      const customerName = "Alice Brown";
      const systemSize = 9.0;
      const address = "999 Solar Way, Golden, CO 80401";
      const leadScore = 92;

      const email = installerLeadEmail(
        installerName,
        customerName,
        systemSize,
        address,
        leadScore
      );

      expect(email.html).toContain(installerName);
      expect(email.html).toContain(customerName);
      expect(email.html).toContain("9 kW");
      expect(email.html).toContain(address);
      expect(email.html).toContain("92");
    });

    it("should handle various lead scores", () => {
      const scores = [30, 50, 75, 95];

      scores.forEach((score) => {
        const email = installerLeadEmail(
          "Installer",
          "Customer",
          5.0,
          "Address",
          score
        );

        expect(email.html).toContain(`${score}/100`);
      });
    });
  });

  describe("Email Formatting", () => {
    it("should not have broken HTML tags", () => {
      const email = customerSubmissionEmail("Test", 5.0, "Address", 6000);

      // Check for properly closed tags
      const openH1 = (email.html.match(/<h1>/g) || []).length;
      const closeH1 = (email.html.match(/<\/h1>/g) || []).length;
      expect(openH1).toBe(closeH1);

      const openP = (email.html.match(/<p>/g) || []).length;
      const closeP = (email.html.match(/<\/p>/g) || []).length;
      expect(openP).toBe(closeP);
    });

    it("should have non-empty content", () => {
      const email = customerSubmissionEmail("Test", 5.0, "Address", 6000);

      expect(email.html.length).toBeGreaterThan(50);
      expect(email.text.length).toBeGreaterThan(50);
    });

    it("should handle special characters in names", () => {
      const email = customerSubmissionEmail(
        "José García",
        5.0,
        "123 Avenida Real",
        6000
      );

      expect(email.html).toContain("José");
      expect(email.html).toContain("García");
      expect(email.text).toContain("José");
    });

    it("should not contain undefined or null values", () => {
      const email = customerSubmissionEmail("Test", 5.0, "Address", 6000);

      expect(email.html).not.toContain("undefined");
      expect(email.html).not.toContain("null");
      expect(email.text).not.toContain("undefined");
      expect(email.text).not.toContain("null");
    });
  });

  describe("Email Content Structure", () => {
    it("customer email should have required sections", () => {
      const email = customerSubmissionEmail(
        "Customer",
        5.0,
        "123 Street",
        6000
      );

      expect(email.html).toContain("Thank you");
      expect(email.html).toContain("System Size");
      expect(email.html).toContain("Production");
    });

    it("installer email should have required sections", () => {
      const email = installerLeadEmail(
        "Installer",
        "Customer",
        5.0,
        "Address",
        75
      );

      expect(email.html).toContain("New");
      expect(email.html).toContain("Customer");
      expect(email.html).toContain("Lead Score");
    });
  });

  describe("Email Data Validation", () => {
    it("should handle zero system size", () => {
      const email = customerSubmissionEmail("Test", 0, "Address", 0);

      expect(email.html).toContain("0 kW");
      expect(email.html).toContain("0");
    });

    it("should handle large numbers", () => {
      const email = customerSubmissionEmail(
        "Test",
        25.5,
        "Address",
        30600
      );

      expect(email.html).toContain("25.5");
      expect(email.html).toContain("30,600");
    });

    it("should handle long addresses", () => {
      const longAddress =
        "123 Very Long Street Name With Multiple Words, City, State 12345";
      const email = customerSubmissionEmail("Test", 5.0, longAddress, 6000);

      expect(email.html).toContain(longAddress);
      expect(email.text).toContain(longAddress);
    });

    it("should handle long customer names", () => {
      const longName = "Alexander Maximilian von Humboldt";
      const email = customerSubmissionEmail(longName, 5.0, "Address", 6000);

      expect(email.html).toContain(longName);
      expect(email.text).toContain(longName);
    });
  });
});
