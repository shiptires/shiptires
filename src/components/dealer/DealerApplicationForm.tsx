"use client";

import { useState } from "react";

export default function DealerApplicationForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/dealer/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: data.get("business_name"),
          contact_name: data.get("contact_name"),
          email: data.get("email"),
          phone: data.get("phone"),
          street: data.get("street"),
          city: data.get("city"),
          state: data.get("state"),
          zip: data.get("zip"),
          business_type: data.get("business_type"),
          estimated_monthly_volume: data.get("estimated_monthly_volume"),
          tax_id: data.get("tax_id"),
          website: data.get("website"),
          message: data.get("message"),
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-green-800">Application Submitted!</h3>
        <p className="mt-2 text-sm text-green-700">
          We&apos;ll review your application and get back to you within 1-2 business days. You can also call or text us at{" "}
          <a href="tel:+12792388473" className="font-semibold underline">(279) 238-8473</a> or email{" "}
          <a href="mailto:info@ship.tires" className="font-semibold underline">info@ship.tires</a>.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
            Business Name *
          </label>
          <input type="text" name="business_name" id="business_name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">
            Contact Name *
          </label>
          <input type="text" name="contact_name" id="contact_name" required className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input type="email" name="email" id="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input type="tel" name="phone" id="phone" required className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="street" className="block text-sm font-medium text-gray-700">
          Street Address
        </label>
        <input type="text" name="street" id="street" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <div className="col-span-1 sm:col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input type="text" name="city" id="city" className={inputClass} />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input type="text" name="state" id="state" maxLength={2} placeholder="CA" className={inputClass} />
        </div>
        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
            ZIP
          </label>
          <input type="text" name="zip" id="zip" maxLength={10} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
            Business Type *
          </label>
          <select name="business_type" id="business_type" required className={inputClass}>
            <option value="shop">Tire Shop / Retail</option>
            <option value="installer">Installer / Service Center</option>
            <option value="fleet">Fleet Manager</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="estimated_monthly_volume" className="block text-sm font-medium text-gray-700">
            Estimated Monthly Volume
          </label>
          <input
            type="text"
            name="estimated_monthly_volume"
            id="estimated_monthly_volume"
            placeholder="e.g. 50-100 tires/month"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700">
            Tax ID / EIN
          </label>
          <input type="text" name="tax_id" id="tax_id" className={inputClass} />
        </div>
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input type="url" name="website" id="website" placeholder="https://" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Additional Information
        </label>
        <textarea
          name="message"
          id="message"
          rows={4}
          placeholder="Tell us about your business, what brands you typically order, etc."
          className={inputClass}
        />
      </div>

      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Something went wrong. Please try again or call us at (279) 238-8473.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-orange-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
