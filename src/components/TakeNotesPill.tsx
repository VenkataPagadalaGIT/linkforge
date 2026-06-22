"use client";
import * as React from "react";
import axios from "axios";
import { Notebook, X, Lock, LogOut, CheckCircle2, Loader2 } from "lucide-react";
import { BACKEND_URL } from "@/lib/site";
import { adminApi, getToken, saveToken, clearToken } from "@/lib/admin-client";

/**
 * Floating pill bottom-right. Click → if logged in, shows a status panel;
 * if not, opens an inline login modal. After login, dispatches a window event
 * `notebook-auth-changed` so editors can re-render unlocked.
 */
const TakeNotesPill: React.FC = () => {
  const [status, setStatus] = React.useState<"checking" | "authed" | "anon">("checking");
  const [email, setEmail] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  // Initial auth check
  const refresh = React.useCallback(async () => {
    if (!getToken()) {
      setStatus("anon"); setEmail(null);
      return;
    }
    try {
      const { data } = await adminApi.get<{ email: string }>("/auth/me");
      setStatus("authed");
      setEmail(data.email);
    } catch {
      clearToken();
      setStatus("anon"); setEmail(null);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("notebook-auth-changed", onChange);
    return () => window.removeEventListener("notebook-auth-changed", onChange);
  }, [refresh]);

  const broadcast = () => {
    window.dispatchEvent(new CustomEvent("notebook-auth-changed"));
  };

  const onSignOut = () => {
    clearToken();
    setStatus("anon");
    setEmail(null);
    setOpen(false);
    broadcast();
  };

  if (status === "checking") return null;

  return (
    <>
      {/* Pill */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-[60] inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border px-4 py-3 backdrop-blur transition-all ${
          status === "authed"
            ? "border-emerald-400/50 text-emerald-300/95 bg-emerald-400/[0.06] hover:bg-emerald-400/[0.12]"
            : "border-foreground/40 text-foreground/95 bg-background/85 hover:border-foreground/70 hover:bg-foreground/[0.05]"
        }`}
        data-testid="take-notes-pill"
        aria-label={status === "authed" ? "Account" : "Sign in to take notes"}
      >
        {status === "authed" ? (
          <>
            <CheckCircle2 size={12} /> Notes Unlocked
          </>
        ) : (
          <>
            <Notebook size={12} /> Take Notes
          </>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[70] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          data-testid="take-notes-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md border border-foreground/30 bg-background p-6 sm:p-7 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground/50 hover:text-foreground transition-colors"
              aria-label="Close"
              data-testid="take-notes-modal-close"
            >
              <X size={14} />
            </button>

            {status === "authed" ? (
              <SignedInPanel email={email} onSignOut={onSignOut} />
            ) : (
              <LoginInlinePanel
                onSuccess={() => {
                  setOpen(false);
                  refresh();
                  broadcast();
                }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};

const SignedInPanel = ({ email, onSignOut }: { email: string | null; onSignOut: () => void }) => (
  <div data-testid="take-notes-signed-in">
    <div className="flex items-center gap-2 mb-3">
      <CheckCircle2 size={12} className="text-emerald-300/90" />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
        Notes unlocked
      </p>
    </div>
    <h3 className="font-display text-2xl font-bold text-foreground mb-2">
      You&apos;re signed in
    </h3>
    <p className="font-mono text-xs text-muted-foreground/85 mb-5 leading-relaxed">
      {email ? <>as <span className="text-foreground/90">{email}</span>.</> : null} You can now write
      notes on any session — saves automatically. Toggle <span className="text-emerald-300/90">Public</span> to
      publish on the speaker&apos;s profile.
    </p>
    <button
      onClick={onSignOut}
      className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] border border-border text-muted-foreground/80 px-3 py-2 hover:border-foreground/40 hover:text-foreground transition-colors"
      data-testid="take-notes-sign-out"
    >
      <LogOut size={11} /> Sign out
    </button>
  </div>
);

const LoginInlinePanel = ({ onSuccess }: { onSuccess: () => void }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const { data } = await axios.post<{ access_token: string }>(
        `${BACKEND_URL}/api/auth/login`,
        { email: email.trim().toLowerCase(), password },
      );
      saveToken(data.access_token);
      onSuccess();
    } catch (error) {
      const msg =
        axios.isAxiosError(error) && error.response?.status === 401
          ? "Wrong email or password."
          : "Sign-in failed. Try again.";
      setErr(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} data-testid="take-notes-login">
      <div className="flex items-center gap-2 mb-3">
        <Lock size={12} className="text-muted-foreground/50" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          Take notes
        </p>
      </div>
      <h3 className="font-display text-2xl font-bold text-foreground mb-2">Sign in</h3>
      <p className="font-mono text-xs text-muted-foreground/80 mb-5 leading-relaxed">
        One-time login — stays unlocked across reloads. Notes save to your private notebook (toggle
        Public when ready to publish).
      </p>

      <label className="block mb-3">
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">
          Email
        </span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground/90 focus:outline-none focus:border-foreground/40"
          data-testid="take-notes-email"
        />
      </label>

      <label className="block mb-4">
        <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">
          Password
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-background border border-border px-3 py-2.5 font-mono text-xs text-foreground/90 focus:outline-none focus:border-foreground/40"
          data-testid="take-notes-password"
        />
      </label>

      {err && (
        <p className="font-mono text-[11px] text-rose-300/95 mb-3" data-testid="take-notes-error">
          {err}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] border border-foreground/40 bg-foreground/[0.03] text-foreground px-4 py-2.5 hover:border-foreground/70 hover:bg-foreground/[0.07] transition-all disabled:opacity-50"
        data-testid="take-notes-submit"
      >
        {busy ? <Loader2 size={11} className="animate-spin" /> : <Notebook size={11} />}
        {busy ? "Signing in…" : "Unlock notes"}
      </button>
    </form>
  );
};

export default TakeNotesPill;
