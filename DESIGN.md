---
name: Balesin AI
description: Professional omnichannel customer service platform for Indonesian SMBs.
colors:
  primary: "#00d2ff"
  neutral-bg: "#050814"
  neutral-surface: "#0a0e1c"
  neutral-text: "#f1f5f9"
  neutral-muted: "#94a3b8"
  border: "rgba(255, 255, 255, 0.06)"
  success: "#10b981"
  warning: "#f59e0b"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "12px"
  lg: "16px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#050814"
    rounded: "9999px"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "#38bdf8"
  card:
    backgroundColor: "{colors.neutral-surface}"
    rounded: "{rounded.md}"
    border: "{colors.border}"
    padding: "{spacing.lg}"
---

# Design System: Balesin AI

## 1. Overview

**Creative North Star: "The Operational Workspace"**

Balesin AI visual identity is designed to convey absolute operational trust, safety, and modern efficiency. Rather than dressing up as an abstract, over-designed "AI sandbox" with translucent glass layers and glowing neon clouds, the system behaves as a crisp, solid, and reliable CRM workstation. Design elements exist only to serve the user's focus: colors signify real-world system states, density is dialed in for rapid review, and components behave predictably.

This design system rejects generic AI landing page tropes, specifically:
- Translucent glassmorphism used for default card containers.
- Exaggerated display font/monospace pairing (Space Grotesk + IBM Plex Mono).
- Tiny uppercase tracked eyebrows acting as repetitive layout boilerplate.
- Arbitrary colored gradient fills behind text or inside card panels.
- Ghost cards with excessive shadows combined with thin borders.

**Key Characteristics:**
- Solid Obsidian surfaces with precise, hairline borders.
- Single sans-serif typography (Manrope) for clean readability.
- State-driven color choices (Teal-Cyan for focus, Emerald for active automation, Amber for handoffs).
- Compact, information-dense layouts suitable for actual SMB operations.

## 2. Colors

A highly focused, dark-mode restrained palette. Colors carry system state, not decoration.

### Primary
- **Electric Cyan** (#00d2ff): Used exclusively for primary actions, active navigation states, and operational highlights.

### Neutral
- **Obsidian Dark** (#050814): The primary canvas background.
- **Deep Steel Surface** (#0a0e1c): Container, card, and panel surfaces.
- **Crisp Ice Text** (#f1f5f9): Primary text color for body, labels, and headings.
- **Slate Gray Muted** (#94a3b8): Secondary text, disabled states, and auxiliary labels.

### Success & Warning
- **Mint Emerald** (#10b981): Indicates active automation, connected states, and successful resolution.
- **Warm Amber** (#f59e0b): Indicates pending handoff, needs review, or alert state.

### Named Rules
**The Accent Limitation Rule.** The primary Electric Cyan accent (#00d2ff) must never exceed 10% of any screen surface. It is a beacon for action, not a background element.
**The Tonal Border Rule.** Card borders must use a semi-transparent white wash (rgba(255,255,255,0.06)), letting the card background establish clean containment rather than high-contrast dividing lines.

## 3. Typography

**Display Font:** Manrope (with system-ui sans-serif fallback)
**Body Font:** Manrope (with system-ui sans-serif fallback)
**Label/Mono Font:** JetBrains Mono (for code, numbers, and technical data)

**Character:** A single, clean sans-serif typeface carries the interface. Manrope provides balanced proportions, modern geometric styling, and exceptional readability at both 12px labels and 64px display titles.

### Hierarchy
- **Display** (Bold, clamp(2rem, 5vw, 3.5rem), 1.15): Used for main landing page hero titles.
- **Headline** (SemiBold, 24px, 1.3): Used for section titles and main card headings.
- **Title** (SemiBold, 18px, 1.4): Used for sub-sections and modal titles.
- **Body** (Regular, 14px, 1.6, max line length 70ch): General paragraphs, documentation, and user guidelines.
- **Label** (Medium, 12px, letter-spacing 0.05em, uppercase): Used for navigation links, table headers, and badges.

### Named Rules
**The Text Contrast Rule.** Body text must have a contrast ratio of at least 4.5:1 against its background. Text color is strictly Crisp Ice (#f1f5f9) or Slate Gray (#94a3b8); muted gray text on dark-tinted backgrounds must be avoided.

## 4. Elevation

The system is flat by default, relying on solid tonal layers rather than simulated depth. Elevation is communicated through contrasting background tones (e.g., placing Deep Steel containers on Obsidian backgrounds) and precise borders.

### Shadow Vocabulary
- **System Flat** (none): Cards and containers do not cast shadows at rest.
- **Action Glow** (box-shadow: 0 0 12px rgba(0, 210, 255, 0.1)): Subtle glow applied strictly to active hover states of primary buttons.

### Named Rules
**The Flat Container Rule.** Drop shadows are prohibited on static cards and layouts. Shadows are reserved exclusively as responsive interactive cues for hover, focus, and open dropdowns/modals.

## 5. Components

### Buttons
- **Shape:** Full pill shape (rounded-full / 9999px)
- **Primary:** Electric Cyan (#00d2ff) background with Obsidian (#050814) text. Clean, high contrast.
- **Secondary:** Deep Steel (#0a0e1c) background with Crisp Ice (#f1f5f9) text, bordered by Muted Steel (rgba(255,255,255,0.08)).
- **Hover:** Primary shifts to Sky Blue (#38bdf8) with action glow; Secondary shifts to lighter gray bg (rgba(255,255,255,0.08)).

### Cards / Containers
- **Corner Style:** Medium curve (12px / rounded-xl)
- **Background:** Deep Steel (#0a0e1c)
- **Border:** Hairline Slate (1px solid rgba(255,255,255,0.06))
- **Internal Padding:** Generous (24px / p-6)

### Inputs / Fields
- **Style:** 1px border border-white/10, background rgba(255, 255, 255, 0.02), radius 8px.
- **Focus:** 1px border-cyan-400 with a subtle outline ring (2px outline offset, cyan-400/20).

### Navigation
- **Style:** Sticky header with clear backdrop-filter: blur(12px) and solid boundary line. Links use Manrope Label (12px, semi-bold), highlighting with Electric Cyan text on active routes.

## 6. Do's and Don'ts

### Do:
- **Do** use a single font family (Manrope) for both heading and body to maintain a unified, premium product experience.
- **Do** ensure all text hits a minimum of 4.5:1 contrast against its background.
- **Do** represent system states (active automation, pending handoff) using standardized semantic colors.
- **Do** reduce card border radius to 12px for a precise, clean visual system.

### Don't:
- **Don't** use decorative glassmorphism or blur cards for default container layouts.
- **Don't** use gradient text fills under any circumstances.
- **Don't** use side-stripe colored borders on cards, list items, or alerts.
- **Don't** pair Space Grotesk with IBM Plex Mono.
- **Don't** use a repetitive tiny tracked uppercase eyebrow above every section.
- **Don't** pair 1px borders with soft wide drop shadows (no ghost cards).
