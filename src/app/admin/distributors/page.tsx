"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Pricing constants (mirrored from pricing.ts + ebay distributor) ──
const STRIPE_FEE = 0.03;
const SITE_MARGIN = 0.15;
const EBAY_FVF = 0.1325;
const EBAY_MISC = 0.02;
const EBAY_MARGIN = 0.15;
const DEFAULT_SHIPPING = 55;

function calcSitePrice(cost: number, shipping: number): number {
  return Math.round(((cost + shipping) / (1 - STRIPE_FEE - SITE_MARGIN)) * 100) / 100;
}
function calcEbayPrice(cost: number, shipping: number): number {
  return Math.round(((cost + shipping) / (1 - EBAY_FVF - EBAY_MISC - EBAY_MARGIN)) * 100) / 100;
}

interface Distributor {
  id: string;
  name: string;
  slug: string;
  street1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  contact_name: string | null;
  default_shipping_cost: number;
  active: boolean;
}

interface DistributorStats {
  totalItems: number;
  totalQuantity: number;
  avgCost: number;
  brands: string[];
}

interface InventoryItem {
  id: string;
  distributor_id: string;
  tire_id: number;
  cost: number;
  quantity: number;
  part_number: string | null;
  brand: string;
  model: string;
  size: string;
  active: boolean;
  ebay_item_id: string | null;
  ebay_listed_at: string | null;
  updated_at: string;
}

type View = "list" | "detail";

