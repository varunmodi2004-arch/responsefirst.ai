import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <p className="font-display text-2xl font-semibold tracking-tight text-ink">
            Response<span className="text-accent">First</span>
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Every homeowner call, answered — even when you&rsquo;re on a roof.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-paper-raised p-8 shadow-sm">
          <p className="mb-6 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Sign in to your dashboard
          </p>

          <LoginForm
            initialError={
              error === "auth_failed"
                ? "That sign-in link didn't work. Request a new one below."
                : undefined
            }
          />
        </div>
      </div>
    </main>
  );
}
