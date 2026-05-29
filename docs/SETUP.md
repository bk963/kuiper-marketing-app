---
audience: dev/ops
last_updated: 2026-05-29
---

# Setup-Guide

## Lokale Entwicklung

```bash
git clone https://github.com/bk963/kuiper-marketing-app
cd kuiper-marketing-app
npm install
cp .env.example .env.local
# .env.local befüllen
npm run dev   # → http://localhost:3200
```

## ENV-Variablen

| Key | Pflicht | Beschreibung |
|---|---|---|
| `ADMIN_JWT_SECRET` | ✅ | random 64-hex string |
| `MPB_URL` | ✅ | PocketBase-URL (default: pb.kuiper-safety.de) |
| `BLOG_PB_URL` | ✅ | für SEO-Dashboard (Blog-Rankings) |
| `PB_CF_ACCESS_CLIENT_ID` | ✅ | CF-Access Service-Token-ID |
| `PB_CF_ACCESS_CLIENT_SECRET` | ✅ | CF-Access Service-Token-Secret |
| `GOOGLE_SERVICE_ACCOUNT_JSON_B64` | optional | base64-encoded SA-JSON (für GA4 + GSC) |
| `GA4_PROPERTY_ID` | für GA4 | numerische Property-ID (NICHT die G-YV...-ID) |
| `GSC_SITE_URL` | für GSC | default: `sc-domain:kuiper-safety.de` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | für Ads | |
| `GOOGLE_ADS_CUSTOMER_ID` | für Ads | Account-ID ohne Bindestriche |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | für Ads | MCC-Manager-ID |
| `GOOGLE_OAUTH_CLIENT_ID` | für Ads | |
| `GOOGLE_OAUTH_CLIENT_SECRET` | für Ads | |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | für Ads | |

## Service-Account-Setup (GA4 + GSC)

1. Service-Account-JSON aus `/root/.kuiper-secrets/mailbrain-gcp-sa.json`
2. Base64-encoden:
   ```bash
   base64 -w0 /root/.kuiper-secrets/mailbrain-gcp-sa.json
   ```
3. In Coolify-Env als `GOOGLE_SERVICE_ACCOUNT_JSON_B64` setzen (mit `is_buildtime: false`)
4. GA4-Property „Kuiper Safety": Verwaltung → Property-Zugriff → SA-Email als Viewer
5. GA4-Property-ID kopieren → `GA4_PROPERTY_ID` env
6. GSC: Property → Einstellungen → Nutzer und Berechtigungen → SA als Limited User

## Coolify

```
App-UUID:     ndlcdaa6au2to79f75o6iggu
Project:      kuiper-safety (v112g90lxm8g79afodnbbmo9)
Server:       app-prod (91.98.161.44)
Repo:         bk963/kuiper-marketing-app, branch main
Build-Pack:   dockerfile (/Dockerfile)
Port:         3200
Domain:       https://marketing.kuiper-safety.de
```

**Deploy triggern:**
```bash
source /root/.kuiper-secrets/coolify-new-servers.env
ssh root@91.98.161.44 "curl -s 'localhost:8000/api/v1/deploy?uuid=ndlcdaa6au2to79f75o6iggu&force=true' -H 'Authorization: Bearer $APPPROD_COOLIFY_TOKEN'"
```

## DNS (Cloudflare)

```
marketing.kuiper-safety.de  A  91.98.161.44  proxied
```

ID: `ebf0540e2078dfa01cb40754c99ecd3a`
Zone: `99aba58e5f6eda0ca933633855f4ea8d` (kuiper-safety.de)

## Auth-Login (Test)

```bash
curl -sS -c /tmp/cookies.txt -X POST "https://marketing.kuiper-safety.de/admin/api/auth/login" \
  -d "email=$PB_BLOG_EMAIL" --data-urlencode "password=$PB_BLOG_PASS"

curl -b /tmp/cookies.txt "https://marketing.kuiper-safety.de/admin"
```

## Troubleshooting

### Build failed mit ARG-Quoting
→ Service-Account-JSON immer als base64 setzen (`GOOGLE_SERVICE_ACCOUNT_JSON_B64`), NICHT als plain JSON. Coolify generiert `ARG KEY='value'` was bei JSON-Quotes kollidiert.

### 503 Bad Gateway
→ Container-Crash. Check `ssh root@91.98.161.44 "docker logs ndlcdaa6au2to79f75o6iggu-... --tail 50"`.

### "PB-Auth failed"
→ CF-Access-Service-Token-Headers fehlen. Prüfe `PB_CF_ACCESS_CLIENT_ID` + `PB_CF_ACCESS_CLIENT_SECRET`.

### GA4 zeigt "nicht verbunden"
→ entweder `GOOGLE_SERVICE_ACCOUNT_JSON_B64` fehlt ODER `GA4_PROPERTY_ID` fehlt ODER SA hat keine Viewer-Permission in GA4-Property.
