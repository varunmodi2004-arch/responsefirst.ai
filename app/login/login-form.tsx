"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/components/ui/Button";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(initialError);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const supabase = createClient();

  async function handleGoogleSignIn() {
    setError(undefined);
    setGoogleLoading(true);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    console.log("OAuth data:", data);
    console.log("OAuth error:", error);

    if (error) {
      setError("Google sign-in didn't start. Try again.");
      setGoogleLoading(false);
    }
    // On success the browser is redirected to Google, so there's no
    // further state to set here — the tab is navigating away.
  }

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setLinkLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLinkLoading(false);

    if (error) {
      setError("Couldn't send that link. Check the email address and try again.");
      return;
    }

    setLinkSent(true);
  }

  if (linkSent) {
    return (
      <div className="animate-fade-up text-center">
        <p className="text-sm text-ink">
          Check <span className="font-medium">{email}</span> for a sign-in
          link.
        </p>
        <button
          type="button"
          onClick={() => setLinkSent(false)}
          className="mt-4 text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-hover">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-line bg-paper-raised px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper disabled:opacity-60"
      >
        <GoogleMark />
        {googleLoading ? "Redirecting…" : "Continue with Google"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-ink-muted">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={handleMagicLink} className="space-y-3">
        <label htmlFor="email" className="sr-only">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-lg border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-slate focus:outline-none focus:ring-2 focus:ring-slate/20"
        />
        <button
          type="submit"
          disabled={linkLoading}
          className={buttonClasses({ fullWidth: true })}
        >
          {linkLoading ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.5-6.5C35.2 2.6 30 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.6 5.9C12.1 13.1 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.6c-.5 3-2.2 5.4-4.6 7.1l7.2 5.6c4.2-3.9 6.7-9.6 6.7-17z"
      />
      <path
        fill="#FBBC05"
        d="M10.2 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.6-5.9C1 16.8 0 20.3 0 24s1 7.2 2.6 10.5z"
      />
      <path
        fill="#34A853"
        d="M24 48c6 0 11.2-2 14.9-5.4l-7.2-5.6c-2 1.4-4.6 2.2-7.7 2.2-6.4 0-11.9-3.6-13.8-8.6l-7.6 5.9C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
