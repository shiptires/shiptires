"use client";

import { useState, useEffect } from "react";

interface Warehouse {
  id: string;
  distributor_name: string;
  location_name: string;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string | null;
  contact_name: string | null;
  is_default: boolean;
  active: boolean;
}

const EMPTY_FORM = {
  distributor_name: "",
  location_name: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
  phone: "",
  contact_name: "",
  is_default: false,
};

export default function WarehouseManager() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function fetchWarehouses() {
    try {
      const res = await fetch("/api/admin/warehouses");
      const data = await res.json();
      setWarehouses((data.warehouses || []).filter((w: Warehouse) => w.active));
    } catch {
      setError("Failed to load warehouses");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWarehouses();
  }, []);

  function handleEdit(wh: Warehouse) {
    setEditId(wh.id);
    setForm({
      distributor_name: wh.distributor_name,
      location_name: wh.location_name,
      street1: wh.street1,
      street2: wh.street2 || "",
      city: wh.city,
      state: wh.state,
      postal_code: wh.postal_code,
      country: wh.country,
      phone: wh.phone || "",
      contact_name: wh.contact_name || "",
      is_default: wh.is_default,
    });
    setShowForm(true);
  }

  function handleNew() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch("/api/admin/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setShowForm(false);
      setEditId(null);
      setForm(EMPTY_FORM);
      await fetchWarehouses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this warehouse?")) return;
    try {
      const res = await fetch("/api/admin/warehouses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      await fetchWarehouses();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  function updateForm(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Warehouses</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Distributor ship-from locations
          </p>
        </div>
        <button
          onClick={handleNew}
          className="text-sm px-3 py-1.5 bg-safety-orange text-white rounded hover:bg-orange-700 transition-colors"
        >
          Add Warehouse
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 bg-red-50 border border-red-200 rounded px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Warehouse list */}
      {loading ? (
        <p className="px-5 py-4 text-sm text-gray-400">Loading...</p>
      ) : warehouses.length === 0 ? (
        <p className="px-5 py-4 text-sm text-gray-400">No warehouses configured.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {warehouses.map((wh) => (
            <div key={wh.id} className="px-5 py-3 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {wh.distributor_name} — {wh.location_name}
                  {wh.is_default && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {wh.street1}, {wh.city}, {wh.state} {wh.postal_code}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(wh)}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(wh.id)}
                  className="text-xs text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSave} className="border-t border-gray-200 p-5 space-y-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700">
            {editId ? "Edit Warehouse" : "New Warehouse"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">
                Distributor Name <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={form.distributor_name}
                onChange={(e) => updateForm("distributor_name", e.target.value)}
                placeholder="e.g. ATD, Tire Rack"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">
                Location Name <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={form.location_name}
                onChange={(e) => updateForm("location_name", e.target.value)}
                placeholder="e.g. Sacramento DC"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">
                Street Address <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={form.street1}
                onChange={(e) => updateForm("street1", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Street 2</span>
              <input
                type="text"
                value={form.street2}
                onChange={(e) => updateForm("street2", e.target.value)}
                placeholder="Suite, unit, etc."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">
                City <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">
                State <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateForm("state", e.target.value)}
                maxLength={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm uppercase"
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">
                ZIP <span className="text-red-400">*</span>
              </span>
              <input
                type="text"
                value={form.postal_code}
                onChange={(e) => updateForm("postal_code", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Phone</span>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-gray-500 block mb-1">Contact Name</span>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => updateForm("contact_name", e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm flex items-end pb-2 gap-2">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => updateForm("is_default", e.target.checked)}
                className="accent-safety-orange"
              />
              <span className="text-gray-600">Set as default warehouse</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 bg-safety-orange text-white rounded hover:bg-orange-700 disabled:bg-gray-300 transition-colors"
            >
              {saving ? "Saving..." : editId ? "Update" : "Add Warehouse"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY_FORM); }}
              className="text-sm px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
