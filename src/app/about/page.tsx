import type { Metadata } from "next";
import { ABOUT, aboutPlainText } from "@/content/about";
import { Breadcrumbs, JsonLd, PageShell } from "@/components/page/PageBits";
import AboutVisual from "@/components/about-page/AboutVisual";
import AboutFx from "@/components/about-page/AboutFx";
import KeyText from "@/components/about-page/KeyText";
import HowWeWork from "@/components/about-page/HowWeWork";
import { FutureSite, ToolsToSystem } from "@/components/about-page/visuals";
import { OG_IMAGE, SITE } from "@/lib/site";

const DESCRIPTION = ABOUT.whatWeDo.lead!;

export const metadata: Metadata = {
  title: "About us — Cognavia.ai",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: { title: "About us — Cognavia.ai", description: DESCRIPTION, url: "/about", images: [OG_IMAGE] },
};

export default function AboutPage() {
  const { whatWeDo, whyWeStarted, whereThisGoes, howWeWork } = ABOUT;
  const scenes = [
    { section: whyWeStarted, visual: <ToolsToSystem /> },
    { section: whereThisGoes, visual: <FutureSite /> },
  ];

  return (
    <PageShell>
      {/* What we do — with the interactive android beside it */}
      <header className="about-hero">
        <div className="about-hero__text">
          <Breadcrumbs trail={[{ label: "About us", href: "/about" }]} />
          <h1 className="about-hero__title">{whatWeDo.title}</h1>
          <p className="about-hero__lead">{whatWeDo.lead}</p>
          {whatWeDo.paragraphs.map((p) => (
            <p key={p.text} className="about-copy">
              {p.text}
            </p>
          ))}
        </div>
        <AboutVisual />
      </header>

      {/* Why we started · Where we think this goes — each with its own interactive scene */}
      {scenes.map(({ section, visual }, i) => (
        <section key={section.title} className={`about-block${i % 2 ? " is-flipped" : ""}`} data-fx aria-labelledby={`about-block-${i}`}>
          <div className="about-block__text">
            <h2 id={`about-block-${i}`} className="about-block__headline spot" data-fx>
              {section.title}
            </h2>
            {section.paragraphs.map((p) => (
              <p key={p.text} className="about-copy">
                <KeyText text={p.text} keys={p.keys} />
              </p>
            ))}
          </div>
          <div className="about-block__visual">{visual}</div>
        </section>
      ))}

      <AboutFx />
      <HowWeWork title={howWeWork.title} paragraphs={howWeWork.paragraphs} />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${SITE.url}/about`,
          name: "About Cognavia.ai",
          description: aboutPlainText(),
          about: { "@id": `${SITE.url}/#organization` },
        }}
      />
    </PageShell>
  );
}
