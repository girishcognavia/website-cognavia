"use client";

import type { AboutParagraph } from "@/content/about";
import KeyText from "./KeyText";
import { AgentBoundary } from "./visuals";
import { setAgentMode } from "./visuals/AgentBoundary";

/** How we work: the three paragraphs beside the governed-agent scene they drive. */
export default function HowWeWork({ title, paragraphs }: { title: string; paragraphs: AboutParagraph[] }) {
  // hovering / focusing a paragraph changes what the agent scene shows
  const focus = (i: number) => () => setAgentMode((i + 1) as 1 | 2 | 3);
  const blur = () => setAgentMode(0);

  return (
    <section className="about-how" data-fx aria-labelledby="how-we-work">
      <div className="about-how__grid">
        <div>
          <h2 id="how-we-work" className="about-block__headline spot" data-fx>
            {title}
          </h2>
          <div className="about-how__list" onMouseLeave={blur}>
            {paragraphs.map((p, i) => (
              <p
                key={p.text}
                className="principle"
                tabIndex={0}
                onMouseEnter={focus(i)}
                onMouseLeave={blur}
                onFocus={focus(i)}
                onBlur={blur}
              >
                <KeyText text={p.text} keys={p.keys} />
              </p>
            ))}
          </div>
        </div>
        <div className="about-how__visual">
          <AgentBoundary />
        </div>
      </div>
    </section>
  );
}
