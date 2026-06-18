---
title: KPI-Board „krass" — Multi-Metrik, Bing, Heimat, Sidebar-Cleanup
status: gebaut auf feat/kpi-board-krass, live-verifiziert lokal
date: 2026-06-18
relates: KPI-COCKPIT.md
---

# KPI-Board-Ausbau (P0–P6)

TL;DR: Das KI-KPI-Board (`/admin`, prompt-getrieben via GEX44) wurde zur interaktiven
„Pull"-Heimat ausgebaut — komplementär zu den Chat-Push-Reports. Neu: Multi-Metrik
pro Frage, Bing als vollwertiger Kanal, kanal-bewusste Heimat (Google↔Bing), und eine
auf lebende Sektionen reduzierte Sidebar.

## Was sich geändert hat

### P1 — Multi-Metrik in der KI-Suche
- `prompt.ts`: GEX44 liefert jetzt **immer** `{"queries":[ <Spec je Kennzahl> ]}`.
  Eine Frage → 1..n Specs. (`format:json` + qwen lieferte hartnäckig ein Einzelobjekt;
  der queries-Wrapper erzwingt zuverlässig die Liste.)
- `ask/route.ts`: wertet alle Specs parallel aus → `results[]`. `spec`/`result` bleiben
  als erste Kennzahl erhalten (rückwärtskompatibel für CRM-Assistent „Timmy").
- `run/route.ts`: interner Token (wie ask) für Server-zu-Server + Tests.
- `CockpitClient.tsx`: rendert mehrere Ergebnis-Kacheln, „Alle ins Dashboard".

### P2 — Bing/Microsoft Ads als Kanal
- Microsoft-Reporting ist SOAP + asynchron → zu langsam für Web-Requests.
  Muster: **PB-Cache**. Täglicher Sync schreibt Bing-Tagesmetriken je Kampagne nach
  pb-tracking (Collection `bing_daily`), die Engine liest schnell daraus.
- `bing-ads.ts`: `bingMetricTotal/Series/ByCampaign` — spiegelt `gadsMetric*`.
- `engine.ts`: `adsConnectors(channel)` routet ADS-Metriken + `cpa_qualified` + Δ
  nach Google ODER Bing je `spec.channel`.
- Sync: `/root/ads-analysis/bing_daily_sync.py` (Daily-Report, idempotenter Upsert
  via deterministischer ID `sha256(date|campaign)[:15]`). Cron `/etc/cron.d/kuiper-bing-sync`
  6/12/18 Uhr Europe/Berlin. Auth: Superuser + CF-Access-Header (PB_CF_ACCESS_*).

### P3 — Metrik-Tiefe
- War bereits implementiert (cost/clicks/impressions/ctr/cpc/conversions/roas/
  cpa_qualified/sessions/gsc_*). Live verifiziert.

### P4 — Geo-Filter
- `city` (Leads) + `campaign`-Contains (Ads, z.B. „NRW") funktionieren end-to-end.

### P5 — Dashboard-Heimat
- `page.tsx`: CORE-Reihe + neue **CHANNELS-Reihe** (Google- und Bing-Spend+CTR 7T
  nebeneinander). Prompt + gepinnte Kacheln darunter (Persistenz `mkt_kpi_tiles`).

### P6 — Sidebar-Cleanup
- `Sidebar.tsx`: 13 noch nicht gebaute/Fassaden-Einträge aus der Nav entfernt
  (KI-Werkzeuge, Kampagnen/Automationen/Segmente, Alerts, Reports, Legacy-Content).
  Routen-Dateien bleiben — nur ausgeblendet bis sie echte Funktion/Daten haben.

## Live verifiziert (lokal gegen echte APIs, Stand 2026-06-18)
- „Leads und Kosten pro Lead 7T" → 2 Kacheln (leads=11, CPL=159€).
- „Klicks, CTR, Kosten bei Google" → 3 Kacheln (209 / 7,6% / 1.750€).
- Bing via Cache: cost 147,84€ · 59 Klk · CTR 4,4% · CPC 2,50€.
- „Google vs Bing Kosten und Klicks" → 4 korrekt geroutete Kacheln.
- Geo: Köln=1 Lead, NRW-Kampagne cost 497,91€/44 Klk.
- Production-Build (`next build`) erfolgreich.

## Offen / nächster Track
- **P7 Daten-Migration 2.0f** (blog/seo-intel/forms/leads/site/templates befüllen) —
  separater Content-Ops-Track, nicht Teil des KPI-Boards, berührt die historisch
  fragile Marketing-PB. Nicht erzwungen.
- **Multi-Metrik „je Stadt"**: qwen setzt `dimension:city` nicht immer bei „je Stadt"
  (funktioniert bei „pro Stadt"). Minor.
- **Bing conversion_value/roas**: Daily-Report liefert keinen Conv-Wert → roas=0.

## Architektur-Notiz
Chat-Reports = Push (proaktiv, kommt zu Bk). Cockpit = Pull (interaktiv, fragbar,
editierbar). Bewusst komplementär, keine Doppelarbeit.
