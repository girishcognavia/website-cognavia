"use client";

import StepsTrack from "../StepsTrack";

type Step = { title: string; text: string };

/** MediBook AI: chat, analyze, select, confirm. */
export default function Steps({ steps }: { steps: Step[] }) {
  return <StepsTrack steps={steps} scenes={SCENES} />;
}

const SCENES = [
  // Chat
  () => (
    <div className="mbsc-chat">
      <span className="mbsc-chat__msg">
        <span className="mbsc-chat__typed">I have a fever and a bad cough since Monday</span>
      </span>
      <span className="mbsc-chat__dots">
        <i />
        <i />
        <i />
      </span>
    </div>
  ),
  // Analyze
  () => (
    <div className="mbsc-an">
      <div className="mbsc-an__chips">
        {["Fever", "Cough", "4 days"].map((c, i) => (
          <span key={c} style={{ ["--i" as string]: i }}>
            {c}
          </span>
        ))}
      </div>
      <div className="mbsc-an__arrow" />
      <div className="mbsc-an__result">
        <em>Recommended specialty</em>
        <b>General Medicine</b>
        <span className="mbsc-an__bar">
          <i />
        </span>
        <span className="mbsc-an__pct">93% match</span>
      </div>
    </div>
  ),
  // Select
  () => (
    <div className="mbsc-sel">
      <div className="mbsc-sel__doc">
        <span className="mbsc-sel__av">K</span>
        <span>
          <b>Dr. P. Kapoor</b>
          <em>General Physician</em>
        </span>
      </div>
      <div className="mbsc-sel__slots">
        {["9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "4:00", "4:30"].map((t, i) => (
          <span key={t} className={`${i === 5 ? "is-pick" : ""}${i === 2 || i === 6 ? " is-taken" : ""}`} style={{ ["--i" as string]: i }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  ),
  // Confirm
  () => (
    <div className="mbsc-conf">
      <div className="mbsc-conf__ticket">
        <span className="mbsc-conf__check">✓</span>
        <b>Appointment confirmed</b>
        <em>Dr. P. Kapoor · Today, 11:30 AM</em>
        <span className="mbsc-conf__id">Booking ID · MB-20418</span>
      </div>
      <div className="mbsc-conf__channels">
        {[
          { n: "SMS", d: "+91 98••• ••210" },
          { n: "Email", d: "p•••@mail.com" },
        ].map((c, i) => (
          <span key={c.n} style={{ ["--i" as string]: i }}>
            <b>{c.n}</b>
            <em>{c.d}</em>
            <i>Sent ✓</i>
          </span>
        ))}
      </div>
    </div>
  ),
];
