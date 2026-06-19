import { getConfiguredCarriers, getAvailableSources } from "@/lib/carriers";
import QuoteCalculator from "./QuoteCalculator";
import WarehouseManager from "./WarehouseManager";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  const carriers = getConfiguredCarriers();
  const sources = getAvailableSources();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Shipping</h1>

      {/* Quick Rate Calculator */}
      <QuoteCalculator />

      {/* Warehouse Management */}
      <WarehouseManager />

      {/* Configured Rate Sources */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Rate Sources</h2>

        {sources.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-5 py-4 text-sm text-yellow-700">
            <p className="font-medium">No rate sources configured</p>
            <p className="mt-1 text-yellow-600">
              Set carrier env vars (FEDEX_CLIENT_ID, etc.) or ShipStation credentials to enable rate lookups.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {carriers.includes("fedex") && (
              <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">FedEx Direct</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Account: {process.env.FEDEX_ACCOUNT_NUMBER?.slice(0, 4)}...
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Direct
                  </span>
                </div>
              </div>
            )}
            {carriers.includes("ups") && (
              <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">UPS Direct</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Account: {process.env.UPS_ACCOUNT_NUMBER?.slice(0, 4)}...
                    </p>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    Direct
                  </span>
                </div>
              </div>
            )}
            {sources.includes("shipstation") && (
              <div className="bg-white rounded-lg border border-gray-200 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">ShipStation</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Walleted carrier rates
                    </p>
                  </div>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    Walleted
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
