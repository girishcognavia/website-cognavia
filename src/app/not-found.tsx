import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page/PageBits";

export const metadata: Metadata = {
  title: "Page not found — Cognavia.ai",
  description: "The page you were looking for doesn't exist or has moved.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <PageShell>
      <section className="nf">
        <p className="page__eyebrow">Error 404</p>
        <h1 className="nf__title">Page not found</h1>
        <p className="nf__text">The page you were looking for doesn&apos;t exist or has moved.</p>
        <div className="nf__links">
          <Link href="/" className="nf__btn nf__btn--solid">
            Back to home
          </Link>
          <Link href="/products" className="nf__btn">
            Our products
          </Link>
          <Link href="/contact" className="nf__btn">
            Contact us
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
