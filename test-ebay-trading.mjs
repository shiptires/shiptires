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
  return (await res.json()).access_token;
}

async function main() {
  const token = await getToken();

  // Use Trading API - AddFixedPriceItem
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<AddFixedPriceItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
  <RequesterCredentials>
    <eBayAuthToken>${token}</eBayAuthToken>
  </RequesterCredentials>
  <ErrorLanguage>en_US</ErrorLanguage>
  <WarningLevel>High</WarningLevel>
  <Item>
    <Title>Goodyear Assurance Tripletred 235/55R17 99H - API Test</Title>
    <Description>API test listing via Trading API - Goodyear Assurance Tripletred 235/55R17 99H. Load Index: 99. Speed Rating: H. Weight: 31 lbs.</Description>
    <PrimaryCategory>
      <CategoryID>179680</CategoryID>
    </PrimaryCategory>
    <StartPrice currencyID="USD">205.84</StartPrice>
    <ConditionID>1000</ConditionID>
    <Country>US</Country>
    <Currency>USD</Currency>
    <DispatchTimeMax>3</DispatchTimeMax>
    <ListingDuration>GTC</ListingDuration>
    <ListingType>FixedPriceItem</ListingType>
    <Location>Sacramento, CA 95828</Location>
    <Quantity>1</Quantity>
    <PictureDetails>
      <PictureURL>https://ship.tires/images/tires/d97a57214a6cdd5341ed75a96e380e64.webp</PictureURL>
    </PictureDetails>
    <ItemSpecifics>
      <NameValueList>
        <Name>Brand</Name>
        <Value>Goodyear</Value>
      </NameValueList>
      <NameValueList>
        <Name>Manufacturer Part Number</Name>
        <Value>399181508</Value>
      </NameValueList>
      <NameValueList>
        <Name>Tire Size</Name>
        <Value>235/55R17</Value>
      </NameValueList>
      <NameValueList>
        <Name>Section Width</Name>
        <Value>235 mm</Value>
      </NameValueList>
      <NameValueList>
        <Name>Aspect Ratio</Name>
        <Value>55</Value>
      </NameValueList>
      <NameValueList>
        <Name>Rim Diameter</Name>
        <Value>17 in</Value>
      </NameValueList>
      <NameValueList>
        <Name>Load Index</Name>
        <Value>99</Value>
      </NameValueList>
      <NameValueList>
        <Name>Speed Rating</Name>
        <Value>H</Value>
      </NameValueList>
      <NameValueList>
        <Name>Quantity</Name>
        <Value>1</Value>
      </NameValueList>
    </ItemSpecifics>
    <SellerProfiles>
      <SellerPaymentProfile>
        <PaymentProfileID>${process.env.EBAY_PAYMENT_POLICY_ID}</PaymentProfileID>
      </SellerPaymentProfile>
      <SellerReturnProfile>
        <ReturnProfileID>${process.env.EBAY_RETURN_POLICY_ID}</ReturnProfileID>
      </SellerReturnProfile>
      <SellerShippingProfile>
        <ShippingProfileID>${process.env.EBAY_FULFILLMENT_POLICY_ID}</ShippingProfileID>
      </SellerShippingProfile>
    </SellerProfiles>
  </Item>
</AddFixedPriceItemRequest>`;

  console.log('Calling Trading API AddFixedPriceItem...');
  const res = await fetch('https://api.ebay.com/ws/api.dll', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'X-EBAY-API-COMPATIBILITY-LEVEL': '1193',
      'X-EBAY-API-CALL-NAME': 'AddFixedPriceItem',
      'X-EBAY-API-SITEID': '100',  // eBay Motors site ID
    },
    body: xml,
  });

  const text = await res.text();
  console.log('Status:', res.status);

  // Extract key info from XML response
  const ackMatch = text.match(/<Ack>(\w+)<\/Ack>/);
  const itemIdMatch = text.match(/<ItemID>(\d+)<\/ItemID>/);
  const errMatch = text.match(/<ShortMessage>(.*?)<\/ShortMessage>/g);
  const longErrMatch = text.match(/<LongMessage>(.*?)<\/LongMessage>/g);

  console.log('Ack:', ackMatch ? ackMatch[1] : 'unknown');
  if (itemIdMatch) console.log('Item ID:', itemIdMatch[1]);
  if (errMatch) {
    console.log('Messages:');
    errMatch.forEach(m => console.log(' ', m));
  }
  if (longErrMatch) {
    console.log('Details:');
    longErrMatch.forEach(m => console.log(' ', m));
  }

  // Print full response if failure
  if (!ackMatch || ackMatch[1] !== 'Success') {
    console.log('\nFull response:');
    console.log(text.substring(0, 3000));
  }
}

main().catch(e => console.error(e));
