"use client";

import { useState } from "react";

const options = [
  { code: "CLEAN_ROOM", label: "Clean My Room", kind: "housekeeping" },
  { code: "DO_NOT_DISTURB", label: "Do Not Disturb", kind: "housekeeping" },
  { code: "TV_ISSUE", label: "TV not working", kind: "maintenance" },
  { code: "WIFI_ISSUE", label: "Wi-Fi / Internet issue", kind: "maintenance" },
  { code: "AC_ISSUE", label: "Air conditioning issue", kind: "maintenance" },
  { code: "ELECTRICAL_ISSUE", label: "Lighting / electrical issue", kind: "maintenance" },
  { code: "PLUMBING_ISSUE", label: "Bathroom / plumbing issue", kind: "maintenance" },
  { code: "OTHER_MAINTENANCE", label: "Other maintenance issue", kind: "maintenance" },
  { code: "GENERAL_REQUEST", label: "General request", kind: "general" },
  { code: "COMPLAINT", label: "Complaint", kind: "general" },
] as const;

export default function GuestRequestForm({ token }: { token: string }) {
  const [category, setCategory] = useState<string>("CLEAN_ROOM");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage(""); setReference("");
    const selected = options.find((o) => o.code === category);
    if (!selected) { setBusy(false); return; }
    try {
      const response = await fetch("/api/guest-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, categoryCode: selected.code, description }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not submit your request.");
      setReference(result.referenceCode);
      setMessage("Your request has been sent to our team.");
      setDescription("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please contact the Front Office.");
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-xl p-4 sm:p-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Guest Services</p>
        <h1 className="mt-2 text-2xl font-semibold">How can we help?</h1>
        <p className="mt-2 text-sm text-slate-600">Choose a service or tell us what you need. Our team will receive your request.</p>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Select a service</span>
            <select className="w-full rounded-xl border border-slate-300 bg-white p-3" value={category} onChange={(e) => setCategory(e.target.value)}>
              <optgroup label="Housekeeping">
                {options.filter((o) => o.kind === "housekeeping").map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </optgroup>
              <optgroup label="Maintenance">
                {options.filter((o) => o.kind === "maintenance").map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </optgroup>
              <optgroup label="Other">
                {options.filter((o) => o.kind === "general").map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
              </optgroup>
            </select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Details (optional for standard services)</span>
            <textarea className="min-h-28 w-full rounded-xl border border-slate-300 p-3" maxLength={1500} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please describe the issue or request..." />
          </label>
          <button disabled={busy} className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-50">{busy ? "Sending..." : "Submit request"}</button>
        </form>
        {message && <div role="status" className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">{message}{reference && <p className="mt-2 font-semibold">Reference: {reference}</p>}</div>}
        <p className="mt-6 text-xs text-slate-500">For urgent assistance, please contact the Front Office directly.</p>
      </section>
    </main>
  );
}
