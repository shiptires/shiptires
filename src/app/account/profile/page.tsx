"use client";

import { useState, useEffect } from "react";
import { useAuth, type SavedAddress } from "@/contexts/AuthContext";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setAddresses(profile.saved_addresses || []);
    }
  }, [profile]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<SavedAddress>({
    label: "",
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, phone, saved_addresses: addresses }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await refreshProfile();
      setMessage("Profile updated.");
    } catch {
      setMessage("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const addAddress = () => {
    if (!newAddress.label || !newAddress.address1 || !newAddress.city || !newAddress.state || !newAddress.zip) return;
    setAddresses([...addresses, newAddress]);
    setNewAddress({ label: "", firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", zip: "", phone: "" });
    setShowAddAddress(false);
  };

  const removeAddress = (index: number) => {
    setAddresses(addresses.filter((_, i) => i !== index));
  };

  if (!profile) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900">Profile</h2>

        {message && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${message.includes("Failed") ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
            {message}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
            />
          </div>
        </div>
      </div>

      {/* Saved addresses */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Saved Addresses</h3>
          <button
            onClick={() => setShowAddAddress(!showAddAddress)}
            className="text-sm text-orange hover:underline"
          >
            {showAddAddress ? "Cancel" : "Add Address"}
          </button>
        </div>

        {addresses.length > 0 && (
          <div className="mt-4 space-y-3">
            {addresses.map((addr, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{addr.label}</p>
                  <p className="text-sm text-gray-500">
                    {addr.firstName} {addr.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {addr.address1}{addr.address2 && `, ${addr.address2}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {addr.city}, {addr.state} {addr.zip}
                  </p>
                </div>
                <button
                  onClick={() => removeAddress(i)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {addresses.length === 0 && !showAddAddress && (
          <p className="mt-3 text-sm text-gray-400">No saved addresses yet.</p>
        )}

        {showAddAddress && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Label (e.g. Home, Work)"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="First Name"
                value={newAddress.firstName}
                onChange={(e) => setNewAddress({ ...newAddress, firstName: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={newAddress.lastName}
                onChange={(e) => setNewAddress({ ...newAddress, lastName: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
              />
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Address"
                  value={newAddress.address1}
                  onChange={(e) => setNewAddress({ ...newAddress, address1: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Apt, suite, etc. (optional)"
                  value={newAddress.address2}
                  onChange={(e) => setNewAddress({ ...newAddress, address2: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="City"
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="State"
                  maxLength={2}
                  value={newAddress.state}
                  onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none uppercase"
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  maxLength={10}
                  value={newAddress.zip}
                  onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
                />
              </div>
            </div>
            <button
              onClick={addAddress}
              className="rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-dark transition-colors"
            >
              Add
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange-dark transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
