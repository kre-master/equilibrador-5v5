# Liquid Glass UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the Equilibrador 5v5 UI with a light liquid glass visual style while preserving the current app behavior.

**Architecture:** This is a presentation-only change. The implementation updates the existing CSS tokens and component rules in `styles.css`; JavaScript, Supabase schema, game generation, and PNG export remain unchanged.

**Tech Stack:** Static HTML/CSS/JavaScript, CSS custom properties, `backdrop-filter`, responsive media queries.

---

## File Structure

- Modify: `styles.css`
  - Owns visual tokens, background, panels, navigation, inputs, buttons, lists, tables, event cards, and mobile layout polish.
- Test: `app.js`
  - Run syntax check even though JavaScript is not expected to change.

## Task 1: Liquid Glass Base Tokens

**Files:**
- Modify: `styles.css:1-80`

- [ ] **Step 1: Update CSS custom properties**

Replace the `:root` block with:

```css
:root {
  color-scheme: light;
  --bg: #eef5f2;
  --surface: rgba(255, 255, 255, 0.72);
  --surface-strong: rgba(255, 255, 255, 0.9);
  --surface-2: rgba(247, 250, 249, 0.66);
  --ink: #14201c;
  --muted: #62716c;
  --line: rgba(255, 255, 255, 0.58);
  --line-strong: rgba(190, 205, 198, 0.72);
  --green: #1f7a4d;
  --green-deep: #142f24;
  --green-2: rgba(228, 244, 234, 0.76);
  --orange: #c86422;
  --orange-2: rgba(255, 240, 230, 0.78);
  --red: #bd3d3d;
  --amber: #f3b340;
  --glass-blur: blur(26px) saturate(165%);
  --shadow: 0 24px 70px rgba(26, 44, 39, 0.16);
  --shadow-soft: 0 12px 32px rgba(26, 44, 39, 0.1);
}
```

- [ ] **Step 2: Update page background**

Replace the `body` background with layered radial gradients:

```css
body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at 8% 8%, rgba(255, 255, 255, 0.94), transparent 30%),
    radial-gradient(circle at 88% 6%, rgba(103, 178, 143, 0.34), transparent 28%),
    radial-gradient(circle at 86% 70%, rgba(111, 151, 199, 0.22), transparent 34%),
    radial-gradient(circle at 18% 82%, rgba(255, 255, 255, 0.72), transparent 30%),
    linear-gradient(135deg, #eef5f2 0%, #e3ece8 48%, #f6faf8 100%);
  background-attachment: fixed;
  color: var(--ink);
  font-family: Inter, Segoe UI, system-ui, -apple-system, sans-serif;
}
```

## Task 2: Header, Tabs, Panels

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Apply glass to top-level surfaces**

Update `.account-bar span`, `.tabs`, `.panel`, `.counter`, and `.panel-head` to use translucent surfaces, blur, inner highlights, and softer radii. Keep active tabs dark enough for contrast.

- [ ] **Step 2: Preserve responsive behavior**

Check existing mobile media queries and ensure tabs can wrap or scroll without overlap.

## Task 3: Controls, Lists, Tables

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Apply glass form controls**

Update shared input/select styles and button styles so fields remain readable over the new background. Inputs must use `--surface-strong` or equivalent opacity.

- [ ] **Step 2: Apply glass cards to dense content**

Update event cards, player rows, suggestions, account panels, table wrappers, and history cards so dense content stays mostly opaque and readable.

## Task 4: Verification

**Files:**
- Test: `app.js`

- [ ] **Step 1: Run syntax check**

Run:

```bash
node --check app.js
```

Expected: no output and exit code `0`.

- [ ] **Step 2: Inspect desktop and mobile**

Start or reuse the local server, then inspect:

```txt
http://127.0.0.1:5173/
```

Check:

- header has no overlap
- tabs are readable
- event cards are readable
- player table remains readable
- mobile width does not clip important controls

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Refresh UI with liquid glass style"
```

## Self-Review

- Spec coverage: background, panels, tabs, controls, dense content, and mobile checks are covered.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: CSS-only plan, no new JavaScript APIs.
