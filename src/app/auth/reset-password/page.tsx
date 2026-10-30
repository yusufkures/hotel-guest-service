
"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Password updated successfully. You can now log in.");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Reset Password</h1>

      <form onSubmit={handleSubmit}>
        <label>New Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
        />

        <label>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 18px" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: 12, width: "100%", cursor: "pointer" }}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
