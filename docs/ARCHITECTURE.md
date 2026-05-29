---
phase: 1
status: in_progress
started: 2026-05-29
domain: marketing.kuiper-safety.de
repo: bk963/kuiper-marketing-app
---

# Marketing-App — Architektur

## TL;DR

`marketing.kuiper-safety.de` ist Bk's One-Stop-Marketing-Cockpit: alle Marketing-KPIs (Traffic, SEO, Ads, Conversions), Landingpage-CMS, KI-Generatoren, Kampagnen, Tracking-Center in einer App. Trennung vom CRM aus Separation-of-Concerns + späterer Agency-Zugriff.

## Stack

- **Frontend**: Next.js 15 App Router (Server Components + Server Actions)
- **Styling**: Tailwind CSS + KS-CI (Navy `#0b1a4d` + Cyan `#00C2FF` + Figtree/DM Sans)
- **Auth**: `jose` JWT in httpOnly Cookie (1h) + PocketBase Superuser-Login
- **Daten**: PocketBase (shared mit Blog: `pb.kuiper-safety.de`, Marketing-Collections-Prefix `mkt_`)
- **Datenquellen**:
  - GA4 Data API (`@google-analytics/data`)
  - Google Search Console (`googleapis`)
  - Google Ads (`google-ads-api`)
  - Blog-PB Read (`pb.kuiper-safety.de`)
  - CRM-PB Read (für Phase 2 Closed-Loop)

## Infrastruktur

```
                      ┌────────────────────────────┐
                      │  Cloudflare (proxied)      │
                      │  marketing.kuiper-safety.de│
                      └─────────────┬──────────────┘
                                    │
                                    ▼
                      ┌────────────────────────────┐
                      │  Coolify (91.98.161.44)    │
                      │  Container :3200            │
                      │  uuid ndlcdaa6au2to79f...  │
                      └─────────────┬──────────────┘
                                    │
        ┌───────────────────────────┼─────────────────────────────┐
        │                           │                             │
        ▼                           ▼                             ▼
  ┌──────────┐              ┌────────────────┐            ┌────────────────┐
  │  GA4 API │              │ Google Ads API │            │  Search Console│
  │  GSC API │              │  (REST gRPC)   │            │       API      │
  └──────────┘              └────────────────┘            └────────────────┘

                                    │ (PB-Read via CF-Access)
                                    ▼
                      ┌────────────────────────────┐
                      │  PocketBase shared          │
                      │  pb.kuiper-safety.de        │
                      │  + Marketing-Prefix `mkt_`  │
                      └────────────────────────────┘
```

## Domains

| Subdomain | Zweck |
|---|---|
| marketing.kuiper-safety.de | Marketing-Cockpit-Login + Dashboards |
| pb.kuiper-safety.de | shared PB (Blog + Marketing + CRM-collections, mit Prefix-Namespace) |
| blog.kuiper-safety.de | Blog mit eigenem /admin |
| app.kuiper-safety.de | CRM (51 Module) |
| www.kuiper-safety.de | Public Marketing-Site |

## Modul-Struktur (`/admin/*`)

### Hub 1: Dashboards (Phase 1 + 2)
- `/admin/traffic` — GA4 (Sessions, Channels, Pages, Devices, Countries) ✅
- `/admin/seo` — GSC + blog_rankings + blog_keywords ✅
- `/admin/ads` — Google Ads (Spend, ROAS, Kampagnen) ✅
- `/admin/conversions` — Funnel + Attribution (Phase 2)

### Hub 2: Content (Phase 3)
- `/admin/landingpages` — Section-Editor + A/B-Tests
- `/admin/lead-magnets` — PDF-Manager mit Email-Gate
- `/admin/forms` — Form-Builder + Submissions
- `/admin/emails` — Email-Templates

### Hub 3: KI-Werkzeuge (Phase 4)
- `/admin/ai/social` — Ollama Multi-Channel-Generator
- `/admin/ai/seo-recommend` — Claude SEO-Vorschläge
- `/admin/ai/lp-gen` — Claude LP-Generator

### Hub 4: Kampagnen (Phase 5)
- `/admin/campaigns` — Email-Kampagnen
- `/admin/automations` — Drip-Flows
- `/admin/segments` — Listen-Builder

### Hub 5: Tracking (Phase 6)
- `/admin/tracking/utm` — UTM-Generator
- `/admin/tracking/pixels` — Pixel-Manager
- `/admin/tracking/capi` — Server-Side Conversion APIs

### Hub 6: System
- `/admin/integrations` — Service-Status ✅
- `/admin/alerts` — Anomalie-Alerts
- `/admin/reports` — Auto-PDF-Reports

