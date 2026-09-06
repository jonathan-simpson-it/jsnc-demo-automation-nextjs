import type { Metadata } from "next";
import SectionIntro from "@/components/marketing/SectionIntro";
import ChipList from "@/components/marketing/ChipList";
import CtaBand from "@/components/marketing/CtaBand";
import RegulatorMark from "@/components/RegulatorMark";
import SupportFaq from "@/components/marketing/SupportFaq";
import { assurancePackUrl } from "@/lib/api";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Compliance — Jonathan Simpson & Co.",
  description:
    "Our regulatory positioning: a technology partner to licensed firms — not an intermediary. Built-in governance, evidence on demand, and due-diligence support.",
};

const GOVERNANCE_FEATURES = [
  {
    title: "Immutable audit trail",
    description:
      "Every query and response logged in a SHA-256 hash-chained record with integrity verification and regulator-ready export.",
  },
  {
    title: "PII redaction",
    description:
      "HKID, phone numbers, addresses, bank accounts, and card numbers masked before data touches logs, cache, or exports.",
  },
  {
    title: "Document-level RBAC",
    description:
      "Not just who can query, but who can query which documents — per-user grants enforced at retrieval time.",
  },
  {
    title: "Explainability exports",
    description:
      "Each answer's provenance rendered as a regulator-ready report: sources, per-node timing, confidence justification.",
  },
  {
    title: "Human review",
    description:
      "Approve, edit, or reject before anything is delivered. A named human signs off on every output.",
  },
  {
    title: "Model version pinning",
    description:
      "Model name, version, config hash, and deployment timestamp recorded for freeze and rollback evidence.",
  },
];

const DUE_DILIGENCE_ITEMS = [
  "Positioning statement and engagement boundary (this page, in writing)",
  "Architecture and data-flow documentation naming every subprocessor",
  "Model-version records with configuration hashes for freeze and rollback",
  "Tamper-evident audit-trail exports with integrity verification",
  "Explainability reports for any answer, on demand",
  "Documented RBAC policy and PII redaction specification",
  "Exit plan: full data export, open codebase, no proprietary lock-in",
];

const DEMO_LINKS = [
  {
    href: "/workbench/compliance-audit",
    title: "Compliance Auditor",
    description:
      "Audit documents against published SFC, HKMA and AMLO expectations with cited findings and corrective actions.",
  },
  {
    href: "/radar",
    title: "Regulatory Radar",
    description:
      "Live SFC and HKMA circulars with recency-weighted retrieval, grounded in today's guidance.",
  },
  {
    href: "/eval",
    title: "Eval Dashboard",
    description:
      "Accuracy metrics across 180 test questions with per-document breakdown and pass/fail results.",
  },
];

