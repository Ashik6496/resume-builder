"use client";

import { useState, type FormEvent } from "react";

type AuthFormProps = {
  onAuthenticated: (user: { email: string }) => void;
};

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = (await response.json()) as {
        user?: { email: string };
        error?: string;
      };

      if (!response.ok || !result.user) {
        setError(result.error || "Unable to authenticate.");
        return;
      }
      onAuthenticated(result.user);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-topline">
          <a className="brand auth-brand" href="#top" aria-label="Folio home">
            <span className="brand-mark">f.</span>
            <span>folio<span className="brand-period">.</span></span>
          </a>
          <span className="auth-private-label"><span /> PRIVATE WORKSPACE</span>
        </div>

        <div className="auth-intro">
          <p className="eyebrow">{mode === "login" ? "YOUR NEXT CHAPTER" : "A GOOD PLACE TO BEGIN"}</p>
          <h1 id="auth-heading">{mode === "login" ? "Welcome back." : "Make it official."}</h1>
          <p className="auth-subtitle">{mode === "login" ? "Pick up where you left off." : "Create an account to start building."}</p>
        </div>

        <div className="auth-mode-switch" role="tablist" aria-label="Account action">
          <button
            aria-selected={mode === "login"}
            className={mode === "login" ? "auth-mode active" : "auth-mode"}
            onClick={() => { setMode("login"); setError(""); }}
            role="tab"
            type="button"
          >Sign in</button>
          <button
            aria-selected={mode === "register"}
            className={mode === "register" ? "auth-mode active" : "auth-mode"}
            onClick={() => { setMode("register"); setError(""); }}
            role="tab"
            type="button"
          >Create account</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email address</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="field">
            <span className="password-label">
              Password
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >{showPassword ? "Hide" : "Show"}</button>
            </span>
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
              minLength={mode === "register" ? 8 : 1}
              required
            />
          </label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" disabled={submitting} type="submit">
            {submitting ? "Please wait…" : mode === "login" ? "Sign in to Folio" : "Create your account"}
          </button>
        </form>

        <p className="auth-footnote"><span aria-hidden="true">●</span> Your account and resumes stay private to you.</p>
      </section>
      <aside className="auth-aside" aria-label="Resume preview">
        <div className="showcase-topline"><span>FOLIO / STUDIO</span><span>01 — 04</span></div>
        <div className="showcase-copy">
          <p className="eyebrow">A FRESH PAGE</p>
          <h2>Make room<br />for what&apos;s next.</h2>
        </div>
        <article className="showcase-resume">
          <header>
            <span>CURRICULUM VITAE</span>
            <h3>Alex Morgan</h3>
            <p>Product designer</p>
          </header>
          <section>
            <h4>Experience</h4>
            <div className="showcase-line showcase-line-long" />
            <div className="showcase-line" />
            <div className="showcase-line showcase-line-short" />
          </section>
          <section>
            <h4>Selected strengths</h4>
            <div className="showcase-skills"><span>Strategy</span><span>Research</span><span>Design</span></div>
          </section>
          <footer><span>ALEX MORGAN</span><span>FOLIO · 01</span></footer>
        </article>
        <p className="showcase-caption">A thoughtful first impression starts here.</p>
      </aside>
    </main>
  );
}
