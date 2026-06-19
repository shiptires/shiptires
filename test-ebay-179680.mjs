import fs from 'fs';

const lines = fs.readFileSync('.env.production', 'utf8').split('\n');
for (const line of lines) {
  const m = line.match(/^([^#=]+)="(.*)"$/);
  if (m) process.env[m[1].trim()] = m[2];
}

async function getToken() {
  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: process.env.EBAY_REFRESH_TOKEN,
      scope: [
        'https://api.ebay.com/oauth/api_scope',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.account',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      ].join(' '),
    }),
  });
  const data = await res.json();
  return data.access_token;
}

const HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  'Content-Language': 'en-US',
  'Accept-Language': 'en-US',
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
});

async function main() {
  const token = await getToken();
  const sku = 'ST-TEST-179680';

  // 1. Create inventory item
  console.log('1. Creating inventory item...');
  const itemRes = await fetch(`https://api.ebay.com/sell/inventory/v1/inventory_item/${sku}`, {
    method: 'PUT',
    headers: HEADERS(token),
    body: JSON.stringify({
      availability: { shipToLocationAvailability: { quantity: 1 } },
      condition: 'NEW',
      product: {
        title: 'Goodyear Assurance Tripletred 235/55R17 99H API TEST',
        description: 'API test listing - Goodyear Assurance Tripletred 235/55R17 99H',
        aspects: {
          Brand: ['Goodyear'],
          'Manufacturer Part Number': ['399181508'],
          'Tire Size': ['235/55R17'],
          'Section Width': ['235 mm'],
          'Aspect Ratio': ['55'],
          'Rim Diameter': ['17 in'],
          'Load Index': ['99'],
          'Speed Rating': ['H'],
        },
        brand: 'Goodyear',
        mpn: '399181508',
        imageUrls: ['https://ship.tires/images/tires/d97a57214a6cdd5341ed75a96e380e64.webp'],
      },
    }),
  });
  console.log('   Item status:', itemRes.status);
  if (itemRes.status !== 204 && itemRes.status !== 200) {
    console.log('   Item error:', await itemRes.text());
    return;
  }
  console.log('   Item created OK');

  // 2. Create offer with category 179680
  console.log('2. Creating offer with category 179680...');
  const offerRes = await fetch('https://api.ebay.com/sell/inventory/v1/offer', {
    method: 'POST',
    headers: HEADERS(token),
    body: JSON.stringify({
      sku,
      marketplaceId: 'EBAY_US',
      format: 'FIXED_PRICE',
      listingDescription: 'API test - Goodyear Assurance Tripletred 235/55R17 99H',
      availableQuantity: 1,
      categoryId: '179680',
      merchantLocationKey: process.env.EBAY_LOCATION_KEY || 'shiptires_warehouse',
      pricingSummary: {
        price: { value: '205.84', currency: 'USD' },
      },
      listingPolicies: {
        fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID,
        paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID,
        returnPolicyId: process.env.EBAY_RETURN_POLICY_ID,
      },
    }),
  });
  const offerData = await offerRes.text();
  console.log('   Offer status:', offerRes.status);
  console.log('   Offer response:', offerData);

  if (!offerRes.ok) {
    console.log('   OFFER CREATION FAILED');
    return;
  }

  const parsed = JSON.parse(offerData);
  const offerId = parsed.offerId;
  console.log('   Offer created:', offerId);

  // 3. Publish the offer
  console.log('3. Publishing offer...');
  const pubRes = await fetch(`https://api.ebay.com/sell/inventory/v1/offer/${offerId}/publish`, {
    method: 'POST',
    headers: HEADERS(token),
  });
  const pubData = await pubRes.text();
  console.log('   Publish status:', pubRes.status);
  console.log('   Publish response:', pubData);
}

main().catch(e => console.error(e));
