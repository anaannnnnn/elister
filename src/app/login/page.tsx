"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Alert, Button, Card, Field, Input } from "@/ui/kit";

export default function LoginPage() {
  const [step, setStep] = useState<"credentials" | "totp">("credentials");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const done = () => { router.push("/dashboard"); router.refresh(); };

  async function onCredentials(fd: FormData) {
    setBusy(true); setError("");
    const res = await authClient.signIn.email({ email: String(fd.get("email")), password: String(fd.get("password")) });
    setBusy(false);
    if (res.error) return setError(res.error.message ?? "Sign-in failed");
    if ((res.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) return setStep("totp");
    done();
  }
  async function onTotp(fd: FormData) {
    setBusy(true); setError("");
    const res = await authClient.twoFactor.verifyTotp({ code: String(fd.get("code")) });
    setBusy(false);
    if (res.error) return setError(res.error.message ?? "Invalid code");
    done();
  }

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 grid size-11 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-fg">+</div>
          <h1 className="text-xl font-semibold">UAE Healthcare OS</h1>
          <p className="text-sm text-muted">Synthetic demo environment</p>
        </div>
        <Card>
          {error && <div className="mb-3"><Alert>{error}</Alert></div>}
          {step === "credentials" ? (
            <form action={onCredentials} className="space-y-3">
              <Field label="Email"><Input name="email" type="email" required autoComplete="username" /></Field>
              <Field label="Password"><Input name="password" type="password" required autoComplete="current-password" /></Field>
              <Button className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
            </form>
          ) : (
            <form action={onTotp} className="space-y-3">
              <Field label="Authenticator code"><Input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" /></Field>
              <Button className="w-full" disabled={busy}>Verify</Button>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
