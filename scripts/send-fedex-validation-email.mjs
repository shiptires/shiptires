// Send FedEx label validation email via Resend
// Run: node --env-file=.env.production scripts/send-fedex-validation-email.mjs

import { readFileSync } from "fs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const label1 = readFileSync("C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-test-label-home-delivery.pdf");
const label2 = readFileSync("C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-test-label.pdf");
const cover = readFileSync("C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-label-validation-cover-sheet.txt");

console.log("Sending FedEx validation email from info@ship.tires...");

const { data, error } = await resend.emails.send({
  from: "Ship.Tires <info@ship.tires>",
  to: "farhad@ship.tires",
  subject: "FedEx Label Validation Submission - SHIP.TIRES - Account 208817823",
  text: `FedEx Bar Code Analysis Team,

Please find attached our label validation submission for FedEx REST API (Ship v1) integration.

Account: 208817823
Production API Key: l7b22c3009f3f54fab980dac71fb84905e
Services: FedEx Ground, Ground Home Delivery

Attached:
1. Cover sheet with full details
2. FedEx Home Delivery test label (Tracking #794829446187)
3. FedEx Ground test label (Tracking #794829446235)

Business: Online tire shipping - SHIP.TIRES

Thank you,
Farhad Khawar
SHIP.TIRES LLC
(916) 476-7689
8279 Cliffcrest Dr, Sacramento, CA 95828`,
  attachments: [
    {
      filename: "fedex-label-validation-cover-sheet.txt",
      content: cover,
    },
    {
      filename: "fedex-test-label-home-delivery.pdf",
      content: label1,
    },
    {
      filename: "fedex-test-label-ground.pdf",
      content: label2,
    },
  ],
});

if (error) {
  console.error("Failed to send:", error);
} else {
  console.log("Email sent! ID:", data?.id);
  console.log("From: info@ship.tires");
  console.log("To: farhad@ship.tires");
  console.log("\nYou can now forward this email to label@fedex.com and attach your phone photos of the printed labels.");
}