export default function CompliancePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: siteConfig.complianceFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="marketing-page">
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="Compliance"
            title="Technology partner. Not an intermediary."
            description="We build and implement AI systems for licensed firms. We do not carry on regulated activities, hold client money, or advise end-clients — the regulated decision always stays with the licensed firm. Our job is to make your oversight of us easy: transparent systems, evidence on demand, and a clear chain of responsibility."
          />

          <div className="grid-services">
            <div className="panel-card">
              <span className="section-eyebrow">What we do</span>
              <h3 style={{ margin: 0 }}>Build the systems you oversee</h3>
              <ul style={{ margin: "0.75rem 0 1rem", paddingLeft: "1.1rem" }}>
                <li>Retrieval-grounded analysis over your own documents, used by your licensed staff</li>
                <li>Audit trails, PII redaction, RBAC, explainability exports, and human review as first-class features</li>
                <li>Compliance tooling targeting standards your regulators publish — SFC, HKMA and AMLO first</li>
                <li>Training and documentation so your team runs the system without us</li>
              </ul>
              <ChipList tags={["Technology", "Implementation", "Evidence"]} />
            </div>
            <div className="panel-card">
              <span className="section-eyebrow">What we don't do</span>
              <h3 style={{ margin: 0 }}>Perform regulated activities</h3>
              <ul style={{ margin: "0.75rem 0 1rem", paddingLeft: "1.1rem" }}>
                <li>Advise your end-clients or recommend securities in our own name</li>
                <li>Execute or route trades, or provide automated trading services</li>
                <li>Hold client money or assets</li>
                <li>Issue compliance sign-offs or act as your Responsible Officers</li>
              </ul>
              <ChipList tags={["No licensing required", "Clear boundary"]} />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <SectionIntro
            eyebrow="Built in"
            title="Governance as a first-class feature"
            description="Every build ships with the controls your regulators expect — not bolted on afterwards."
          />
          <div className="grid-services">
            {GOVERNANCE_FEATURES.map((f) => (
              <div className="panel-card" key={f.title}>
                <h3 style={{ margin: 0 }}>{f.title}</h3>
                <p style={{ margin: "0.6rem 0 0" }}>{f.description}</p>
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: "1.5rem",
            }}
          >
            <RegulatorMark code="SFC" withName />
            <RegulatorMark code="HKMA" withName />
            <RegulatorMark code="AMLO" withName />
          </div>
          <p style={{ marginTop: "0.75rem", fontSize: "0.78rem" }}>
            Referenced as published standards our builds target. Not endorsed by,
            affiliated with, or authorised by any regulator.
          </p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <SectionIntro
            eyebrow="Due diligence"
            title="What we hand your compliance team"
            description="Your firm carries the regulatory burden of overseeing outsourced technology. These artifacts are delivered as standard, so your oversight file is complete from day one."
          />
          <div className="panel-card">
            <ul style={{ margin: 0, paddingLeft: "1.1rem", columns: 2, columnGap: "2rem" }}>
              {DUE_DILIGENCE_ITEMS.map((item) => (
                <li key={item} style={{ breakInside: "avoid", marginBottom: "0.5rem" }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginTop: "1.25rem",
            }}
          >
            <a className="button button--ghost button--small" href={assurancePackUrl()}>
              Download assurance pack
            </a>
            <p style={{ margin: 0, fontSize: "0.85rem" }}>
              Live Markdown export, generated from the platform's compliance
              stores: audit-chain integrity check, model-version records, and
              an explainability report.
            </p>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <SectionIntro
            eyebrow="Evidence"
            title="See it running"
            description="The live demo demonstrates capability, not advice — grounded answers, reviewable citations, and measurable accuracy."
          />
          <div className="grid-services">
            {DEMO_LINKS.map((d) => (
              <a
                key={d.href}
                href={d.href}
                className="panel-card"
                style={{ display: "block", textDecoration: "none" }}
              >
                <h3 style={{ margin: 0 }}>{d.title}</h3>
                <p style={{ margin: "0.6rem 0 0" }}>{d.description}</p>
                <span
                  className="section-eyebrow"
                  style={{ display: "inline-block", marginTop: "1rem" }}
                >
                  Open &rarr;
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <SectionIntro eyebrow="FAQ" title="Positioning questions" />
          <SupportFaq faqs={siteConfig.complianceFaqs} />
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div
            className="panel-card"
            style={{ borderLeft: "3px solid var(--color-accent)" }}
          >
            <span className="section-eyebrow">Disclaimer</span>
            <p style={{ margin: "0.75rem 0 0" }}>
              This page describes our technology positioning and is provided for
              information only. It is not legal, regulatory, or compliance
              advice. Jonathan Simpson &amp; Co. is a technology services
              provider, not a licensed corporation, and does not carry on
              regulated activities. Whether any use of our systems fits your
              regulatory obligations should be confirmed with your own
              compliance function and legal advisers. SFC, HKMA and AMLO are
              referenced as published standards our builds target; we are not
              endorsed by, affiliated with, or authorised by any regulator.
            </p>
          </div>
        </div>
      </section>

      <CtaBand />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}
