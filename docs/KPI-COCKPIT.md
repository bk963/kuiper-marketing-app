---
title: KPI-Cockpit (prompt-getriebenes Marketing-Dashboard)
project: kuiper-marketing-app
status: P1+P2+P3 gebaut, Deploy ausstehend (Bk-GO)
date: 2026-06-02
branch: feat/kpi-cockpit
tags: [kpi, dashboard, gex44, llm, pocketbase, google-ads]
---

# KPI-Cockpit

> **TL;DR:** Die Admin-Home (`/admin`) wird zum lebenden Marketing-Cockpit: Core-KPIs oben,
> eine **Prompt-Leiste** („Conversions letzte 30 Tage in Köln") die via **GEX44 (on-premise LLM)**
> eine Query-Spec baut → Live-Daten aus den echten Connectoren → **📌 Ins Dashboard** pinnt das
> Ergebnis als dauerhafte Kachel. Selbst-wachsendes Dashboard per natürlicher Sprache.

## Warum hier (nicht eigene App)

`marketing.kuiper-safety.de` ist bereits das Marketing-Cockpit mit echten Connectoren
(GA4, Google Ads, GSC, pb-tracking). Das KPI-Board wird **additiv** in die bestehende App
gebaut und nutzt diese Connectoren wieder — kein Doppel-Bau, kein Risiko fürs Bestehende.
Die Home war schon die „Übersicht" → wird zum Cockpit aufgewertet (statische Cards → fragbar + pinnbar).

## Architektur

```
NL-Frage ─▶ /api/admin/kpi/ask ─▶ prompt.ts (GEX44 qwen2.5, JSON-Mode, ON-PREMISE)
                                      │  baut NUR die QuerySpec, sieht NIE Kundendaten
                                      ▼
                                  engine.ts (runQuery)  ──route nach Metrik──┐
                                      │                                       │
  leads.ts (pb-tracking)  ◀───────────┤   google-ads.ts (GAQL)  ◀────────────┤
  ga4.ts  ◀────────────────────────────┤   gsc.ts  ◀───────────────────────────┘
                                      ▼
                                  KpiResult {value, series, breakdown, source}
                                      │
  📌 Pin ─▶ /api/admin/kpi/tiles ─▶ tiles.ts ─▶ mkt_kpi_tiles (Marketing-PB)
                                      │  speichert NUR die Spec → bei jedem Aufruf live neu gerechnet
                                      ▼
                                  Home rendert Core-KPIs + gepinnte Kacheln (recharts)
```

### Dateien

| Datei | Zweck |
|---|---|
| `src/lib/kpi/types.ts` | QuerySpec, KpiResult, Metrik-Enums, Units, Labels |
| `src/lib/kpi/leads.ts` | Lead-KPIs aus pb-tracking (qualified, Quote, Umsatz) — Filter über `submitted_at` |
| `src/lib/google-ads.ts` | + `gadsMetricTotal/Series/ByCampaign` (KPI-Erweiterung) |
| `src/lib/kpi/engine.ts` | `runQuery(spec)` — zentraler Router zu allen Connectoren |
| `src/lib/kpi/prompt.ts` | `questionToSpec(frage)` — GEX44 NL→Spec, validiert/gesäubert |
| `src/lib/kpi/tiles.ts` | Pin-Persistenz (`mkt_kpi_tiles`) |
| `src/lib/kpi/format.ts` | Wert-Formatierung (eur/pct/int/…) |
| `src/components/kpi/KpiTile.tsx` | Kachel (Zahl + Sparkline/Bar via recharts) |
| `src/components/kpi/CockpitClient.tsx` | Prompt-Leiste + gepinntes Grid (interaktiv) |
| `src/app/admin/page.tsx` | Home → Cockpit (Core-KPIs + Prompt + Pins + Deep-Dive) |
| `src/app/admin/api/kpi/{ask,run,tiles,tiles/[id]}/route.ts` | API (unter `/admin` wg. Cookie-Path-Scope) |

## Metriken

Leads: `qualified_leads, leads, submit_to_qualified_rate, avg_quality_score, revenue, won_deals`
Ads: `cost, conversions, cpa, cpa_qualified, clicks, impressions, ctr, cpc, roas, conversion_value`
GA4: `sessions, users` · GSC: `gsc_clicks, gsc_impressions, gsc_position`
Dimensionen: `none, city, channel, campaign, day, course`

`qualified` = `quality_score >= 60` (identisch zur Worker-`scoring.v1.js`).

## DSGVO

Das LLM (GEX44, `gex44.kuiper-safety.de`, qwen2.5) läuft **on-premise**. Es bekommt nur die
**Frage + das Schema** — NIE Kunden-/Lead-Daten. Daten kommen ausschließlich aus den echten APIs.
Konform zu [[feedback_drive_extraktion_dsgvo]] / Keine-Token-LLM-Regel.

## Verifikation (2026-06-02, gegen echte Daten)

- Ad-Spend 30T = 4.955,51 € (+ 30-Tage-Reihe) ✅
- Qualifizierte Leads 30T = 6 ✅
- CPA/qual. Lead = 825,92 € ✅ (test-daten-belastet — Cleanup oci-/bing-test offen)
- Conversions je Kampagne = 48,86 (Bundesweit 42,9 · PMax 6) ✅
- GEX44: „Conversions letzte 30 Tage in Köln" → `{metric:conversions,city:Köln,days:30}` → 48,86 live ✅
- `next build` grün. Smoke: `scripts/kpi-smoke.ts` (tsx, manuell).

## Deploy-Voraussetzungen (vor Live)

1. **ENV in Coolify** (App `ndlcdaa6au2to79f75o6iggu`):
   `GEX44_URL=https://gex44.kuiper-safety.de`, `GEX44_USER=bjoern`, `GEX44_PASS=…`, `GEX44_MODEL=qwen2.5:32b`
2. **Collection `mkt_kpi_tiles`** in Marketing-PB anlegen (von app-prod mit Runtime-Creds):
   Felder `title(text) spec(json) unit(text) position(number) span(number) viz(text) owner(text)`.
   (Pin-Feature degradiert sauber, falls Collection fehlt — Rest läuft.)
3. Deploy = echter **Coolify-Rebuild** (kein docker cp), DNS-Check vorab.

## Roadmap

- **P1 Fundament + Connectoren + Core-KPIs** ✅
- **P2 Prompt-Layer (GEX44)** ✅
- **P3 Pin-to-Dashboard** ✅ (Collection-Anlage = Deploy-Step)
- **P4 Polish:** Zeitraum-Vergleiche (Δ vs. Vorperiode), Drag-Reorder, Span-Toggle, Alerts, Export, Caching
