
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("Verifying reset link...");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifyResetLink() {
      const supabase = createSupabaseBrowserClient();
      const code = searchParams.get("code");
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const hash = window.location.hash;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!active) return;

        if (error) {
          setMessage("This reset link is invalid or expired. Please request a new one.");
          return;
        }
      } else if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });

        if (!active) return;

        if (error) {
          setMessage("This reset link is invalid or expired. Please request a new one.");
          return;
        }
      } else if (hash.includes("access_token=")) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const hashType = params.get("type");

        if (hashType !== "recovery" || !accessToken || !refreshToken) {
          setMessage("This reset link is invalid or expired. Please request a new one.");
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (!active) return;

        if (error) {
          setMessage("Could not verify the reset link. Please request a new one.");
          return;
        }
      } else {
        setMessage("Reset link information is missing. Please request a new reset email.");
        return;
      }

      if (active) {
        setVerified(true);
        setMessage("Link verified. You can set your new password.");
      }
    }

    verifyResetLink();

    return () => {
      active = false;
    };
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (!verified) {
      setMessage("Please verify your reset link first.");
      return;
    }

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

      <p>{message}</p>

      {verified && (
        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              margin: "8px 0 18px",
            }}
          />

          <label>Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
            style={{ padding: 12, width: "100%", cursor: "pointer" }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      )}

      {message === "Password updated successfully. You can now log in." && (
        <button
          type="button"
          onClick={() => router.push("/admin/login")}
          style={{ padding: 12, marginTop: 16, cursor: "pointer" }}
        >
          Go to Login
        </button>
      )}
    </main>
  );
}
