# Payments Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin-only monthly payments area for attendance adjustment, manual payment tracking, and WhatsApp export.

**Architecture:** Extend the static app with two new collections (`payments`, `attendanceOverrides`) and mirror them to Supabase tables. Calculations remain client-side from confirmed games, attendance overrides, and payment records.

**Tech Stack:** Static HTML/CSS/JavaScript, Supabase Postgres/RLS, localStorage fallback.

---

## Tasks

- [ ] Add Supabase tables and policies for `payments` and `attendance_overrides`.
- [ ] Add local state migration and remote load/save mapping.
- [ ] Add admin-only `Pagamentos` tab and view.
- [ ] Render monthly finance table using confirmed game attendance with overrides.
- [ ] Add manual payment form and payment history.
- [ ] Add WhatsApp export.
- [ ] Add admin role controls in account list.
- [ ] Validate with `node --check app.js` and local HTTP smoke checks.
