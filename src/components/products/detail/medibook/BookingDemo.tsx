"use client";

import { useEffect, useRef, useState } from "react";
import { sleep, useInView, useReducedMotion } from "../hooks";

/**
 * Hero demo: a patient describes symptoms in plain language (Hindi, then English), MediBook AI
 * recommends a specialty, offers doctors and slots, and confirms the booking by SMS and Email.
 * Patients, doctors and times are illustrative.
 */
type Item =
  | { id: number; kind: "user" | "bot"; text: string; done?: boolean }
  | { id: number; kind: "analysis"; specialty: string; sub: string; match: number }
  | { id: number; kind: "doctors"; docs: { name: string; role: string; slots: string[] }[]; pick?: string }
  | { id: number; kind: "confirm"; title: string; when: string; note: string };

const SCRIPTS = [
  {
    lang: "हिंदी",
    symptom: "मुझे 3 दिन से त्वचा पर खुजली और लाल चकत्ते हैं",
    reply: "समझ गया। आपके लक्षणों के आधार पर:",
    specialty: "Dermatology",
    sub: "त्वचा रोग विशेषज्ञ",
    match: 94,
    docs: [
      { name: "Dr. A. Sharma", role: "Dermatologist", slots: ["कल 10:30", "कल 4:00"] },
      { name: "Dr. R. Iyer", role: "Dermatologist", slots: ["आज 6:15"] },
    ],
    pick: "कल 10:30",
    confirm: { title: "अपॉइंटमेंट पक्का", when: "Dr. A. Sharma · कल 10:30", note: "SMS और Email भेज दिया गया" },
  },
  {
    lang: "English",
    symptom: "My knee has hurt for a week, worse on the stairs",
    reply: "Thanks. Based on your symptoms:",
    specialty: "Orthopedics",
    sub: "Bone & joint specialist",
    match: 92,
    docs: [
      { name: "Dr. N. Rao", role: "Orthopedic surgeon", slots: ["Today 5:30 PM", "Tomorrow 11:00"] },
      { name: "Dr. S. Menon", role: "Orthopedics", slots: ["Tomorrow 3:00 PM"] },
    ],
    pick: "Today 5:30 PM",
    confirm: { title: "Appointment confirmed", when: "Dr. N. Rao · Today 5:30 PM", note: "Sent via SMS and Email" },
  },
];

