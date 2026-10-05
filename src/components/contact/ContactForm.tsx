"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { FORM_ENDPOINT, INBOX, INTEREST_OPTIONS } from "./contactData";

type Fields = {
  name: string;
  email: string;
  phone: string;
  company: string;
  city: string;
  interests: string[];
  message: string;
  honey: string; // spam trap: real visitors never see or fill it
};

const EMPTY: Fields = { name: "", email: "", phone: "", company: "", city: "", interests: [], message: "", honey: "" };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f: Fields) {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.name.trim().length < 2) e.name = "Please enter your name.";
  if (!EMAIL_RE.test(f.email.trim())) e.email = "Please enter a valid email address.";
  if (f.phone && !/^[+\d][\d\s()-]{6,}$/.test(f.phone.trim())) e.phone = "Please enter a valid phone number.";
  if (f.city.trim().length < 2) e.city = "Please tell us your city.";
  if (f.message.trim().length < 10) e.message = "Please write a short message.";
  return e;
}

type Status = "idle" | "sending" | "sent" | "error";

export default function ContactForm() {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof Fields, boolean>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // arriving from a product page (/contact?product=slug) pre-selects that product
  useEffect(() => {
    const slug = new URLSearchParams(location.search).get("product");
    if (slug && INTEREST_OPTIONS.some((o) => o.value === slug)) setF((x) => ({ ...x, interests: [slug] }));
  }, []);

  const set = <K extends keyof Fields>(k: K, v: Fields[K]) =>
    setF((x) => {
      const next = { ...x, [k]: v };
      if (touched[k]) setErrors(validate(next));
      return next;
    });
  const blur = (k: keyof Fields) => {
    setTouched((t) => ({ ...t, [k]: true }));
    setErrors(validate(f));
  };
  const toggle = (v: string) => set("interests", f.interests.includes(v) ? f.interests.filter((x) => x !== v) : [...f.interests, v]);
  // a field's error shows once the visitor has left it (or tried to send)
  const err = (k: keyof Fields) => (touched[k] ? errors[k] : undefined);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs = validate(f);
    setErrors(errs);
    setTouched({ name: true, email: true, phone: true, city: true, message: true });
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (f.honey) return setStatus("sent"); // a bot filled the trap: pretend all is well

    setStatus("sending");
    const interests = f.interests.map((v) => INTEREST_OPTIONS.find((o) => o.value === v)?.label ?? v);
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `New enquiry from ${f.name.trim()}${f.company.trim() ? ` (${f.company.trim()})` : ""}`,
          _replyto: f.email.trim(),
          _template: "table",
          _captcha: "false",
          Name: f.name.trim(),
          Email: f.email.trim(),
          Phone: f.phone.trim() || "Not given",
          Company: f.company.trim() || "Not given",
          City: f.city.trim(),
          "Interested in": interests.join(", ") || "Not specified",
          Message: f.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || "Send failed");
      setStatus("sent");
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="cf-done" ref={doneRef} tabIndex={-1} role="status">
        <span className="cf-done__check" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="m6 12.5 4 4 8-9" />
          </svg>
        </span>
        <h2>Thank you, {f.name.trim().split(" ")[0] || "there"}.</h2>
        <p>
          Your message has been sent. We&apos;ll get back to you at <b>{f.email.trim()}</b> soon.
        </p>
        <button
          type="button"
          className="cf-btn cf-btn--ghost"
          onClick={() => {
            setF(EMPTY);
            setTouched({});
            setErrors({});
            setStatus("idle");
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form className="cf" ref={formRef} onSubmit={submit} noValidate>
      <h2 className="cf-title">Send us a message</h2>

      <div className="cf-grid">
        <Field id="cf-name" label="Name" required error={err("name")}>
          <input id="cf-name" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} aria-invalid={!!err("name")} placeholder="Your name" />
        </Field>
        <Field id="cf-email" label="Email" required error={err("email")}>
          <input id="cf-email" type="email" autoComplete="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} aria-invalid={!!err("email")} placeholder="you@company.com" />
        </Field>
        <Field id="cf-phone" label="Phone" error={err("phone")}>
          <input id="cf-phone" type="tel" autoComplete="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => blur("phone")} aria-invalid={!!err("phone")} placeholder="+91" />
        </Field>
        <Field id="cf-company" label="Company">
          <input id="cf-company" autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} placeholder="Company name" />
        </Field>
        <Field id="cf-city" label="City" required error={err("city")} wide>
          <input id="cf-city" autoComplete="address-level2" value={f.city} onChange={(e) => set("city", e.target.value)} onBlur={() => blur("city")} aria-invalid={!!err("city")} placeholder="Your city" />
        </Field>
      </div>

      <fieldset className="cf-set">
        <legend>Interested in</legend>
        <div className="cf-chips">
          {INTEREST_OPTIONS.map((o) => {
            const on = f.interests.includes(o.value);
            return (
              <button key={o.value} type="button" role="checkbox" aria-checked={on} className={`cf-chip${on ? " is-on" : ""}`} onClick={() => toggle(o.value)}>
                {o.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field id="cf-message" label="Message" required error={err("message")} wide>
        <textarea
          id="cf-message"
          rows={5}
          maxLength={2000}
          value={f.message}
          onChange={(e) => set("message", e.target.value)}
          onBlur={() => blur("message")}
          aria-invalid={!!err("message")}
          placeholder="How can we help?"
        />
      </Field>

      {/* spam trap, hidden from people */}
      <label className="cf-honey" aria-hidden>
        Leave this empty
        <input tabIndex={-1} autoComplete="off" value={f.honey} onChange={(e) => set("honey", e.target.value)} />
      </label>

      {status === "error" && (
        <p className="cf-alert" role="alert">
          Sorry, your message couldn&apos;t be sent just now. Please try again, or email us at <a href={`mailto:${INBOX}`}>{INBOX}</a>.
        </p>
      )}

      <div className="cf-actions">
        <p className="cf-req">
          <i>*</i> Required
        </p>
        <button type="submit" className="cf-btn" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <span className="cf-spin" aria-hidden /> Sending…
            </>
          ) : (
            <>
              Send message <span aria-hidden>→</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({ id, label, required, error, wide, children }: { id: string; label: string; required?: boolean; error?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={`cf-field${error ? " has-error" : ""}${wide ? " is-wide" : ""}`}>
      <label htmlFor={id}>
        {label}
        {required && <i aria-hidden> *</i>}
      </label>
      {children}
      {error && <p className="cf-error">{error}</p>}
    </div>
  );
}
