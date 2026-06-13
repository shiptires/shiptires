import { listCarriers, listServices } from "@/lib/shipstation";
import type { Service } from "@/lib/shipstation";

export const dynamic = "force-dynamic";

export default async function ShippingPage() {
  let carrierServices: { carrier: { name: string; code: string; accountNumber: string; primary: boolean }; services: Service[] }[] = [];
  let error = "";

  try {
    const carriers = await listCarriers();

    carrierServices = await Promise.all(
      carriers.map(async (carrier) => {
        try {
          const services = await listServices(carrier.code);
          return { carrier, services };
        } catch {
          return { carrier, services: [] as Service[] };
        }
      })
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load carriers from ShipStation";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shipping Carriers</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700 mb-6">
          <p className="font-medium">Error loading carriers</p>
          <p className="mt-1 text-red-600">{error}</p>
        </div>
      )}

      {carrierServices.length === 0 && !error && (
        <p className="text-gray-400 text-sm">No carriers found.</p>
      )}

      <div className="space-y-6">
        {carrierServices.map(({ carrier, services }) => (
          <div key={carrier.code} className="bg-white rounded-lg border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">{carrier.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Code: {carrier.code} · Account: {carrier.accountNumber}
                {carrier.primary && " · Primary"}
              </p>
            </div>
            {services.length === 0 ? (
              <p className="px-5 py-4 text-sm text-gray-400">No services available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-5 font-medium text-gray-500">Service</th>
                      <th className="text-left py-2 px-5 font-medium text-gray-500">Code</th>
                      <th className="text-left py-2 px-5 font-medium text-gray-500">Domestic</th>
                      <th className="text-left py-2 px-5 font-medium text-gray-500">International</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc) => (
                      <tr key={svc.code} className="border-b border-gray-100">
                        <td className="py-2 px-5 text-gray-900">{svc.name}</td>
                        <td className="py-2 px-5 text-gray-500 font-mono text-xs">{svc.code}</td>
                        <td className="py-2 px-5">{svc.domestic ? "✓" : "—"}</td>
                        <td className="py-2 px-5">{svc.international ? "✓" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
