# The Tutor Lyfe

This repository contains The Tutor Lyfe website and its contact-delivery API. It keeps the inherited npm workspace split
between two intentionally separate applications:

- `front-end/`: a statically generated Nuxt 4 site
- `back-end/`: a standalone Express 5 API

The browser always calls the API through the same-origin `/api` path. Local development, direct Nginx/systemd
production, and Netlify each route that path to the Express application without enabling broad CORS access.

## Supported toolchain

- Node.js `24.18.1`
- npm `12.0.2`

Use the repository root for all package operations. The committed npm lockfile includes optional native packages for
Linux ARM64 glibc and musl deployments, and npm rejects unreviewed dependency install scripts. npm uses the nested
install strategy so optional peer packages from unrelated tools cannot leak across workspace boundaries.

```bash
npm ci
npm run server
npm run dev
```

The API listens on `127.0.0.1:3006` by default, while Nuxt listens on port `3333` and proxies `/api` to it. For local API
configuration, copy `back-end/.env.example` to the ignored `back-end/.env` and fill only the needed values. Never commit
the resulting environment file.

## Validation

```bash
npm run audit:all
npm run audit:prod
npm run validate
npm run a11y
```

`npm run validate` checks Linux ARM64 lockfile entries, linting, type safety, API behavior, both production builds, and
the expected deployment artifacts.

## API contract

- `GET /api/health` returns `{ "ok": true }` with no-store caching.
- `POST /api/leads` validates and rate limits contact requests, then forwards them to the server-only
  `LEAD_WEBHOOK_URL`. A successful destination response returns `202` to the browser.
- `HEAD` and `OPTIONS` are permitted where appropriate. Unsupported methods return `405`, and unknown routes return
  JSON `404` responses.

The lead payload contains `parentName`, `studentName`, `email`, `phone`, `grade`, `subject`, `preferred`, and `message`.
The API adds `source` and `submittedAt`, sends the handoff as `application/x-www-form-urlencoded`, and does not persist a
local copy. The webhook must use HTTPS without embedded URL credentials and must answer directly without a redirect. If
it is unconfigured or does not return a successful response, the API does not report the submission as accepted.

There are no accounts, sessions, roles, or administrative workflows. The public lead route handles personal contact
information, so future changes must preserve strict validation, narrow rate limiting, bounded payloads, and server-only
destination configuration. See `docs/security-model.md`.

## Contact backend takeover boundary

The captured public site referenced a Google Apps Script deployment URL, but the previous Google Apps Script backend,
its source project, and ownership or deployment access were not included. Do not hard-code the captured URL or assume it
is controlled by the new operator. Obtain an owner-controlled HTTPS endpoint and set it only as `LEAD_WEBHOOK_URL`:

- Local development: copy `back-end/.env.example` to `back-end/.env` or export it into the API process environment.
- Direct systemd production: set it in the root-owned `/etc/thetutorlyfe.com/api.env` file created by the installer.
- Netlify: set it in the site's server-side environment and redeploy.

Verify the final storage, retention, and notification recipients with the site owner, then submit one authorized test
lead end to end. See `deploy/README.md` for the production handoff.

## Direct production deployment

Production does not use Docker or Compose. Nginx serves the generated Nuxt files and proxies `/api` to a loopback-only
Node process running as the unprivileged `thetutorlyfe` account under a hardened systemd service. Release preparation
requires the exact annotated tag and fetched `origin/main`, performs clean development and production-only installs,
audits and package-provenance checks, code/browser/accessibility validation, and a real direct runtime smoke test.
Promotion selects the prepared release atomically and rolls back automatically unless health, exact release identity,
strict headers, and route policy pass over both local IPv4 and IPv6 TLS paths.

```bash
sudo deploy/systemd/install-service.sh
# Install deploy/nginx/thetutorlyfe.com.server.conf inside the certificate-covered TLS server.
deploy/systemd/prepare-release.sh /srv/thetutorlyfe.com/releases/<release>
sudo PUBLIC_HOST=thetutorlyfe.com deploy/systemd/promote-release.sh /srv/thetutorlyfe.com/releases/<release>
```

See `deploy/README.md` for the exact rollout, contact configuration, and rollback contract. The direct API remains bound
to port `3006` on loopback and never binds a public interface.

## Netlify deployment

Netlify generates the Nuxt frontend and bundles the same Express app as `netlify/functions/api.ts`. The first rewrite in
`netlify.toml` sends `/api/*` to that function before the static SPA fallback. Node and npm versions are pinned in the
repository and in Netlify configuration. Set `LEAD_WEBHOOK_URL` in the Netlify site environment before accepting live
contact submissions.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | API listener address |
| `PORT` | `3006` | API listener port |
| `TRUST_PROXY_HOPS` | `0` | Explicitly trusted reverse-proxy hops; direct production and Netlify set `1` |
| `DEV_API_ORIGIN` | `http://127.0.0.1:3006` | Nuxt development proxy target; it is never sent to browsers |
| `LEAD_WEBHOOK_URL` | unset | Server-only HTTPS destination for validated contact submissions |

Do not commit webhook URLs, credentials, or contact submissions.

## Git remotes

`origin` is [`anderson-webops/thetutorlyfe.com`](https://github.com/anderson-webops/thetutorlyfe.com), The Tutor Lyfe site
repository. `upstream` is
[`anderson-webops/vitesse-nuxt-template`](https://github.com/anderson-webops/vitesse-nuxt-template) for selective template
updates. That template retains its own `antfu/vitesse-nuxt` upstream; this downstream site should not point there
directly.
