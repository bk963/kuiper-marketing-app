---
status: phase-1 in_progress
last_updated: 2026-05-29
---

# Phasen-Plan Marketing-App

> **Strikt**: jede Phase wird komplett abgeschlossen + Bk-Live-Verifikation bevor nächste startet.
> Doku-Pflicht: 4 Orte (Repo `docs/`, Obsidian, Festung, Memory) gemäß CLAUDE.md.

## Phase 1 — Foundation + 3 Read-Dashboards · 🟡 in_progress

### Scope
- [x] GitHub-Repo `bk963/kuiper-marketing-app`
- [x] Next.js 15 + Tailwind + Tracking-Stack-Skelett aus blog-frontend
- [x] Auth: JWT + httpOnly Cookie + Marketing-PB-Superuser
- [x] Sidebar mit 6 Hubs + 22 Pages
- [x] `/admin` Übersicht mit Stat-Cards + Connection-Status
- [x] `/admin/traffic` — GA4 Data API (Sessions, Channels, Pages, Devices, Countries)
- [x] `/admin/seo` — GSC + Blog-PB-Rankings/Keywords
- [x] `/admin/ads` — Google Ads (Spend, ROAS, Kampagnen)
- [x] `/admin/integrations` — Service-Status pro Datenquelle
- [x] 19 Stub-Pages mit Phasen-Hinweis
- [x] Coolify-App + Domain marketing.kuiper-safety.de
- [x] CF DNS-Record (proxied)
- [x] ENVs gesetzt (alle 13)
- [ ] Live-Verifikation + Bk-Freigabe

### Definition of Done
- HTTP/2 200 auf `/admin/login`
- Login mit Bk-Credentials klappt
- 3 Dashboards zeigen echte Daten (kein Mock)
- 19 Stub-Pages laden mit Phasen-Hinweis
- KS-CI komplett (Navy/Cyan, KSS-Logo, Figtree/DM Sans)
- Maximum-Tracking aktiv

## Phase 2 — Conversions-Funnel + Closed-Loop-ROAS · ⏸️ wartend

### Scope
- `/admin/conversions` Funnel: View → Form → Lead → MQL → Deal → Won
- Read-Sync zu CRM-PB (`crm_deals`, `crm_companies`, `reach_leads`)
- Attribution-Modelle: Last-Click, First-Click, Linear, Time-Decay, Data-Driven
- ROAS pro Kanal + Kampagne + Landingpage gegen echten Deal-Won-Wert
- Lead-Attribution-Collection `mkt_lead_attribution`
- Reach-Bridge-Status-Widget

## Phase 3 — Landingpages-CMS + A/B-Tests · ⏸️ wartend

### Scope
- LP-CMS aus CRM portieren (`landingpages`, `templates`, `bausteine`)
- Section-Editor (Drag-Drop)
- A/B-Test-Engine + Statistical-Significance-Calc
- Public-LP-Route auf marketing.kuiper-safety.de/lp/... ODER www./lp/
- Form-Builder + Submissions-Stream

## Phase 4 — KI-Werkzeuge + Content-Pipeline · ⏸️ wartend

### Scope
- Social-Generator: Ollama qwen2.5:32b (GEX44) — 1 Topic → 8 Channel-Posts
- SEO-Recommendation-Engine: Claude API
- LP-Generator: Claude API
- Article-Generator-Anschluss an blog-PB
- Lead-Magnet-PDF-Library

## Phase 5 — Email-Kampagnen + Automation · ⏸️ wartend

### Scope
- Email-Campaign-Builder (Draft/Active/Paused/Sent)
- Drip-Flow-Editor (Trigger → Sequence)
- Listen-Builder (Filter über mkt_lead_attribution)
- SMTP via All-Inkl-SMTP
- Open/Click-Tracking
- **PFLICHT**: Allow-List-Guard gemäß CLAUDE.md (nur kuiper-safety.de + brandschutzdozenten.de + kuiper0281@gmail.com)

## Phase 6 — Tracking-Center + Monitoring · ⏸️ wartend

### Scope
- UTM-Generator (URL-Builder)
- Pixel-Manager (Meta/LinkedIn/TikTok/Bing UET zentral)
- Server-Side Conversion APIs (Meta CAPI, LinkedIn CAPI, Google EC, Bing Offline)
- Consent-Mode-Status-View
- Webhook-Center
- Anomalie-Alerts via Telegram (nur echte Blocker)
- Auto-Monthly-Report-PDF

## Rollout-Regeln (strikt)

1. **Eine Phase = ein Sprint** — keine Mid-Phase-Pivots
2. **Nach jeder Phase**: STOP + Bk-Live-Verifikation + Freigabe (CLAUDE.md "Nach jeder Phase")
3. **PR-Workflow**: alle Commits auf `dev`, Merge nach `main` nach Review (CLAUDE.md)
4. **Doku** in 4 Orten parallel pro Sprint (feedback_md_doku_pflicht)
5. **Plan-Adherence 100%** (feedback_strict_plan_zero_freestyle, feedback_plan_strikt_zwischenschritte)
