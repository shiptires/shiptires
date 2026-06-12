"use client";

import { useState } from "react";
import { useAuth, type Vehicle } from "@/contexts/AuthContext";

export default function VehiclesPage() {
  const { profile, refreshProfile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>(profile?.vehicles || []);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newVehicle, setNewVehicle] = useState<Vehicle>({
    year: "",
    make: "",
    model: "",
    tire_size: "",
  });

  const handleSave = async (updatedVehicles: Vehicle[]) => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicles: updatedVehicles }),
      });
      if (!res.ok) throw new Error("Failed to save");
      await refreshProfile();
      setMessage("Vehicles updated.");
    } catch {
      setMessage("Failed to save. Please try again.");
    }
    setSaving(false);
  };

  const addVehicle = () => {
    if (!newVehicle.year || !newVehicle.make || !newVehicle.model) return;
    const updated = [...vehicles, newVehicle];
    setVehicles(updated);
    setNewVehicle({ year: "", make: "", model: "", tire_size: "" });
    setShowAdd(false);
    handleSave(updated);
  };

  const removeVehicle = (index: number) => {
    const updated = vehicles.filter((_, i) => i !== index);
    setVehicles(updated);
    handleSave(updated);
  };

  if (!profile) {
    return <div className="animate-pulse text-gray-400 py-12 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Saved Vehicles</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-sm text-orange hover:underline"
          >
            {showAdd ? "Cancel" : "Add Vehicle"}
          </button>
        </div>

        {message && (
          <div className={`mt-4 rounded-lg p-3 text-sm ${message.includes("Failed") ? "bg-red-50 border border-red-200 text-red-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
            {message}
          </div>
        )}

        {vehicles.length > 0 ? (
          <div className="mt-4 space-y-3">
            {vehicles.map((v, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {v.year} {v.make} {v.model}
                  </p>
                  {v.tire_size && (
                    <p className="text-xs text-gray-500 font-mono mt-0.5">
                      Tire size: {v.tire_size}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeVehicle(i)}
                  disabled={saving}
                  className="text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          !showAdd && (
            <p className="mt-4 text-sm text-gray-400">No saved vehicles. Add one to quickly find matching tires.</p>
          )
        )}

        {showAdd && (
          <div className="mt-4 rounded-lg bg-gray-50 p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Year (e.g. 2023)"
                maxLength={4}
                value={newVehicle.year}
                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
              />
              <input
                type="text"
                placeholder="Make (e.g. Toyota)"
                value={newVehicle.make}
                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
              />
              <input
                type="text"
                placeholder="Model (e.g. Camry)"
                value={newVehicle.model}
                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
              />
            </div>
            <input
              type="text"
              placeholder="Tire size (optional, e.g. 225/65R17)"
              value={newVehicle.tire_size}
              onChange={(e) => setNewVehicle({ ...newVehicle, tire_size: e.target.value })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange focus:ring-1 focus:ring-orange outline-none"
            />
            <button
              onClick={addVehicle}
              disabled={saving}
              className="rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange-dark transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Vehicle"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
