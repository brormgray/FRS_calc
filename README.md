# FRS Retirement Estimator

**Author:** Rodney Gray  
**Architecture:** Offline-First Progressive Web App (PWA)

A deterministic, privacy-respecting calculator designed to estimate Florida Retirement System (FRS) pension payouts, D.R.O.P. (Deferred Retirement Option Program) compounding growth, and lifecycle income shortfalls. 

Built with React and Tailwind CSS, this tool processes all actuarial logic entirely in the browser. No financial data is ever transmitted or stored externally.

## Core Features

This application was iteratively developed to reduce cognitive load and provide immediate, accurate retirement projections through several key mechanisms:

* **Dynamic Plan Detection:** Automatically determines Tier 1 (Pre-2011) vs. Tier 2 (Post-2011) FRS plan status by calculating hire dates based on the current system year and entered service years.
* **Dual-Track Eligibility Resolution:** Evaluates Age targets and Years of Service targets simultaneously, deterministically selecting the milestone that occurs first to establish the true retirement age.
* **D.R.O.P. Compounding Engine:** Calculates projected lump sums using the Future Value of an Ordinary Annuity formula ($FV = P \times \frac{(1 + r)^n - 1}{r}$), ensuring interest compounds monthly on top of accumulated deposits.
* **Lifecycle Shortfall Analysis:** Projects total retirement income gaps by comparing current salary against estimated pension, mapped across standard mortality timelines.
* **Frictionless UX:** Inputs default to blank states (rather than zeroes) for rapid data entry, with an explicit confirmation modal for resetting the calculator.
* **Integrated DTMF Support Dialer:** Features a one-tap deep link (`tel:8664469377,,3`) that automatically dials the Division of Retirement and routes through the IVR phone tree to reach the correct administrative department.

## Technical Stack

* **Frontend Framework:** React (Vite)
* **Styling:** Tailwind CSS (v3)
* **Icons:** Lucide React
* **Deployment Architecture:** Progressive Web App (PWA) via `vite-plugin-pwa`

## Local Development &amp; Deployment

1. **Clone and Install:**
   ```bash
   npm install
   ```

2. **Run Local Development Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```
   *The resulting `/dist` directory contains the fully packaged, offline-capable PWA, ready to be deployed to any static hosting environment (Vercel, Netlify, Cloudflare Pages).*

## Disclaimer

This application is an independent estimation tool developed for educational and planning purposes. It is not affiliated with, endorsed by, or representative of the Florida Retirement System (FRS) or the State of Florida. All calculations are approximations. Official benefits and creditable service must be verified directly with the Division of Retirement.