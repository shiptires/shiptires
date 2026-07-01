"use client";

import { useEffect, useState } from "react";

interface DealerInfo {
  id: string;
  business_name: string;
  email: string;
  contact_name: string;
}

export default function DealerAccountPage() {
  const [dealer, setDealer] = useState<DealerInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/dealer/auth/verify")
      .then((r) => r.json())
      .then((d) => { if (d.authenticated) setDealer(d.dealer); });
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }

    setPwStatus("saving");

    try {
      const res = await fetch("/api/dealer/auth", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPwError(data.error || "Failed to update password");
        setPwStatus("error");
        return;
      }

      setPwStatus("saved");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwStatus("idle"), 3000);
    } catch {
      setPwError("Network error");
      setPwStatus("error");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Profile Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Profile Information</h2>
        {dealer ? (
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Business Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{dealer.business_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Contact Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{dealer.contact_name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{dealer.email}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-400">Loading...</p>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              id="current_password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            />
          </div>

          {pwError && (
            <p className="text-sm text-red-600">{pwError}</p>
          )}
          {pwStatus === "saved" && (
            <p className="text-sm text-green-600">Password updated successfully.</p>
          )}

          <button
            type="submit"
            disabled={pwStatus === "saving"}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {pwStatus === "saving" ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
