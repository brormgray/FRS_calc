import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMailtoUrl, shareOrEmailReport } from "../pdfExport.js";

describe("pdfExport utilities", () => {
  describe("createMailtoUrl", () => {
    it("generates simple mailto link without query params when optional fields are omitted", () => {
      const url = createMailtoUrl({ to: "client@example.com" });
      expect(url).toBe("mailto:client%40example.com");
    });

    it("correctly encodes to, cc, subject, and body parameters", () => {
      const url = createMailtoUrl({
        to: "john@example.com",
        cc: "advisor@example.com",
        subject: "FRS Analysis: John Doe",
        body: "Hello John,\nHere is your report.",
      });

      expect(url).toContain("mailto:john%40example.com?");
      expect(url).toContain("cc=advisor%40example.com");
      expect(url).toContain("subject=FRS%20Analysis%3A%20John%20Doe");
      expect(url).toContain("body=Hello%20John%2C%0AHere%20is%20your%20report.");
    });
  });

  describe("shareOrEmailReport", () => {
    const mockFile = new File(["dummy pdf content"], "FRS_Analysis_John_Doe.pdf", {
      type: "application/pdf",
    });

    const sampleCalculations = {
      isPre2011Plan: true,
      calculatedRetirementAge: 62,
      projectedYearsOfService: 30,
      monthlyPensionTaxable: 2400,
      dropYears: 5,
      dropLumpSum: 160000,
      buyoutAmount: 389000,
    };

    const sampleAdvisor = {
      name: "Jane Advisor",
      title: "Senior Retirement Specialist",
      firm: "Florida Financial Advisory",
      phone: "(555) 123-4567",
      email: "jane@fladvisory.com",
    };

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("uses Web Share API when navigator.canShare supports files", async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const mockCanShare = vi.fn().mockReturnValue(true);

      global.navigator.canShare = mockCanShare;
      global.navigator.share = mockShare;

      const result = await shareOrEmailReport({
        pdfFile: mockFile,
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        advisorInfo: sampleAdvisor,
        calculations: sampleCalculations,
        selectedOption: 1,
      });

      expect(mockCanShare).toHaveBeenCalledWith({ files: [mockFile] });
      expect(mockShare).toHaveBeenCalled();
      expect(result.method).toBe("share");
      expect(result.success).toBe(true);
    });

    it("falls back to download and mailto link when navigator.canShare is unavailable", async () => {
      delete global.navigator.canShare;
      delete global.navigator.share;

      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/dummy-pdf");
      global.URL.revokeObjectURL = vi.fn();

      const result = await shareOrEmailReport({
        pdfFile: mockFile,
        employeeName: "John Doe",
        employeeEmail: "john@example.com",
        advisorInfo: sampleAdvisor,
        calculations: sampleCalculations,
        selectedOption: 1,
      });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockFile);
      expect(result.method).toBe("fallback");
      expect(result.success).toBe(true);
    });
  });
});
