"use client";

import { useState } from "react";

export default function ContactForm() {
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
          subject: data.get("subject"),
          message: data.get("message"),
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
      <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-green-800">Message Sent!</h3>
        <p className="mt-2 text-sm text-green-700">
          We&apos;ll get back to you within 24 hours. You can also call or text us at{" "}
          <a href="tel:+12792388473" className="font-semibold underline">(279) 238-8473 (TIRE)</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <select
            name="subject"
            id="subject"
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none"
          >
            <option value="quote">Request a Quote</option>
            <option value="sizing">Tire Sizing Help</option>
            <option value="shipping">Shipping Question</option>
            <option value="order">Order Status</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message *
        </label>
        <textarea
          name="message"
          id="message"
          rows={5}
          required
          placeholder="Tell us what tires you're looking for, your vehicle info, or any questions..."
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white text-gray-900 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-blue focus:ring-2 focus:ring-blue/20 focus:outline-none"
        />
      </div>

      {status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          Something went wrong. Please try again or call or text us at (279) 238-8473 (TIRE).
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-dark disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
