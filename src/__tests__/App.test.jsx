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
});