export default function BookingDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [lang, setLang] = useState(SCRIPTS[0].lang);
  const nextId = useRef(1);
  const turn = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = () => nextId.current++;
    if (reduced) {
      const s = SCRIPTS[1];
      setLang(s.lang);
      setItems([
        { id: id(), kind: "user", text: s.symptom, done: true },
        { id: id(), kind: "analysis", specialty: s.specialty, sub: s.sub, match: s.match },
        { id: id(), kind: "confirm", ...s.confirm },
      ]);
      return;
    }
    if (!inView) return;
    let off = false;
    const push = (it: Item) => setItems((xs) => [...xs, it].slice(-6));
    (async () => {
      await sleep(500);
      while (!off) {
        const s = SCRIPTS[turn.current % SCRIPTS.length];
        setLang(s.lang);
        setItems([]);
        await sleep(400);
        // the patient types their symptoms
        const chars = Array.from(s.symptom);
        for (let k = 1; k <= chars.length && !off; k++) {
          setDraft(chars.slice(0, k).join(""));
          await sleep(30);
        }
        if (off) return;
        await sleep(350);
        setDraft("");
        push({ id: id(), kind: "user", text: s.symptom, done: true });
        await sleep(400);
        if (off) return;
        setTyping(true);
        await sleep(1100);
        if (off) return;
        setTyping(false);
        push({ id: id(), kind: "bot", text: s.reply, done: true });
        await sleep(500);
        if (off) return;
        push({ id: id(), kind: "analysis", specialty: s.specialty, sub: s.sub, match: s.match });
        await sleep(1300);
        if (off) return;
        const did = id();
        push({ id: did, kind: "doctors", docs: s.docs });
        await sleep(1700);
        if (off) return;
        setItems((xs) => xs.map((x) => (x.id === did && x.kind === "doctors" ? { ...x, pick: s.pick } : x)));
        await sleep(600);
        if (off) return;
        push({ id: id(), kind: "user", text: s.pick, done: true });
        await sleep(700);
        if (off) return;
        push({ id: id(), kind: "confirm", ...s.confirm });
        turn.current++;
        await sleep(4200);
      }
    })();
    return () => {
      off = true;
      setTyping(false);
      setDraft("");
    };
  }, [inView, reduced]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [items, typing, reduced]);

  return (
    <div className="mbdemo" ref={ref} role="img" aria-label="Illustration: a patient booking a specialist appointment with MediBook AI in Hindi and English">
      <div className="mbdemo__phone">
        <div className="mbdemo__notch" />
        <div className="mbdemo__head">
          <span className="mbdemo__avatar" aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z" fill="currentColor" />
            </svg>
          </span>
          <span className="mbdemo__who">
            <b>MediBook AI</b>
            <em>
              <i /> Online · 24/7
            </em>
          </span>
          <span className="mbdemo__lang">{lang}</span>
        </div>

        <div className="mbdemo__chat" ref={scroller}>
          {items.map((it) => {
            if (it.kind === "user" || it.kind === "bot")
              return (
                <div key={it.id} className={`mbdemo__msg mbdemo__msg--${it.kind}`}>
                  <p>{it.text}</p>
                  {it.kind === "user" && <span className="mbdemo__ticks">✓✓</span>}
                </div>
              );
            if (it.kind === "analysis")
              return (
                <div key={it.id} className="mbdemo__card mbdemo__analysis">
                  <span className="mbdemo__card-label">Recommended specialty</span>
                  <b>{it.specialty}</b>
                  <em>{it.sub}</em>
                  <span className="mbdemo__match">
                    <i>
                      <i style={{ ["--m" as string]: `${it.match}%` }} />
                    </i>
                    {it.match}% match
                  </span>
                </div>
              );
            if (it.kind === "doctors")
              return (
                <div key={it.id} className="mbdemo__card mbdemo__docs">
                  {it.docs.map((d) => (
                    <div key={d.name} className="mbdemo__doc">
                      <span className="mbdemo__doc-av">{d.name.split(" ")[1][0]}</span>
                      <span className="mbdemo__doc-name">
                        <b>{d.name}</b>
                        <em>{d.role}</em>
                      </span>
                      <span className="mbdemo__slots">
                        {d.slots.map((sl) => (
                          <i key={sl} className={it.pick === sl ? "is-pick" : ""}>
                            {sl}
                          </i>
                        ))}
                      </span>
                    </div>
                  ))}
                </div>
              );
            if (it.kind !== "confirm") return null;
            return (
              <div key={it.id} className="mbdemo__card mbdemo__confirm">
                <span className="mbdemo__check">✓</span>
                <b>{it.title}</b>
                <em>{it.when}</em>
                <span className="mbdemo__sent">
                  <i>SMS</i>
                  <i>Email</i>
                  {it.note}
                </span>
              </div>
            );
          })}
          {typing && (
            <div className="mbdemo__msg mbdemo__msg--bot mbdemo__typing">
              <i />
              <i />
              <i />
            </div>
          )}
        </div>

        <div className="mbdemo__input">
          <span className={draft ? "" : "is-empty"}>{draft || "Describe your symptoms…"}</span>
          {draft && <i className="cdemo__caret" />}
          <b aria-hidden>
            <svg viewBox="0 0 24 24">
              <path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </b>
        </div>
      </div>

      {/* floating notes beside the phone */}
      <span className="mbdemo__note mbdemo__note--a">
        <i /> Symptoms understood
      </span>
      <span className="mbdemo__note mbdemo__note--b">
        <i /> Hindi · English
      </span>
    </div>
  );
}
