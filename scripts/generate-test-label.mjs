// Generate a FedEx test label using sandbox credentials
// Run: node scripts/generate-test-label.mjs

import { writeFileSync } from "fs";

const SANDBOX_URL = "https://apis-sandbox.fedex.com";
const CLIENT_ID = "l7fc02cfc64aba4248b4f94cbd80673213";
const CLIENT_SECRET = "413c7f65a7fc422b9b0d50d3c7f1f5ff";
const ACCOUNT = "740561073";

async function run() {
  // 1. Auth
  console.log("Authenticating with FedEx sandbox...");
  const authRes = await fetch(`${SANDBOX_URL}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });
  if (!authRes.ok) throw new Error("Auth failed: " + (await authRes.text()));
  const { access_token } = await authRes.json();
  console.log("Auth OK");

  // 2. Create shipment (test label) — FedEx Ground, 35lb tire
  console.log("Creating test shipment (FedEx Ground, 35lb, CA→NY)...");
  const shipBody = {
    accountNumber: { value: ACCOUNT },
    labelResponseOptions: "LABEL",
    requestedShipment: {
      shipper: {
        contact: {
          personName: "Ship Tires",
          phoneNumber: "9165551234",
          companyName: "Ship Tires LLC",
        },
        address: {
          streetLines: ["3450 Sacramento Dr"],
          city: "San Luis Obispo",
          stateOrProvinceCode: "CA",
          postalCode: "93401",
          countryCode: "US",
        },
      },
      recipients: [
        {
          contact: {
            personName: "John Smith",
            phoneNumber: "2125559876",
          },
          address: {
            streetLines: ["123 Main St"],
            city: "New York",
            stateOrProvinceCode: "NY",
            postalCode: "10001",
            countryCode: "US",
            residential: true,
          },
        },
      ],
      pickupType: "DROPOFF_AT_FEDEX_LOCATION",
      serviceType: "GROUND_HOME_DELIVERY",
      packagingType: "YOUR_PACKAGING",
      shippingChargesPayment: {
        paymentType: "SENDER",
        payor: {
          responsibleParty: { accountNumber: { value: ACCOUNT } },
        },
      },
      labelSpecification: {
        labelFormatType: "COMMON2D",
        imageType: "PDF",
        labelStockType: "PAPER_4X6",
      },
      requestedPackageLineItems: [
        {
          sequenceNumber: 1,
          weight: { value: 35, units: "LB" },
          dimensions: { length: 28, width: 28, height: 10, units: "IN" },
        },
      ],
    },
  };

  const shipRes = await fetch(`${SANDBOX_URL}/ship/v1/shipments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shipBody),
  });

  const shipText = await shipRes.text();
  if (!shipRes.ok) {
    console.error("Ship failed:", shipRes.status, shipText);
    return;
  }

  const shipData = JSON.parse(shipText);
  const txn = shipData.output?.transactionShipments?.[0];
  if (!txn) {
    console.error("No shipment in response");
    return;
  }

  const tracking =
    txn.pieceResponses?.[0]?.trackingNumber || txn.masterTrackingNumber;
  console.log("Tracking #:", tracking);

  const doc = txn.pieceResponses?.[0]?.packageDocuments?.[0];
  if (doc?.encodedLabel) {
    const buf = Buffer.from(doc.encodedLabel, "base64");
    const outPath =
      "C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-test-label-home-delivery.pdf";
    writeFileSync(outPath, buf);
    console.log("Label saved to:", outPath);
    console.log("Label size:", buf.length, "bytes");
  } else if (doc?.url) {
    console.log("Label URL:", doc.url);
    // Fetch and save
    const labelRes = await fetch(doc.url);
    const labelBuf = Buffer.from(await labelRes.arrayBuffer());
    const outPath =
      "C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-test-label-home-delivery.pdf";
    writeFileSync(outPath, labelBuf);
    console.log("Label downloaded and saved to:", outPath);
  } else {
    console.log("No label in response");
    console.log(
      "pieceResponse:",
      JSON.stringify(txn.pieceResponses?.[0], null, 2)
    );
  }

  // 3. Also generate a FedEx Ground label (commercial address)
  console.log("\nCreating test shipment (FedEx Ground, 25lb, CA→TX commercial)...");
  shipBody.requestedShipment.serviceType = "FEDEX_GROUND";
  shipBody.requestedShipment.recipients[0] = {
    contact: { personName: "Bob Jones", phoneNumber: "7135559876", companyName: "Acme Auto Shop" },
    address: {
      streetLines: ["456 Westheimer Rd"],
      city: "Houston",
      stateOrProvinceCode: "TX",
      postalCode: "77006",
      countryCode: "US",
      residential: false,
    },
  };
  shipBody.requestedShipment.requestedPackageLineItems[0].weight.value = 25;

  const shipRes2 = await fetch(`${SANDBOX_URL}/ship/v1/shipments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shipBody),
  });

  const shipText2 = await shipRes2.text();
  if (!shipRes2.ok) {
    console.error("Ship 2 failed:", shipRes2.status, shipText2);
    return;
  }

  const shipData2 = JSON.parse(shipText2);
  const txn2 = shipData2.output?.transactionShipments?.[0];
  if (txn2) {
    const tracking2 =
      txn2.pieceResponses?.[0]?.trackingNumber || txn2.masterTrackingNumber;
    console.log("Tracking #:", tracking2);

    const doc2 = txn2.pieceResponses?.[0]?.packageDocuments?.[0];
    if (doc2?.encodedLabel) {
      const buf = Buffer.from(doc2.encodedLabel, "base64");
      const outPath =
        "C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-test-label.pdf";
      writeFileSync(outPath, buf);
      console.log("Label saved to:", outPath);
    } else if (doc2?.url) {
      const labelRes = await fetch(doc2.url);
      const labelBuf = Buffer.from(await labelRes.arrayBuffer());
      const outPath =
        "C:/Users/crypt/OneDrive/Random Storage/Desktop/fedex-test-label.pdf";
      writeFileSync(outPath, labelBuf);
      console.log("Label downloaded and saved to:", outPath);
    }
  }

  console.log("\n=== DONE ===");
  console.log("Two test labels saved to your Desktop.");
  console.log("Next steps:");
  console.log("1. Print both labels");
  console.log("2. Scan them at 600 DPI minimum");
  console.log("3. Email scanned images to: label@fedex.com");
  console.log("4. Include a cover sheet with:");
  console.log("   - Your name & contact info");
  console.log("   - FedEx Account: 208817823");
  console.log("   - Production API Key: l7b22c3009f3f54fab980dac71fb84905e");
  console.log("   - Services: FedEx Ground, Ground Home Delivery");
  console.log("5. Wait ~3 business days for approval");
}

run().catch((e) => console.error("ERROR:", e.message));
