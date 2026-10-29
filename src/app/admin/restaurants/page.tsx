
"use client";

import { useEffect, useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
};

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadRestaurants() {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/restaurants", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage("Failed to load restaurants: " + result.error);
        return;
      }

      setRestaurants(result.restaurants ?? []);
      setMessage("");
    } catch {
      setMessage("Unable to connect to the restaurant list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRestaurants();
  }, []);

  async function addRestaurant(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          cover_image_url: coverImageUrl.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage("Failed to add restaurant: " + result.error);
        return;
      }

      setName("");
      setDescription("");
      setCoverImageUrl("");
      setMessage("Restaurant added successfully.");

      await loadRestaurants();
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteRestaurant(restaurant: Restaurant) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${restaurant.name}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(restaurant.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/restaurants?id=${encodeURIComponent(restaurant.id)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        setMessage("Failed to delete restaurant: " + result.error);
        return;
      }

      setRestaurants((current) =>
        current.filter((item) => item.id !== restaurant.id)
      );

      setMessage(`"${restaurant.name}" was deleted successfully.`);
    } catch {
      setMessage("Unable to connect to the server while deleting the restaurant.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-bold">Restaurants & Menus</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage restaurants and their menu information.
        </p>
      </header>

      {message && (
        <p className="rounded border p-3 text-sm" role="status">
          {message}
        </p>
      )}

      <section className="rounded-xl border p-5">
        <h2 className="mb-4 text-lg font-semibold">
          Add New Restaurant
        </h2>

        <form onSubmit={addRestaurant} className="space-y-4">
          <div>
            <label
              htmlFor="restaurant-name"
              className="mb-1 block text-sm font-medium"
            >
              Restaurant Name *
            </label>
            <input
              id="restaurant-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={150}
              className="w-full rounded-lg border p-3"
              placeholder="e.g. Italian Restaurant"
            />
          </div>

          <div>
            <label
              htmlFor="restaurant-description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="restaurant-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-lg border p-3"
              placeholder="Enter a short description"
            />
          </div>

          <div>
            <label
              htmlFor="restaurant-image"
              className="mb-1 block text-sm font-medium"
            >
              Cover Image URL
            </label>
            <input
              id="restaurant-image"
              type="url"
              value={coverImageUrl}
              onChange={(event) => setCoverImageUrl(event.target.value)}
              className="w-full rounded-lg border p-3"
              placeholder="https://..."
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-3 text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Add Restaurant"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Existing Restaurants
          </h2>

          <button
            type="button"
            onClick={() => void loadRestaurants()}
            disabled={loading}
            className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>Loading restaurants...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-sm text-gray-500">
            No restaurants found. Add your first restaurant above.
          </p>
        ) : (
          <div className="space-y-3">
            {restaurants.map((restaurant) => (
              <article
                key={restaurant.id}
                className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold">
                    {restaurant.name}
                  </h3>

                  <p className="mt-1 text-sm text-gray-600">
                    {restaurant.description || "No description provided."}
                  </p>

                  {restaurant.cover_image_url && (
                    <a
                      href={restaurant.cover_image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-sm text-blue-600 underline"
                    >
                      View Cover Image
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void deleteRestaurant(restaurant)}
                  disabled={deletingId === restaurant.id}
                  className="shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-50"
                >
                  {deletingId === restaurant.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
