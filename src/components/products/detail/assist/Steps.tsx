"use client";

import StepsTrack from "../StepsTrack";

type Step = { title: string; text: string };

/** CognaAssist: register, crawl, train, integrate, serve. */
export default function Steps({ steps }: { steps: Step[] }) {
  return <StepsTrack steps={steps} scenes={SCENES} />;
}

const SCENES = [
  // Register
  () => (
    <div className="sc-reg">
      <label>
        <span>Company</span>
        <em className="sc-type" style={{ ["--w" as string]: "11ch" }}>
          Your Company
        </em>
      </label>
      <label>
        <span>Website URL</span>
        <em className="sc-type sc-type--late" style={{ ["--w" as string]: "23ch" }}>
          https://yourwebsite.com
        </em>
      </label>
      <b className="sc-reg__btn">Create workspace</b>
    </div>
  ),
  // Crawl
  () => (
    <div className="sc-crawl">
      <span className="sc-crawl__root">yourwebsite.com</span>
      <div className="sc-crawl__tree">
        {["/about", "/pricing", "/faq", "/shipping", "/contact", "/blog"].map((p, i) => (
          <span key={p} style={{ ["--i" as string]: i }}>
            {p}
          </span>
        ))}
      </div>
    </div>
  ),
  // Train
  () => (
    <div className="sc-train">
      <div className="sc-train__chunks">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i }}>
            <i />
            <i />
          </span>
        ))}
      </div>
      <div className="sc-train__arrow" />
      <div className="sc-train__kb">
        {Array.from({ length: 48 }, (_, i) => (
          <i key={i} style={{ ["--i" as string]: (i * 7) % 48 }} />
        ))}
        <span>Knowledge base</span>
      </div>
    </div>
  ),
  // Integrate
  () => (
    <div className="sc-int">
      <div className="sc-int__code">
        {[30, 54, 40, 0, 0, 22].map((w, i) =>
          w ? <i key={i} style={{ width: `${w}%` }} /> : <i key={i} className="is-added" />,
        )}
      </div>
      <span className="sc-int__badge">+ 2 lines</span>
    </div>
  ),
  // Serve
  () => (
    <div className="sc-serve">
      <span className="sc-serve__q">How do I track my order?</span>
      <span className="sc-serve__a">
        <i />
        <i />
      </span>
      <span className="sc-serve__q sc-serve__q--2">Do you have a store nearby?</span>
      <span className="sc-serve__a sc-serve__a--2">
        <i />
        <i />
      </span>
      <b className="sc-serve__badge">24/7</b>
    </div>
  ),
];
