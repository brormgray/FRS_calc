import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import App from "../App.jsx";

describe("App Integration Tests", () => {
  it("renders the calculator header and default sections", () => {
    render(<App />);
    expect(screen.getByText(/F\.R\.S\. RETIREMENT FUNDS/i)).toBeDefined();
    expect(screen.getByText(/Employee Profile/i)).toBeDefined();
    expect(screen.getByText(/Pension Calculation/i)).toBeDefined();
    expect(screen.getByText(/D\.R\.O\.P\. Compound Growth/i)).toBeDefined();
    expect(screen.getByText(/Shortfall Analysis/i)).toBeDefined();
    expect(screen.getByText(/Pension Account Buyout/i)).toBeDefined();
  });

  it("updates inputs and computes estimated pension and shortfall", () => {
    render(<App />);

    const ageInput = screen.getByPlaceholderText("e.g. 45");
    const salaryInput = screen.getByPlaceholderText("e.g. 60000");
    const yearsInput = screen.getByPlaceholderText("e.g. 15");

    fireEvent.change(ageInput, { target: { name: "currentAge", value: "52" } });
    fireEvent.change(salaryInput, { target: { name: "annualSalary", value: "60000" } });
    fireEvent.change(yearsInput, { target: { name: "yearsEmployed", value: "20" } });

    // Should detect Tier 1 (Pre-2011)
    expect(screen.getByText(/Tier 1 \(Pre-2011\)/i)).toBeDefined();

    // Option 1 estimated monthly pension: $2,400.00
    expect(screen.getByText("$2,400.00")).toBeDefined();

    // Shortfall: $2,600
    expect(screen.getByText("$2,600")).toBeDefined();
  });

  it("allows switching membership class and retirement options", () => {
    render(<App />);

    const specialRiskBtn = screen.getByRole("button", { name: /Special Risk/i });
    fireEvent.click(specialRiskBtn);

    // Option 2 button
    const option2Btn = screen.getByRole("button", { name: /Option 2/i });
    fireEvent.click(option2Btn);

    // Option explanation info accordion
    const infoBtn = screen.getByText(/What does Option 2 mean\?/i);
    expect(infoBtn).toBeDefined();
    fireEvent.click(infoBtn);
    expect(screen.getByText(/10-Year Guarantee/i)).toBeDefined();
  });

  it("calculates Option 3 dynamically when entering spouse age", () => {
    render(<App />);

    const ageInput = screen.getByPlaceholderText("e.g. 45");
    const salaryInput = screen.getByPlaceholderText("e.g. 60000");
    const yearsInput = screen.getByPlaceholderText("e.g. 15");

    fireEvent.change(ageInput, { target: { name: "currentAge", value: "50" } });
    fireEvent.change(salaryInput, { target: { name: "annualSalary", value: "60000" } });
    fireEvent.change(yearsInput, { target: { name: "yearsEmployed", value: "20" } });

    // Select Option 3 (100% Joint & Survivor)
    const option3Btn = screen.getByRole("button", { name: /Option 3/i });
    fireEvent.click(option3Btn);

    // Spouse Age input should be rendered
    const spouseAgeInput = screen.getByLabelText(/Spouse Age/i);
    expect(spouseAgeInput).toBeDefined();

    // Default when no spouse age is entered is same age (0 yrs diff -> 90.0% of Option 1: 2400 * 0.90 = $2,160.00)
    expect(screen.getByText(/Same age as member \(0 yrs\)/i)).toBeDefined();
    expect(screen.getByText("$2,160.00")).toBeDefined();

    // Change spouse age to 45 (5 years younger -> -5 yrs -> 90% - 2.5% = 87.5% -> $2,100.00)
    fireEvent.change(spouseAgeInput, { target: { name: "spouseAge", value: "45" } });
    expect(screen.getByText(/5 yrs younger \(-5 yrs\)/i)).toBeDefined();
    expect(screen.getByText(/87.5% of Option 1/i)).toBeDefined();
    expect(screen.getByText("$2,100.00")).toBeDefined();
  });

  it("opens reset modal and resets calculator to blank state on confirmation", () => {
    render(<App />);

    const ageInput = screen.getByPlaceholderText("e.g. 45");
    fireEvent.change(ageInput, { target: { name: "currentAge", value: "50" } });
    expect(ageInput.value).toBe("50");

    // Click Reset Calculator button in footer
    const resetTrigger = screen.getByRole("button", { name: /Reset Calculator/i });
    fireEvent.click(resetTrigger);

    // Confirmation dialog should appear
    expect(screen.getByText(/Clear all data\?/i)).toBeDefined();

    // Confirm reset
    const confirmBtn = screen.getByRole("button", { name: /Clear Data/i });
    fireEvent.click(confirmBtn);

    // Form inputs should be reset to blank
    expect(ageInput.value).toBe("");
  });

  it("toggles IVR routing information", () => {
    render(<App />);

    const ivrBtn = screen.getByTitle("View routing details");
    fireEvent.click(ivrBtn);

    expect(screen.getByText(/IVR Bypass:/i)).toBeDefined();
    expect(screen.getByText(/System prompts for SSN/i)).toBeDefined();
  });

  it("captures employee identity and opens the 1-Page Report modal", () => {
    render(<App />);

    const nameInput = screen.getByPlaceholderText("e.g. Robert Davis");
    const emailInput = screen.getByPlaceholderText("e.g. robert.davis@flschools.org");
    const agencyInput = screen.getByPlaceholderText("e.g. Orange County Public Schools");

    fireEvent.change(nameInput, { target: { name: "name", value: "Sarah Connor" } });
    fireEvent.change(emailInput, { target: { name: "email", value: "sarah@flschools.org" } });
    fireEvent.change(agencyInput, { target: { name: "agency", value: "Hillsborough County Schools" } });

    expect(nameInput.value).toBe("Sarah Connor");
    expect(emailInput.value).toBe("sarah@flschools.org");

    // Click "1-Page Report & Email" button in the Header
    const openReportBtn = screen.getByRole("button", { name: /1-Page Report & Email/i });
    expect(openReportBtn).toBeDefined();
    fireEvent.click(openReportBtn);

    // Modal should be visible
    expect(screen.getByText(/Export & Deliver 1-Page Proposal/i)).toBeDefined();
    expect(screen.getAllByText(/Sarah Connor/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/sarah@flschools.org/i).length).toBeGreaterThanOrEqual(1);

    // Look for Action buttons
    expect(screen.getByRole("button", { name: /Email Proposal/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Download PDF/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Print/i })).toBeDefined();
  });
});