export default function DistributorsPage() {
  const [view, setView] = useState<View>("list");
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail view
  const [selectedDist, setSelectedDist] = useState<Distributor | null>(null);
  const [stats, setStats] = useState<DistributorStats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invTotal, setInvTotal] = useState(0);
  const [invLoading, setInvLoading] = useState(false);
  const [invPage, setInvPage] = useState(0);

  // Search / filter
  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Checkboxes
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ id: string; field: "cost" | "quantity" } | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // eBay sync
  const [syncing, setSyncing] = useState(false);
  const [syncDryRun, setSyncDryRun] = useState(true);
  const [syncResults, setSyncResults] = useState<Array<{ size: string; status: string; ebayPrice?: number; error?: string }>>([]);
  const [showSyncResults, setShowSyncResults] = useState(false);

  // Add distributor form
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formZip, setFormZip] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formFax, setFormFax] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formShipping, setFormShipping] = useState("55");
  const [formSaving, setFormSaving] = useState(false);

  // Add inventory item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemBrand, setItemBrand] = useState("");
  const [itemModel, setItemModel] = useState("");
  const [itemSize, setItemSize] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [itemQty, setItemQty] = useState("4");
  const [itemPartNum, setItemPartNum] = useState("");
  const [itemSaving, setItemSaving] = useState(false);
  const [itemError, setItemError] = useState<string | null>(null);
  const [itemSuccess, setItemSuccess] = useState<string | null>(null);

  // Action messages
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchDistributors();
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && editRef.current) editRef.current.focus();
  }, [editingCell]);

  async function fetchDistributors() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/distributors");
      if (!res.ok) throw new Error("Failed to load distributors");
      const data = await res.json();
      setDistributors(data.distributors || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/distributors/${id}`);
      if (!res.ok) throw new Error("Failed to load distributor");
      const data = await res.json();
      setSelectedDist(data.distributor);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  const fetchInventory = useCallback(async (distId: string, offset = 0, search = "") => {
    setInvLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50", offset: String(offset) });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/distributors/${distId}/inventory?${params}`);
      if (!res.ok) throw new Error("Failed to load inventory");
      const data = await res.json();
      setInventory(data.items || []);
      setInvTotal(data.total || 0);
      setInvPage(offset);
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to load inventory" });
    } finally {
      setInvLoading(false);
    }
  }, []);

  function openDetail(dist: Distributor) {
    setSelectedDist(dist);
    setView("detail");
    setSelected(new Set());
    setSearchQuery("");
    setSyncResults([]);
    setShowSyncResults(false);
    fetchDetail(dist.id);
    fetchInventory(dist.id, 0);
  }

  // ── Search with debounce ────────────────────────────────────
  function handleSearch(q: string) {
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (selectedDist) {
        setInvPage(0);
        setSelected(new Set());
        fetchInventory(selectedDist.id, 0, q);
      }
    }, 300);
  }

  // ── Select / deselect ─────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === inventory.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(inventory.map((i) => i.id)));
    }
  }

  // ── Inline edit ────────────────────────────────────────────
  function startEdit(item: InventoryItem, field: "cost" | "quantity") {
    setEditingCell({ id: item.id, field });
    setEditValue(field === "cost" ? item.cost.toFixed(2) : String(item.quantity));
  }

  async function saveEdit() {
    if (!editingCell || !selectedDist) return;
    const item = inventory.find((i) => i.id === editingCell.id);
    if (!item) return;

    const newVal = parseFloat(editValue);
    if (isNaN(newVal) || newVal < 0) {
      setEditingCell(null);
      return;
    }

    const field = editingCell.field;
    const update = field === "cost"
      ? { cost: newVal }
      : { quantity: Math.round(newVal) };

    try {
      const res = await fetch(`/api/admin/distributors/${selectedDist.id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tire_id: item.tire_id,
          ...update,
          brand: item.brand,
          model: item.model,
          size: item.size,
          part_number: item.part_number,
          [field === "cost" ? "quantity" : "cost"]: field === "cost" ? item.quantity : item.cost,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");

      // Update local state immediately
      setInventory((prev) =>
        prev.map((i) =>
          i.id === editingCell.id ? { ...i, ...update } : i
        )
      );
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Update failed" });
    }
    setEditingCell(null);
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditingCell(null);
  }

  // ── Sync selected to eBay ──────────────────────────────────
  async function handleSyncToEbay() {
    if (!selectedDist) return;
    const items = selected.size > 0
      ? inventory.filter((i) => selected.has(i.id))
      : inventory;

    if (items.length === 0) {
      setActionMsg({ type: "error", text: "No items to sync" });
      return;
    }

    setSyncing(true);
    setSyncResults([]);
    setShowSyncResults(true);
    setActionMsg(null);

    try {
      const shipping = selectedDist.default_shipping_cost ?? DEFAULT_SHIPPING;
      const payload = {
        items: items.map((item) => ({
          brand: item.brand,
          model: item.model,
          size: item.size,
          quantity: item.quantity,
          cost: item.cost,
          partNumber: item.part_number || undefined,
        })),
        shippingCost: shipping,
        ebayFvf: EBAY_FVF,
        miscRate: EBAY_MISC,
        marginRate: EBAY_MARGIN,
        dryRun: syncDryRun,
        distributorId: selectedDist.id,
      };

      const res = await fetch("/api/admin/ebay/distributor-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        let errMsg: string;
        try {
          const errData = JSON.parse(text);
          errMsg = errData.error || `Server error (${res.status})`;
        } catch {
          errMsg = res.status === 504
            ? "Request timed out — too many items. Try syncing in smaller batches (select fewer items)."
            : `Server error (${res.status})`;
        }
        throw new Error(errMsg);
      }

      const data = await res.json();

      if (data.itemResults) {
        setSyncResults(data.itemResults.map((r: { size?: string; title?: string; status?: string; ebayPrice?: number; error?: string }) => ({
          size: r.size || r.title || "Unknown",
          status: r.status || "unknown",
          ebayPrice: r.ebayPrice,
          error: r.error,
        })));
      }

      const synced = data.itemResults?.filter((r: { status: string }) => r.status === "synced").length || 0;
      const revised = data.itemResults?.filter((r: { status: string }) => r.status === "revised").length || 0;
      const skipped = data.itemResults?.filter((r: { status: string }) => r.status === "skipped").length || 0;
      const errCount = data.itemResults?.filter((r: { status: string }) => r.status === "error").length || 0;

      setActionMsg({
        type: errCount > 0 ? "error" : "success",
        text: syncDryRun
          ? `Dry run: ${data.itemResults?.length || 0} items checked (${synced + revised} matched, ${skipped} skipped)`
          : `Synced: ${synced} created, ${revised} revised, ${skipped} skipped, ${errCount} errors`,
      });

      // Refresh inventory to show updated eBay status
      if (!syncDryRun && selectedDist) {
        fetchInventory(selectedDist.id, invPage, searchQuery);
      }
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Sync failed" });
    } finally {
      setSyncing(false);
    }
  }

  // ── Add distributor ────────────────────────────────────────
  async function handleAddDistributor() {
    if (!formName.trim()) return;
    setFormSaving(true);
    try {
      const res = await fetch("/api/admin/distributors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          street1: formStreet.trim() || undefined,
          city: formCity.trim() || undefined,
          state: formState.trim() || undefined,
          postal_code: formZip.trim() || undefined,
          phone: formPhone.trim() || undefined,
          fax: formFax.trim() || undefined,
          email: formEmail.trim() || undefined,
          contact_name: formContact.trim() || undefined,
          default_shipping_cost: parseFloat(formShipping) || 55,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }
      setShowAddForm(false);
      setFormName(""); setFormStreet(""); setFormCity(""); setFormState("");
      setFormZip(""); setFormPhone(""); setFormFax(""); setFormEmail("");
      setFormContact(""); setFormShipping("55");
      fetchDistributors();
      setActionMsg({ type: "success", text: "Distributor created" });
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Failed to create" });
    } finally {
      setFormSaving(false);
    }
  }

  // ── Add inventory item ─────────────────────────────────────
  async function handleAddInventoryItem() {
    if (!selectedDist || !itemBrand || !itemModel || !itemSize || !itemCost) return;
    setItemSaving(true);
    setItemError(null);
    setItemSuccess(null);

    try {
      const checkRes = await fetch("/api/admin/ebay/distributor-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{
            brand: itemBrand.trim(),
            model: itemModel.trim(),
            size: itemSize.trim(),
            quantity: parseInt(itemQty) || 4,
            cost: parseFloat(itemCost),
          }],
          dryRun: true,
        }),
      });
      const checkData = await checkRes.json();
      const result = checkData.itemResults?.[0];

      if (!result?.tireId) {
        setItemError(`No matching tire found in DB for ${itemBrand} ${itemModel} ${itemSize}`);
        return;
      }

      const res = await fetch(`/api/admin/distributors/${selectedDist.id}/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tire_id: result.tireId,
          cost: parseFloat(itemCost),
          quantity: parseInt(itemQty) || 4,
          part_number: itemPartNum.trim() || undefined,
          brand: itemBrand.trim(),
          model: itemModel.trim(),
          size: itemSize.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      setItemSuccess(`Added: ${itemBrand} ${itemModel} ${itemSize} (Tire ID: ${result.tireId})`);
      setItemSize("");
      setItemCost("");
      setItemPartNum("");
      fetchInventory(selectedDist.id, invPage, searchQuery);
      fetchDetail(selectedDist.id);
    } catch (e) {
      setItemError(e instanceof Error ? e.message : "Failed to add item");
    } finally {
      setItemSaving(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!selectedDist) return;
    try {
      const res = await fetch(`/api/admin/distributors/${selectedDist.id}/inventory/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setSelected((prev) => { const next = new Set(prev); next.delete(itemId); return next; });
      fetchInventory(selectedDist.id, invPage, searchQuery);
      fetchDetail(selectedDist.id);
    } catch (e) {
      setActionMsg({ type: "error", text: e instanceof Error ? e.message : "Delete failed" });
    }
  }

  // ── List View ─────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Distributors</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 transition-colors"
          >
            Add Distributor
          </button>
        </div>

        {actionMsg && (
          <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${
            actionMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {actionMsg.text}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg px-5 py-4 text-sm text-red-700">{error}</div>
        ) : distributors.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-500">
            No distributors yet. Add your first distributor to get started.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2.5 px-4 text-left font-medium text-gray-500">Name</th>
                  <th className="py-2.5 px-4 text-left font-medium text-gray-500">Location</th>
                  <th className="py-2.5 px-4 text-left font-medium text-gray-500">Contact</th>
                  <th className="py-2.5 px-4 text-right font-medium text-gray-500">Shipping</th>
                  <th className="py-2.5 px-4 text-center font-medium text-gray-500">Status</th>
                  <th className="py-2.5 px-4 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {distributors.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(d)}>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{d.name}</p>
                      {d.email && <p className="text-xs text-gray-500">{d.email}</p>}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">
                      {d.city && d.state ? `${d.city}, ${d.state} ${d.postal_code || ""}` : "—"}
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-xs">{d.phone || "—"}</td>
                    <td className="py-3 px-4 text-right text-gray-700 text-xs">${d.default_shipping_cost?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${d.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {d.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-gray-400">&rarr;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Distributor Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Distributor</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                  <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="TD Wholesale" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Street</label>
                    <input type="text" value={formStreet} onChange={(e) => setFormStreet(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                    <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                    <input type="text" value={formState} onChange={(e) => setFormState(e.target.value)} maxLength={2} placeholder="CA" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">ZIP</label>
                    <input type="text" value={formZip} onChange={(e) => setFormZip(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Default Shipping ($)</label>
                    <input type="number" step="0.01" value={formShipping} onChange={(e) => setFormShipping(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                    <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fax</label>
                    <input type="text" value={formFax} onChange={(e) => setFormFax(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
                    <input type="text" value={formContact} onChange={(e) => setFormContact(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900">Cancel</button>
                <button onClick={handleAddDistributor} disabled={!formName.trim() || formSaving} className="px-4 py-2 bg-safety-orange text-white rounded text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                  {formSaving ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Detail View ───────────────────────────────────────────
  const shipping = selectedDist?.default_shipping_cost ?? DEFAULT_SHIPPING;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setView("list"); setSelectedDist(null); }} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{selectedDist?.name || "Distributor"}</h1>
        {selectedDist?.active && (
          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Active</span>
        )}
      </div>

      {actionMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm mb-4 ${
          actionMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {actionMsg.text}
        </div>
      )}

      {/* Info + Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Contact info */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Contact Info</h2>
          {selectedDist && (
            <div className="space-y-1.5 text-sm text-gray-600">
              {selectedDist.street1 && <p>{selectedDist.street1}</p>}
              {selectedDist.city && <p>{selectedDist.city}, {selectedDist.state} {selectedDist.postal_code}</p>}
              {selectedDist.phone && <p>Phone: {selectedDist.phone}</p>}
              {selectedDist.fax && <p>Fax: {selectedDist.fax}</p>}
              {selectedDist.email && <p>Email: <a href={`mailto:${selectedDist.email}`} className="text-safety-orange hover:underline">{selectedDist.email}</a></p>}
              <p className="mt-2 pt-2 border-t border-gray-100">Default Shipping: <span className="font-medium text-gray-900">${selectedDist.default_shipping_cost?.toFixed(2)}</span></p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Inventory Stats</h2>
          {stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Total SKUs</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalItems}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Units</p>
                <p className="text-xl font-semibold text-gray-900">{stats.totalQuantity.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Cost</p>
                <p className="text-xl font-semibold text-gray-900">${stats.avgCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Brands</p>
                <p className="text-sm text-gray-700">{stats.brands.length > 0 ? stats.brands.join(", ") : "—"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Loading...</p>
          )}
        </div>
      </div>

      {/* Add Inventory Item */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Add Inventory</h2>
          <button
            onClick={() => setShowAddItem(!showAddItem)}
            className="text-xs text-safety-orange hover:text-orange-600 font-medium"
          >
            {showAddItem ? "Hide" : "Add Item"}
          </button>
        </div>

        {showAddItem && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Brand</label>
                <input type="text" value={itemBrand} onChange={(e) => setItemBrand(e.target.value)} placeholder="BFGoodrich" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
                <input type="text" value={itemModel} onChange={(e) => setItemModel(e.target.value)} placeholder="All-Terrain T/A KO2" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Size</label>
                <input type="text" value={itemSize} onChange={(e) => setItemSize(e.target.value)} placeholder="LT255/75R17" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Cost ($)</label>
                <input type="number" step="0.01" value={itemCost} onChange={(e) => setItemCost(e.target.value)} placeholder="212.00" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Qty</label>
                <input type="number" value={itemQty} onChange={(e) => setItemQty(e.target.value)} min={0} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Part#</label>
                <input type="text" value={itemPartNum} onChange={(e) => setItemPartNum(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-safety-orange focus:border-safety-orange" />
              </div>
            </div>

            {/* Price preview */}
            {itemCost && parseFloat(itemCost) > 0 && (
              <div className="bg-gray-50 rounded px-3 py-2 mb-3 text-xs text-gray-600 flex gap-6">
                <span>Site: <span className="font-medium text-gray-900">${calcSitePrice(parseFloat(itemCost), shipping).toFixed(2)}</span></span>
                <span>eBay: <span className="font-medium text-gray-900">${calcEbayPrice(parseFloat(itemCost), shipping).toFixed(2)}</span></span>
                <span>Margin: <span className="font-medium text-green-700">15%</span></span>
              </div>
            )}

            {itemError && <p className="text-xs text-red-600 mb-2">{itemError}</p>}
            {itemSuccess && <p className="text-xs text-green-600 mb-2">{itemSuccess}</p>}

            <button
              onClick={handleAddInventoryItem}
              disabled={!itemBrand || !itemModel || !itemSize || !itemCost || itemSaving}
              className="px-4 py-2 bg-safety-orange text-white rounded font-medium text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {itemSaving ? "Adding..." : "Add to Inventory"}
            </button>
          </>
        )}
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Toolbar: Search + Actions */}
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-gray-900 whitespace-nowrap">Inventory ({invTotal})</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search brand, model, size..."
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:ring-safety-orange focus:border-safety-orange"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selected.size > 0 && (
              <span className="text-xs text-gray-500">{selected.size} selected</span>
            )}
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={syncDryRun}
                onChange={(e) => setSyncDryRun(e.target.checked)}
                className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
              />
              Dry Run
            </label>
            <button
              onClick={handleSyncToEbay}
              disabled={syncing || inventory.length === 0}
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncing ? "Syncing..." : selected.size > 0 ? `Sync ${selected.size} to eBay` : "Sync All to eBay"}
            </button>
          </div>
        </div>

        {invLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading inventory...</div>
        ) : inventory.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            {searchQuery ? `No results for "${searchQuery}"` : "No inventory items yet. Add items above to build this distributor's catalog."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2.5 px-2 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === inventory.length && inventory.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
                      />
                    </th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Brand</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Model</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Size</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">Cost</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">Site Price</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">eBay Price</th>
                    <th className="py-2.5 px-3 text-right font-medium text-gray-500">Qty</th>
                    <th className="py-2.5 px-3 text-left font-medium text-gray-500">Part#</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">Tire ID</th>
                    <th className="py-2.5 px-3 text-center font-medium text-gray-500">eBay</th>
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => (
                    <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selected.has(item.id) ? "bg-orange-50" : ""}`}>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-gray-300 text-safety-orange focus:ring-safety-orange"
                        />
                      </td>
                      <td className="py-2 px-3 text-gray-900 text-xs">{item.brand}</td>
                      <td className="py-2 px-3 text-gray-900 text-xs">{item.model}</td>
                      <td className="py-2 px-3 text-gray-700 font-mono text-xs">{item.size}</td>

                      {/* Editable Cost */}
                      <td className="py-2 px-3 text-right text-xs">
                        {editingCell?.id === item.id && editingCell.field === "cost" ? (
                          <input
                            ref={editRef}
                            type="number"
                            step="0.01"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleEditKeyDown}
                            className="w-20 px-1 py-0.5 border border-safety-orange rounded text-xs text-right focus:ring-safety-orange focus:border-safety-orange"
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(item, "cost")}
                            className="cursor-pointer text-gray-700 hover:text-safety-orange hover:underline"
                            title="Click to edit"
                          >
                            ${item.cost.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-right font-medium text-gray-900 text-xs">${calcSitePrice(item.cost, shipping).toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-medium text-blue-700 text-xs">${calcEbayPrice(item.cost, shipping).toFixed(2)}</td>

                      {/* Editable Quantity */}
                      <td className="py-2 px-3 text-right text-xs">
                        {editingCell?.id === item.id && editingCell.field === "quantity" ? (
                          <input
                            ref={editRef}
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={handleEditKeyDown}
                            className="w-16 px-1 py-0.5 border border-safety-orange rounded text-xs text-right focus:ring-safety-orange focus:border-safety-orange"
                          />
                        ) : (
                          <span
                            onClick={() => startEdit(item, "quantity")}
                            className="cursor-pointer text-gray-700 hover:text-safety-orange hover:underline"
                            title="Click to edit"
                          >
                            {item.quantity}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-gray-500 text-xs font-mono">{item.part_number || "—"}</td>
                      <td className="py-2 px-3 text-center text-gray-500 text-xs font-mono">{item.tire_id}</td>
                      <td className="py-2 px-3 text-center">
                        {item.ebay_item_id ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700" title={`eBay #${item.ebay_item_id}`}>
                            Listed
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:text-red-700" title="Remove">
                          &#10005;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {invTotal > 50 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  Showing {invPage + 1}–{Math.min(invPage + 50, invTotal)} of {invTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => selectedDist && fetchInventory(selectedDist.id, Math.max(0, invPage - 50), searchQuery)}
                    disabled={invPage === 0}
                    className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => selectedDist && fetchInventory(selectedDist.id, invPage + 50, searchQuery)}
                    disabled={invPage + 50 >= invTotal}
                    className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sync Results */}
      {showSyncResults && syncResults.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">eBay Sync Results</h3>
            <button onClick={() => setShowSyncResults(false)} className="text-xs text-gray-400 hover:text-gray-600">Hide</button>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-3 text-left font-medium text-gray-500">Item</th>
                  <th className="py-2 px-3 text-center font-medium text-gray-500">Status</th>
                  <th className="py-2 px-3 text-right font-medium text-gray-500">eBay Price</th>
                  <th className="py-2 px-3 text-left font-medium text-gray-500">Error</th>
                </tr>
              </thead>
              <tbody>
                {syncResults.map((r, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-1.5 px-3 text-gray-700">{r.size}</td>
                    <td className="py-1.5 px-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        r.status === "synced" ? "bg-green-100 text-green-700" :
                        r.status === "revised" ? "bg-blue-100 text-blue-700" :
                        r.status === "skipped" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right text-gray-700">{r.ebayPrice ? `$${r.ebayPrice.toFixed(2)}` : "—"}</td>
                    <td className="py-1.5 px-3 text-red-600">{r.error || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
