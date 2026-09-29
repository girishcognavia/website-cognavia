/** Renders text exactly as written, wrapping the given key phrases so they can light up on hover. */
export default function KeyText({ text, keys = [] }: { text: string; keys?: string[] }) {
  const parts: { text: string; key: boolean }[] = [];
  let rest = text;
  while (rest) {
    // earliest key phrase still in the remaining text
    let at = -1;
    let hit = "";
    for (const k of keys) {
      const i = rest.indexOf(k);
      if (i !== -1 && (at === -1 || i < at)) {
        at = i;
        hit = k;
      }
    }
    if (at === -1) {
      parts.push({ text: rest, key: false });
      break;
    }
    if (at > 0) parts.push({ text: rest.slice(0, at), key: false });
    parts.push({ text: hit, key: true });
    rest = rest.slice(at + hit.length);
  }
  return (
    <>
      {parts.map((p, i) =>
        p.key ? (
          <span key={i} className="key">
            {p.text}
          </span>
        ) : (
          p.text
        ),
      )}
    </>
  );
}
