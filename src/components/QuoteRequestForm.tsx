"use client";

import { useState } from "react";

export default function QuoteRequestForm({
  defaultSize,
  defaultBrand,
  defaultModel,
}: {
  defaultSize?: string;
  defaultBrand?: string;
  defaultModel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone: data.get("phone"),
          subject: "Quote Request",
          message: `QUOTE REQUEST
Tire: ${defaultBrand ? `${defaultBrand} ${defaultModel || ""}` : "Not specified"}
Size: ${data.get("tireSize")}
Quantity: ${data.get("quantity")}
Vehicle: ${data.get("vehicleYear")} ${data.get("vehicleMake")} ${data.get("vehicleModel")}
Shipping ZIP: ${data.get("shippingZip")}
Notes: ${data.get("notes") || "None"}`,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <svg className="mx-auto h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h3 className="mt-3 text-lg font-semibold text-green-800">Quote Requested!</h3>
        <p className="mt-2 text-sm text-green-700">
          We&apos;ll send you a quote within a few hours. Call{" "}
          <a href="tel:+19164767689" className="font-semibold underline">(916) 476-7689</a> for immediate help.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="qname" className="block text-sm font-medium text-gray-700">Name *</label>
          <input type="text" name="name" id="qname" required className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="qphone" className="block text-sm font-medium text-gray-700">Phone *</label>
          <input type="tel" name="phone" id="qphone" required className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
        </div>
      </div>
      <div>
        <label htmlFor="qemail" className="block text-sm font-medium text-gray-700">Email *</label>
        <input type="email" name="email" id="qemail" required className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tireSize" className="block text-sm font-medium text-gray-700">Tire Size *</label>
          <input type="text" name="tireSize" id="tireSize" required defaultValue={defaultSize} placeholder="e.g. 225/65R17" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Qty</label>
          <select name="quantity" id="quantity" defaultValue="4" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="vehicleYear" className="block text-sm font-medium text-gray-700">Year</label>
          <input type="text" name="vehicleYear" id="vehicleYear" placeholder="2024" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="vehicleMake" className="block text-sm font-medium text-gray-700">Make</label>
          <input type="text" name="vehicleMake" id="vehicleMake" placeholder="Toyota" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
        </div>
        <div>
          <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">Model</label>
          <input type="text" name="vehicleModel" id="vehicleModel" placeholder="Camry" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
        </div>
      </div>
      <div>
        <label htmlFor="shippingZip" className="block text-sm font-medium text-gray-700">Shipping ZIP Code *</label>
        <input type="text" name="shippingZip" id="shippingZip" required placeholder="95240" pattern="[0-9]{5}" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
      </div>
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea name="notes" id="notes" rows={2} placeholder="Any special requests..." className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none" />
      </div>

      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          Something went wrong. Please call us at (916) 476-7689.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Request Free Quote"}
      </button>
    </form>
  );
}
