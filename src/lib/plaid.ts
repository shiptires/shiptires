import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";

let _plaid: PlaidApi | null = null;

export function getPlaid(): PlaidApi {
  if (!_plaid) {
    if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
      throw new Error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
    }
    const config = new Configuration({
      basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
      baseOptions: {
        headers: {
          "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
          "PLAID-SECRET": process.env.PLAID_SECRET,
        },
      },
    });
    _plaid = new PlaidApi(config);
  }
  return _plaid;
}
