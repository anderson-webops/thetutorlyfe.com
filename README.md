# The Tutor Lyfe

This repository contains The Tutor Lyfe website and its contact-delivery API. It keeps the inherited npm workspace split
between two intentionally separate applications:

- `front-end/`: a statically generated Nuxt 4 site
- `back-end/`: a standalone Express 5 API

The browser always calls the API through the same-origin `/api` path. Local development, direct Nginx/systemd
production, and Netlify each route that path to the Express application without enabling broad CORS access.

## Supported toolchain

- Node.js `26.13.1`
- npm `12.2.2` through the independently locked `webops-locked-npm-v1` build profile

```sh
export PATH="$(node scripts/build-toolchain.mjs --print-bin):$PATH"
npm ci --include=optional --strict-allow-scripts
```

Bootstrap uses the selected Node's existing npm only to install the reviewed,
locked build-tool graph. Application installation and checks use the repaired
profile. The private installation survives application `npm ci`, and global
tools remain unchanged. The bootstrap-only graph accepts the stock Node 26.13.1
npm 11.20.0 seed; application and release commands still require the verified
npm 12.2.2 profile. Bootstrap reuses a private installation only when its complete
dependency payload matches the source-reviewed `build-toolchain/PAYLOAD.json`
digest, its paired Node matches the selected executable, and current full,
production and signature audits pass. A cache receipt alone never qualifies it.
`NPM_CONFIG_CACHE` places profiles under that cache's `_site-toolchains/reuse-v1`,
otherwise they stay in repository-owned scratch. Identical concurrent requests
wait for the existing bootstrap outcome. Three fixed slots bound retained
profiles; reaching capacity or finding failed/interrupted creation stops with
the evidence path. Retire a slot and its matching identity directory only after
reviewing their outcome and proving no process, worktree or consumer uses them.
Legacy profiles are preserved, not automatically imported or evicted.
Use a relocatable Node distribution; a dynamically linked executable without
its required libraries cannot qualify after copying.
Windows and hosted-editor execution require their own acceptance; source CI
and direct release acceptance target Linux, with local macOS validation.
Verification binds regular-file checks and reads to one no-follow, nonblocking
file descriptor, and parses the integrity-verified byte snapshots. Platforms
without those open capabilities fail explicitly rather than omitting protection.

When changing the independent lock, reproduce the payload digest from a fresh
locked installation with scripts disabled and optional packages included, after
both audits and registry provenance pass. Review `inspectToolchainPayload` output
and update `build-toolchain/PAYLOAD.json` and the artifact contract together.
Run `npm run test:build-toolchain` for cold/warm, dependency/Node tampering,
concurrency, interrupted creation and retention regressions.

Use the repository root for all package operations. The committed npm lockfile includes optional native packages for Linux ARM64 glibc and musl deployments, and npm rejects unreviewed dependency install scripts.

npm uses the explicit hoisted install strategy, with native bindings checked against their actual dependency ancestry. Direct build-time type and lint dependencies are declared explicitly rather than relying on accidental hoisting.

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

`npm run validate` checks Linux ARM64 lockfile entries, linting, type safety, API behavior, portable artifact-integrity
regressions, both production builds, and the expected deployment adapters. The tagged release workflow additionally
builds and tests the exact unpacked runtime on Linux ARM64 in an isolated namespace.

## API contract

- `GET` and `HEAD` on `/healthz`, `/api/healthz`, and legacy `/api/health` return the minimal liveness response
  `{ "ok": true }` with `Cache-Control: no-store`.
- `GET` and `HEAD` on `/readyz` and `/api/readyz` return `200 { "ok": true }` only while the API is accepting work and
  the server-only lead destination is validly configured. They return `503 { "ok": false }` while unconfigured or
  draining. Readiness never sends a lead or probes the provider by mutation.
- `POST /api/leads` validates and rate limits contact requests, then forwards them to the server-only
  `LEAD_WEBHOOK_URL`. A successful destination response returns `202` to the browser.
- `HEAD` and `OPTIONS` are permitted where appropriate. Unsupported methods return `405`, and unknown routes return
  JSON `404` responses.

The lead payload contains `parentName`, `studentName`, `email`, `phone`, `grade`, `subject`, `preferred`, and `message`.
The API adds `source` and `submittedAt`, sends the handoff as `application/x-www-form-urlencoded`, and does not persist a
local copy. The webhook must use HTTPS without embedded URL credentials and must answer directly without a redirect. If
it is unconfigured or does not return a successful response, the API does not report the submission as accepted. Rate
state is cardinality-bounded, no more than 16 lead deliveries run concurrently in one process, provider responses are
released without retaining their bodies, and the direct listener accepts at most 128 simultaneous connections.

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

Production does not use Docker or Compose. Nginx serves the generated Nuxt files and proxies the API and exact root
probe routes to a loopback-only Node process running as the unprivileged `thetutorlyfe` account under a hardened systemd
service. Unprivileged source builds live beneath `/srv/thetutorlyfe.com/builds`; immutable, root-owned accepted releases
live beneath `/srv/thetutorlyfe.com/releases`. The build account cannot mutate `current`, a candidate, or a rollback.

The tagged workflow creates a closed SHA-256 inventory, tests the exact unpacked artifact without the source checkout,
development dependencies, secrets, or external networking, verifies a copied tree, deliberately rejects a missing
runtime module, and publishes the accepted Linux ARM64 archive, checksum, manifest, and acceptance receipt. Root invokes
only a versioned helper installed from a separately reviewed root-owned checkout. Promotion binds the candidate to the
published archive digest and source commit. A protected external record keeps that provenance available for future
rollback verification, and workflow reruns cannot replace published assets. Promotion then rolls back on health,
readiness, identity, edge-policy, restart, or interruption failure.

```bash
# Run only from a separately reviewed root-owned administrative checkout.
sudo NODE_BIN_DIR=/opt/node-26.13.1/bin deploy/systemd/install-service.sh

# Build verification is unprivileged and separate from accepted releases.
deploy/systemd/prepare-release.sh /srv/thetutorlyfe.com/builds/<release>

# The installed helper accepts only a protected candidate and the reviewed release record.
sudo PUBLIC_HOST=thetutorlyfe.com \
  /usr/local/libexec/thetutorlyfe-release/<version>/deploy/systemd/promote-release.sh \
  /srv/thetutorlyfe.com/releases/<release> /root/reviewed/<archive>.tar.gz <sha256> <commit>
```

See `deploy/README.md` for the exact rollout, contact configuration, and rollback contract. The direct API remains bound
to port `3006` on loopback and never binds a public interface.

## Netlify deployment

Netlify generates the Nuxt frontend and bundles the same Express app as `netlify/functions/api.ts`. Exact rewrites send
the root probes and `/api/leads` to the function before the general `/api/*` and SPA fallbacks. The lead rewrite has a
Netlify edge limit aggregated by client IP and domain; the in-process bounds remain defense in depth for each warm
function instance. Strict site-wide in-flight concurrency still depends on the platform's deployment controls. Node and
npm versions are pinned in the repository and in Netlify configuration. Set `LEAD_WEBHOOK_URL` in the Netlify site
environment before accepting live contact submissions.

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
