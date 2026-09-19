import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a high-resolution 1-page Letter PDF from an HTML element
 * @param {HTMLElement} element - The report DOM container
 * @param {string} filename - Output filename
 * @returns {Promise<{ blob: Blob, file: File, pdf: jsPDF }>}
 */
export async function generateReportPdfBlob(element, filename = "FRS_Pension_Analysis.pdf") {
  if (!element) {
    throw new Error("Report element not found for PDF generation");
  }

  // Render element to canvas at 2x resolution for retina print crispness
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
    windowWidth: 816, // 8.5" at 96 DPI
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.96);

  // Standard US Letter: 8.5" x 11"
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "in",
    format: "letter",
    compress: true,
  });

  const pageWidth = 8.5;
  const pageHeight = 11;
  const margin = 0.25; // 1/4 inch margins
  const printWidth = pageWidth - margin * 2; // 8.0 inches
  const printHeight = (canvas.height * printWidth) / canvas.width;

  // Center vertically if shorter than page height
  const yOffset = printHeight < pageHeight - margin * 2
    ? margin + (pageHeight - margin * 2 - printHeight) / 2
    : margin;

  pdf.addImage(
    imgData,
    "JPEG",
    margin,
    yOffset,
    printWidth,
    Math.min(printHeight, pageHeight - margin * 2)
  );

  const blob = pdf.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  return { blob, file, pdf };
}

/**
 * Prepares and shares or opens a draft email for the client proposal
 */
export async function shareOrEmailReport({
  pdfFile,
  employeeName,
  employeeEmail,
  advisorInfo,
  calculations,
  selectedOption,
}) {
  const cleanName = employeeName?.trim() || "Valued Client";
  const optionName = selectedOption === 1
    ? "Option 1 (Maximum Single Life)"
    : selectedOption === 2
    ? "Option 2 (10-Year Guarantee)"
    : selectedOption === 3
    ? "Option 3 (100% Joint & Survivor)"
    : "Option 4 (66 2/3% Joint & Survivor)";

  const subject = `Your FRS Pension & DROP Benefit Analysis - ${cleanName}`;
  const body = `Hi ${cleanName},

Thank you for taking the time to review your Florida Retirement System (FRS) pension projections.

Attached is your personalized 1-page FRS Pension & DROP Benefit Analysis based on our consultation.

Summary of Your Projected Benefits:
• Membership Plan: ${calculations.isPre2011Plan ? "Tier 1 (Enrolled Pre-July 2011)" : "Tier 2"}
• Projected Normal Retirement: Age ${calculations.calculatedRetirementAge || "—"} with ${calculations.projectedYearsOfService || "—"} years of credited service
• Selected Pension (${optionName}): $${(calculations.monthlyPensionTaxable || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / month
• D.R.O.P. Lump-Sum Projection (${Math.round(calculations.dropYears * 12 || 0)} months): $${(calculations.dropLumpSum || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• Pension Capital Buyout Equivalent: $${(calculations.buyoutAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Please review the attached 1-page executive report. Feel free to reply directly to this email or contact me at ${advisorInfo?.phone || "my office"} if you have any questions or would like to schedule a follow-up review.

Best regards,

${advisorInfo?.name || "FRS Pension Specialist"}
${advisorInfo?.title || "Retirement Planning Specialist"}
${advisorInfo?.firm || "Florida Retirement Planning"}
${advisorInfo?.phone ? `Phone: ${advisorInfo.phone}\n` : ""}${advisorInfo?.email ? `Email: ${advisorInfo.email}\n` : ""}`;

  // 1. If Web Share API with file support is available (iOS / Android PWA), invoke native share sheet
  if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        files: [pdfFile],
        title: subject,
        text: body,
      });
      return { method: "share", success: true };
    } catch (err) {
      if (err.name === "AbortError") {
        return { method: "share", aborted: true };
      }
      console.warn("Web Share failed, falling back to download + mailto", err);
    }
  }

  // 2. Fallback: Trigger instant browser download of the PDF
  const url = URL.createObjectURL(pdfFile);
  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFile.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  // 3. Open default email client with pre-filled To, CC, Subject, and Body
  const mailtoUrl = createMailtoUrl({
    to: employeeEmail,
    cc: advisorInfo?.email,
    subject,
    body: `${body}\n\n[Note: Please attach the downloaded ${pdfFile.name} report file to this email]`,
  });

  window.location.href = mailtoUrl;
  return { method: "fallback", success: true };
}

/**
 * Builds a RFC 6068 mailto: URI with proper URL component encoding
 */
export function createMailtoUrl({ to = "", cc = "", subject = "", body = "" }) {
  const params = [];
  if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  return `mailto:${encodeURIComponent(to)}${query}`;
}
