// Content for the About us view (/about). This is final copy supplied by Cognavia:
// keep every word, every paragraph and the order exactly as written.
// `keys` are exact phrases inside a paragraph that light up on hover (presentation only).

export type AboutParagraph = { text: string; keys?: string[] };
export type AboutSection = { title: string; lead?: string; paragraphs: AboutParagraph[] };

export const ABOUT: {
  whatWeDo: AboutSection;
  whyWeStarted: AboutSection;
  whereThisGoes: AboutSection;
  howWeWork: AboutSection;
} = {
  whatWeDo: {
    title: "What we do",
    lead: "We build AI systems for businesses that don't have an AI team and aren't planning to hire one.",
    paragraphs: [
      {
        text: "Cognavia is an agentic engineering company. What that means for a client is that we build software which can be given a job and left to carry it through. For most people that starts with an assistant on the website, answering the questions customers ask at eleven at night and passing the serious ones to a person in the morning. Later it might follow up leads, keep the CRM up to date, or put together the quote that a salesperson was staying late to do. The point is that the system does something, rather than just replying.",
      },
      {
        text: "It also describes how we work. We build with AI agents doing a large share of the engineering, which is the reason two people can take on work that would normally need a team, and the reason we can afford clients that a bigger consultancy would turn away.",
      },
    ],
  },
  whyWeStarted: {
    title: "Why we started",
    paragraphs: [
      {
        text: "Almost everyone we talk to already knows AI could help their business. What they don't have is someone to build it, run it, and be honest with them about whether it's working. Anyone can buy the tools now. Knowing what to do with them is still rare, and that is really what we're selling.",
        keys: ["someone to build it, run it, and be honest with them", "Knowing what to do with them is still rare"],
      },
    ],
  },
  whereThisGoes: {
    title: "Where we think this goes",
    paragraphs: [
      {
        text: "Within a few years a small business will expect its website to answer questions and chase up customers on its own, in the way it now expects the site to work on a phone. We would like to be the people who built that for them and who are still reachable when it needs changing.",
        keys: ["still reachable when it needs changing"],
      },
    ],
  },
  howWeWork: {
    title: "How we work",
    paragraphs: [
      {
        text: "We start with one thing that has to work and get it running in your business before we discuss anything bigger. The person who builds it keeps looking after it.",
        keys: ["keeps looking after it"],
      },
      {
        text: "We came out of enterprise security, so we build the way we would want to audit. An agent that acts on your behalf has boundaries on what it can do, a record of what it did, and a person who can switch it off. Your customer data stays yours. If a client asks for something we think is unsafe, we say so, even when it's awkward.",
        keys: ["boundaries on what it can do", "a record of what it did", "a person who can switch it off", "Your customer data stays yours."],
      },
      {
        text: "Sometimes AI isn't the answer and a form and a phone number will do the job. We'll tell you that too. It has cost us work before. It's also why people come back.",
        keys: ["It's also why people come back."],
      },
    ],
  },
};

const ORDER = [ABOUT.whatWeDo, ABOUT.whyWeStarted, ABOUT.whereThisGoes, ABOUT.howWeWork];

/** The About copy in its original order (structured data, llms.txt). */
export const aboutPlainText = () =>
  ORDER.flatMap((s) => [s.title, ...(s.lead ? [s.lead] : []), ...s.paragraphs.map((p) => p.text)]).join("\n");

/** Sections in order, for text outputs. */
export const aboutSections = () => ORDER;