## Auth-Flow

```
1. User → /admin/* (außer /admin/login)
2. Middleware checkt ks_admin_session Cookie (JWT)
3. wenn ungültig → redirect /admin/login
4. POST /admin/api/auth/login → MPB /_superusers/auth-with-password
5. bei OK → JWT-signiert mit PB-Token im Payload, 1h, httpOnly
6. Server Components nutzen requireAdmin() → JWT verify → PB-Token
```

## Datenquellen-Setup

### GA4 Data API
1. Service-Account (mailbrain-harvester) als Viewer in GA4-Property „Kuiper Safety" hinterlegen
2. Numerische Property-ID kopieren (Verwaltung → Property-Details → Property-ID)
3. ENV `GA4_PROPERTY_ID` setzen
4. ENV `GOOGLE_SERVICE_ACCOUNT_JSON` (single-line JSON aus `/root/.kuiper-secrets/mailbrain-gcp-sa.json`)

### Google Search Console
1. SA-Email als "Limited User" in GSC-Property `sc-domain:kuiper-safety.de`
2. ENV `GSC_SITE_URL` setzen (default ist bereits korrekt)

### Google Ads
- Alle Credentials bereits aus `/root/.kuiper-secrets/marketing-capi.env` übernommen
- Customer-ID `8809406986` (Kuiper Brandschutz GmbH)
- MCC-Login-Customer-ID `8574807872`

## Tracking-Stack (1:1 wie blog./www)

Im Marketing-Cockpit selbst läuft das gleiche Tracking-Setup wie auf den anderen KS-Properties, für Self-Monitoring:

- `kuiper-consent.v1.js` (DSGVO 3-Tier CMP)
- `kuiper-ga4.v1.js` (Consent-Mode v2)
- `kuiper-tracking.v1.js` (Click-IDs + UTMs + Web-Vitals + Engagement-Events)
- Microsoft Clarity (wwb7ihptp7)

## PocketBase Marketing-Collections (kommen ab Phase 2/3)

```
mkt_lead_attribution    → Multi-Touch-Attribution pro Lead
mkt_landingpages        → LP-CMS
mkt_lp_templates        → Wiederverwendbare LP-Templates
mkt_lp_bausteine        → Modulare Content-Blöcke
mkt_lp_ab_tests         → A/B-Test-Variants + Stats
mkt_forms               → Form-Builder
mkt_form_submissions    → Form-Submits + UTM-Snapshot
mkt_email_templates     → Wiederverwendbare Templates
mkt_email_campaigns     → Email-Kampagnen
mkt_email_automations   → Drip-Flows
mkt_segments            → Filter-Definitionen
mkt_pixel_configs       → Pixel/CAPI-Configs
mkt_webhooks            → Webhook-Sinks
mkt_ad_spend_cache      → Daily-Snapshots Google/Bing/Meta Ad-Spend (Performance-Cache)
mkt_traffic_cache       → Daily-Snapshots GA4 (Performance-Cache)
mkt_alerts              → Anomalie-Alert-History
```

## Coolify-Konfiguration

- **App-UUID**: `ndlcdaa6au2to79f75o6iggu`
- **Project-UUID**: `v112g90lxm8g79afodnbbmo9` (kuiper-safety)
- **Server**: `iv324ksrb9wpnbjd6ro7fyz7` (app-prod, 91.98.161.44)
- **Repo**: `bk963/kuiper-marketing-app` (public)
- **Branch**: `main`
- **Build-Pack**: `dockerfile`
- **Port**: `3200`

## ENVs (gesetzt in Coolify)

- `ADMIN_JWT_SECRET` (random 64-hex)
- `MPB_URL` (auf `pb.kuiper-safety.de` — shared mit Blog)
- `BLOG_PB_URL`
- `PB_CF_ACCESS_CLIENT_ID` + `PB_CF_ACCESS_CLIENT_SECRET` (mailbrain-service-token)
- `GOOGLE_SERVICE_ACCOUNT_JSON` (mailbrain-harvester)
- `GSC_SITE_URL`
- `GOOGLE_ADS_DEVELOPER_TOKEN` + 5 weitere OAuth-Vars

## Sicherheits-Constraints

- **Auth-Wall** auf `/admin/*` via Middleware
- **noindex,nofollow** robots-Meta auf gesamter App (Layout)
- **CF-Access** vor pb.kuiper-safety.de (Service-Token nötig)
- **httpOnly Cookie** für Session-JWT
- **Allow-List** für E-Mail-Versand (gemäß CLAUDE.md): nur `*@kuiper-safety.de`, `*@brandschutzdozenten.de`, `kuiper0281@gmail.com`
