const express = require("express");
const puppeteer = require("puppeteer");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { html } = req.body;
    if (!html) return res.status(400).send("HTML is required");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate PDF as Buffer
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true
    });

    await browser.close();

    // Set headers before sending raw buffer
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=export.pdf"
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send raw PDF
    res.end(pdfBuffer); // use res.end instead of res.send to be safe
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("PDF generation failed");
  }
});

module.exports = router;
