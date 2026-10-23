# Repository Guidelines

Shared Sites policy (`../AGENTS.md` when available) applies. These essentials also apply in standalone checkouts:
- Never SSH, SCP, SFTP, tunnel to, or configure access to production. Do not deploy it; protected server-side automation owns activation, and source delivery alone does not prove deployment.
- GitGuardian quota, authentication, network, or service failure is not a commit/push blocker. Review outgoing changes, run another available local secret scan, preserve other hooks, and stop on real secret findings.
- Commit small, coherent, validated changes frequently as work progresses and push completed work through this repository's authorized source path, usually its default branch; use pull requests only when required.
- Group related changes into meaningful deployable milestones. Align version metadata, create a new immutable annotated semver tag, and publish its matching verified GitHub release with the required accepted artifacts.
- Complete finished deployable work through the published release consumed by protected deployment. Independently verify public release identity and acceptance read-only, or report the exact remaining blocker. Never move published tags or replace published release assets.

## Project Structure & Module Organization

- `front-end/` contains the Nuxt 4 application. UI lives in `src/components`, layouts in `src/layouts`, routes in
  `src/pages`, composables in `src/composables`, and shared constants under `src/constants`.
- `back-end/` contains the standalone Express API. Keep route wiring and middleware in `src/`, and emit compiled output
  to `dist/`.
- Root files (`package.json`, `tsconfig.base.json`, `eslint.config.js`, `netlify.toml`) define the shared monorepo
  toolchain. `deploy/` contains the direct Nginx/systemd production path.

## Build, Test, and Development Commands

- `npm ci` installs the committed workspace dependency graph. Use Node 24.18.1 and npm 12.0.2 at the repo root; do not mix package managers for normal
  development.
- `npm run dev` starts the Nuxt front-end on port `3333`.
- `npm run server` starts the Express API with `tsx watch` on port `3006`.
- `npm run typecheck` runs both the Nuxt and back-end TypeScript checks.
- `npm run lint` runs ESLint across both workspaces.
- `npm run build` generates the static front-end to `front-end/.output/public` and compiles the back-end to
  `back-end/dist`.

## Coding Style & Naming Conventions

- Follow the repo ESLint configuration. Front-end files use the upstream Nuxt/Vitesse formatting style; root and
  back-end files follow the shared monorepo lint rules.
- Prefer descriptive component and composable names. Use PascalCase for Vue components and camelCase for utility and
  composable exports.
- Keep route-facing files in `src/pages` aligned with Nuxt’s file-based routing conventions.

## Testing & Verification

- Run `npm run validate` before delivering application changes; it includes lint, types, tests, build, and deployment-output checks.
- When changing API behavior, verify both the front-end call site and the Express route behavior together.
- Keep browser API traffic same-origin at `/api`; deployment adapters must route that path to the Express app.
- Keep tutoring lead details on the same-origin `POST /api/leads` path. The browser must never receive the configured
  `LEAD_WEBHOOK_URL`, and tests must cover configured, unconfigured, invalid, and failed-delivery behavior.
- Never restore or republish the former site's Google Apps Script source, spreadsheet identifier, notification address,
  or public script endpoint. A takeover deployment needs a separately verified, owner-controlled lead destination.
- Preserve both Docker-free production adapters: direct Nginx/systemd and Netlify. Do not compile and discard the
  backend in either production path.
- Preserve the minimal GET/HEAD `/healthz` and `/readyz` contract and their `/api` aliases. Readiness must fail closed
  when the lead destination is not validly configured or shutdown has started, and it must never send a real or
  synthetic provider message outside an isolated test fixture.
- Preserve the fixed-cardinality rate stores, outbound lead concurrency bound, direct connection cap, and Netlify edge
  lead limit. Do not replace them with per-request unbounded maps or queues.
- Treat `deploy/runtime-artifact.json` as the independent production contract. Test the exact unpacked and copied
  artifact without source, development packages, secrets, or real providers before attaching it to a release.
- Never run privileged promotion from a source checkout or build-owned tree. Root uses only the versioned helper beneath
  `/usr/local/libexec/thetutorlyfe-release`; accepted candidates and rollbacks remain root-owned, non-writable, and bound
  to a protected acceptance record. Never replace an existing release asset.
- Treat shared-template changes as high impact, but keep this repository's public content and deployment identity
  specific to The Tutor Lyfe.

## Downstream Template Workflow

- `origin` is the published `anderson-webops/thetutorlyfe.com` site repository.
- `upstream` is `anderson-webops/vitesse-nuxt-template`, the maintained full-stack base for this site.
- The template repository, rather than this downstream site, maintains the direct relationship to
  `antfu/vitesse-nuxt`.
- Preserve the front-end/back-end workspace structure and review upstream template changes deliberately. Do not
  force-mirror template history over site-specific content or deployment configuration.

## Lockfile Boundaries

- Keep `back-end/package-lock.json` synchronized with backend manifest changes; it is the production-only direct API
  lock, while the root lock remains authoritative for workspace development and Netlify. Regenerate affected locks
  with manifest changes and verify a clean root `npm ci` plus the shared audit and validation gates.
