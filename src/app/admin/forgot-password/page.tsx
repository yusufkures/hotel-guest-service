
"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        "https://hotel-guest-service-rho.vercel.app/auth/reset-password",
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "If this email is registered, a password reset link has been sent."
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "80px auto", padding: 24 }}>
      <h1>Forgot Password</h1>

      <p>
        Enter your admin email address to receive a password reset link.
      </p>

      <form onSubmit={handleSubmit}>
        <label>Email Address</label>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            padding: 12,
            margin: "8px 0 18px",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            width: "100%",
            cursor: "pointer",
          }}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </main>
  );
}
