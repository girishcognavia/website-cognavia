"use client";

import { useEffect, useRef, useState } from "react";
import { sleep, useInView, useReducedMotion } from "../hooks";

/**
 * Hero demo: a customer's website with the CognaAssist widget answering visitors live.
 * The site and the conversations are illustrative.
 */
const CONVERSATIONS = [
  {
    q: "Do you ship internationally?",
    a: "Yes. We ship to most countries, and delivery usually takes 5 to 8 business days. Rates are shown at checkout.",
    src: "/shipping",
    t: "0.8s",
  },
  {
    q: "Can I change my plan later?",
    a: "Of course. You can upgrade or downgrade any time from Account → Billing, and the change applies right away.",
    src: "/pricing",
    t: "0.6s",
  },
  {
    q: "Are you open on weekends?",
    a: "We're open Saturdays from 10 am to 4 pm. You can also book a visit online and pick a time that suits you.",
    src: "/contact",
    t: "0.7s",
  },
];

type Msg = { id: number; from: "user" | "bot"; text: string; src?: string; t?: string; done?: boolean };

export default function ChatDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [msgs, setMsgs] = useState<Msg[]>([
    { id: 0, from: "bot", text: "Hi! I'm the assistant for this site. Ask me anything.", done: true },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const turn = useRef(0);
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      const c = CONVERSATIONS[0];
      setMsgs((m) => [
        m[0],
        { id: 1, from: "user", text: c.q, done: true },
        { id: 2, from: "bot", text: c.a, src: c.src, t: c.t, done: true },
      ]);
      return;
    }
    if (!inView) return;
    let off = false;
    (async () => {
      await sleep(700);
      while (!off) {
        const c = CONVERSATIONS[turn.current % CONVERSATIONS.length];
        // the visitor types the question
        for (let k = 1; k <= c.q.length && !off; k++) {
          setDraft(c.q.slice(0, k));
          await sleep(34 + (k % 5) * 6);
        }
        if (off) return;
        await sleep(380);
        if (off) return;
        setDraft("");
        const uid = nextId.current++;
        setMsgs((m) => [...m, { id: uid, from: "user" as const, text: c.q, done: true }].slice(-5));
        await sleep(450);
        if (off) return;
        setTyping(true);
        await sleep(1200);
        if (off) return;
        setTyping(false);
        // the answer streams in, word by word
        const bid = nextId.current++;
        const words = c.a.split(" ");
        setMsgs((m) => [...m, { id: bid, from: "bot" as const, text: "" }].slice(-5));
        for (let w = 1; w <= words.length && !off; w++) {
          const text = words.slice(0, w).join(" ");
          setMsgs((m) => m.map((x) => (x.id === bid ? { ...x, text } : x)));
          await sleep(55);
        }
        if (off) return;
        setMsgs((m) => m.map((x) => (x.id === bid ? { ...x, src: c.src, t: c.t, done: true } : x)));
        turn.current++;
        await sleep(3400);
        if (off) return;
      }
    })();
    return () => {
      off = true;
      setTyping(false);
      setDraft("");
      // drop an exchange cut off mid-way, so it replays cleanly when the demo is back in view
      setMsgs((m) => {
        const r = [...m];
        while (r.length > 1 && (!r[r.length - 1].done || r[r.length - 1].from === "user")) r.pop();
        return r;
      });
    };
  }, [inView, reduced]);

  // keep the newest message in view
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [msgs, typing, reduced]);

  return (
    <div className="cdemo" ref={ref} aria-label="Illustration: the CognaAssist chat widget answering a visitor on a website" role="img">
      <div className="cdemo__browser">
        <div className="cdemo__bar">
          <i />
          <i />
          <i />
          <span className="cdemo__url">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" />
            </svg>
            yourwebsite.com
          </span>
        </div>

        {/* the customer's site, sketched */}
        <div className="cdemo__site" aria-hidden>
          <div className="cdemo__nav">
            <b />
            <span />
            <span />
            <span />
          </div>
          <div className="cdemo__heroblock">
            <i style={{ width: "62%" }} />
            <i style={{ width: "44%" }} />
            <em />
          </div>
          <div className="cdemo__tiles">
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* the widget */}
        <div className="cdemo__widget">
          <div className="cdemo__head">
            <span className="cdemo__avatar" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3.5V16h0A2 2 0 0 1 5 14z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="9.5" cy="10" r="1" fill="currentColor" />
                <circle cx="14.5" cy="10" r="1" fill="currentColor" />
              </svg>
            </span>
            <div>
              <strong>CognaAssist</strong>
              <span className="cdemo__status">
                <i /> Online · replies instantly
              </span>
            </div>
          </div>

          <div className="cdemo__msgs" ref={scroller}>
            {msgs.map((m) => (
              <div key={m.id} className={`cdemo__msg cdemo__msg--${m.from}${m.done ? " is-done" : ""}`}>
                <p>{m.text}</p>
                {m.from === "bot" && m.src && (
                  <span className="cdemo__src">
                    <svg viewBox="0 0 24 24" aria-hidden>
                      <path d="M7 3.5h7l4 4V20.5H7z M14 3.5v4h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    </svg>
                    Answered from {m.src} · {m.t}
                  </span>
                )}
              </div>
            ))}
            {typing && (
              <div className="cdemo__msg cdemo__msg--bot cdemo__typing">
                <i />
                <i />
                <i />
              </div>
            )}
          </div>

          <div className="cdemo__input">
            <span className={draft ? "" : "is-empty"}>{draft || "Type your question…"}</span>
            {draft && <i className="cdemo__caret" />}
            <b aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}
