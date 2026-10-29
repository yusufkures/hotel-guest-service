
"use client";

import { useState } from "react";

type Service = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
};

export default function ServiceEditor({
  services,
}: {
  services: Service[];
}) {
  const [items, setItems] = useState(services);
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  function updateItem(
    id: string,
    field: keyof Service,
    value: string | number | boolean | null
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  async function saveItem(item: Service) {
    setSavingId(item.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          title: item.title,
          description: item.description,
          image_url: item.image_url ?? "",
          display_order: item.display_order,
          is_active: item.is_active,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save service.");
      }

      setMessage(`Saved: ${item.title}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "An unexpected error occurred."
      );
    } finally {
      setSavingId("");
    }
  }

  return (
    <div className="mt-8 space-y-5">
      {items.map((item) => (
        <section
          key={item.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Service title
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal"
                value={item.title}
                onChange={(e) =>
                  updateItem(item.id, "title", e.target.value)
                }
              />
            </label>

            <label className="block text-sm font-medium">
              Display order
              <input
                type="number"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal"
                value={item.display_order}
                onChange={(e) =>
                  updateItem(item.id, "display_order", Number(e.target.value))
                }
              />
            </label>

            <label className="block text-sm font-medium sm:col-span-2">
              Description
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal"
                value={item.description}
                onChange={(e) =>
                  updateItem(item.id, "description", e.target.value)
                }
              />
            </label>

            <label className="block text-sm font-medium sm:col-span-2">
              Image URL (HTTPS)
              <input
                type="url"
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 font-normal"
                value={item.image_url ?? ""}
                onChange={(e) =>
                  updateItem(item.id, "image_url", e.target.value || null)
                }
              />
            </label>
          </div>

          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.title}
              className="mt-4 h-36 w-full rounded-xl object-cover sm:w-64"
            />
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.is_active}
                onChange={(e) =>
                  updateItem(item.id, "is_active", e.target.checked)
                }
              />
              Show this service
            </label>

            <button
              type="button"
              disabled={savingId !== ""}
              onClick={() => saveItem(item)}
              className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {savingId === item.id ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </section>
      ))}

      {message && (
        <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm">
          {message}
        </p>
      )}
    </div>
  );
}
