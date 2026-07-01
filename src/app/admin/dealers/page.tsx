"use client";

import { useEffect, useState } from "react";

interface Application {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  business_type: string;
  estimated_monthly_volume: string;
  tax_id: string;
  website: string;
  message: string;
  status: string;
  created_at: string;
}

interface Dealer {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  business_type: string;
  active: boolean;
  created_at: string;
}

export default function AdminDealersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [approveModal, setApproveModal] = useState<Application | null>(null);
  const [password, setPassword] = useState("");
  const [approving, setApproving] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<Dealer | null>(null);
  const [dealerOrders, setDealerOrders] = useState<Array<{ id: string; total: number; status: string; created_at: string }>>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dealers");
      const data = await res.json();
      setApplications(data.applications || []);
      setDealers(data.dealers || []);
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function handleApprove() {
    if (!approveModal || !password) return;
    setApproving(true);

    try {
      const res = await fetch("/api/admin/dealers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: approveModal.id, password }),
      });

      if (res.ok) {
        setApproveModal(null);
        setPassword("");
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to approve");
      }
    } catch {
      alert("Network error");
    }
    setApproving(false);
  }

  async function handleReject(id: string) {
    if (!confirm("Reject this application?")) return;

    await fetch(`/api/admin/dealers/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });
    loadData();
  }

  async function toggleDealerActive(dealer: Dealer) {
    await fetch(`/api/admin/dealers/${dealer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !dealer.active }),
    });
    loadData();
  }

  async function viewDealer(dealer: Dealer) {
    setSelectedDealer(dealer);
    try {
      const res = await fetch(`/api/admin/dealers/${dealer.id}`);
      const data = await res.json();
      setDealerOrders(data.orders || []);
    } catch {
      setDealerOrders([]);
    }
  }

  const pendingApps = applications.filter((a) => a.status === "pending");
  const processedApps = applications.filter((a) => a.status !== "pending");

  if (loading) {
    return <div className="p-6 text-gray-400 text-sm">Loading dealers...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Dealer Management</h1>

      {/* Pending Applications */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Pending Applications ({pendingApps.length})
        </h2>
        {pendingApps.length === 0 ? (
          <p className="text-sm text-gray-400">No pending applications.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{app.business_name}</td>
                    <td className="px-4 py-3 text-gray-600">{app.contact_name}</td>
                    <td className="px-4 py-3 text-gray-600">{app.email}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{app.business_type}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => { setApproveModal(app); setPassword(""); }}
                        className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Active Dealers */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Dealers ({dealers.length})
        </h2>
        {dealers.length === 0 ? (
          <p className="text-sm text-gray-400">No dealers yet.</p>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dealers.map((dealer) => (
                  <tr key={dealer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{dealer.business_name}</td>
                    <td className="px-4 py-3 text-gray-600">{dealer.contact_name}</td>
                    <td className="px-4 py-3 text-gray-600">{dealer.email}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{dealer.business_type}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        dealer.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {dealer.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => viewDealer(dealer)}
                        className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => toggleDealerActive(dealer)}
                        className={`text-xs px-3 py-1 rounded ${
                          dealer.active
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {dealer.active ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Processed Applications */}
      {processedApps.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Processed Applications ({processedApps.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {processedApps.map((app) => (
                  <tr key={app.id}>
                    <td className="px-4 py-3 text-gray-900">{app.business_name}</td>
                    <td className="px-4 py-3 text-gray-600">{app.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        app.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(app.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Approve Modal */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Approve Dealer</h3>
            <p className="mt-2 text-sm text-gray-600">
              Creating account for <strong>{approveModal.business_name}</strong> ({approveModal.email})
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Set Dealer Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for dealer"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                autoFocus
              />
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={() => setApproveModal(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={!password || approving}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {approving ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dealer Detail Modal */}
      {selectedDealer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedDealer.business_name}</h3>
              <button onClick={() => setSelectedDealer(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <dl className="space-y-2 text-sm">
              <div><dt className="text-gray-500">Contact</dt><dd className="text-gray-900">{selectedDealer.contact_name}</dd></div>
              <div><dt className="text-gray-500">Email</dt><dd className="text-gray-900">{selectedDealer.email}</dd></div>
              <div><dt className="text-gray-500">Phone</dt><dd className="text-gray-900">{selectedDealer.phone || "-"}</dd></div>
              <div><dt className="text-gray-500">Type</dt><dd className="text-gray-900 capitalize">{selectedDealer.business_type}</dd></div>
              <div><dt className="text-gray-500">Status</dt><dd className={selectedDealer.active ? "text-green-600 font-medium" : "text-red-600 font-medium"}>{selectedDealer.active ? "Active" : "Disabled"}</dd></div>
            </dl>

            {dealerOrders.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-2">Order History ({dealerOrders.length})</h4>
                <div className="space-y-2">
                  {dealerOrders.map((o) => (
                    <div key={o.id} className="flex justify-between text-sm bg-gray-50 rounded px-3 py-2">
                      <span className="text-gray-600">{new Date(o.created_at).toLocaleDateString()}</span>
                      <span className="font-medium">${Number(o.total).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        o.status === "paid" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
