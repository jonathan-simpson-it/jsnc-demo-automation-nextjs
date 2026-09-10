# PRODUCT.md

## Register

product. This repository holds two surfaces: the public marketing site and
the authenticated workspace (the private-markets AI demo turning into a
self-service SaaS). Authenticated surfaces are the primary product surface and
follow the product register; marketing pages follow the brand register and are
out of scope for product-register rules.

## Users

Hong Kong SME finance, compliance and operations teams working with
documents: deal files, term sheets, LP reports, regulatory circulars.
Primary roles inside a customer organisation: owner, admin, analyst,
reviewer, viewer. Users are professionals in a task, often under time
pressure, and some are not deeply technical.

## Product Purpose

Run document-heavy finance workflows with cited AI answers, human review and
an audit trail, inside a tenant-isolated workspace. The product supports
organisations (tenancy), invitations, provider policy controls, credits and
billing. It is a SaaS foundation, not a claim of regulatory approval or
autonomous financial decision-making.

## Brand Personality

Institutional, precise, quiet. The interface should feel like a trusted
internal tool: predictable, legible, low-drama. Warmth lives in the existing
cream/sage brand palette and editorial typography, not in playful UI.

## Anti-references

- AI-slop patterns: gradient text, glassmorphism, emoji as icons, hero-metric
  templates, nested cards, decorative motion.
- Overclaiming product language ("compliant", "approved", "autonomous").
- Consumer-app visuals on regulated-workflow surfaces.
- Dense dashboards that bury the task; decoration over density.

## Design Principles

1. The tool disappears into the task: familiar affordances, consistent
   component vocabulary across screens.
2. Every interactive element carries default, hover, focus, active, disabled,
   loading and error states; no half-shipped components.
3. Restrained color: one accent (brand sage) for primary actions, selection
   and state indicators. Signal colors only for genuine status.
4. State changes are explicit and legible; motion only conveys state, 150-250ms.
5. Careful language on compliance matters: "privacy-conscious", "configurable
   retention", "human-reviewed", "provider policy controls".

## Register: accessibility

WCAG AA. Body text ≥4.5:1. Keyboard operable throughout, visible focus,
labelled inputs, errors announced and placed with their field.
