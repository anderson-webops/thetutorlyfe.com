# Authentication, authorization, security, and backend workflow audit

Audit date: 2026-08-02

## Boundary and result

This historical review covered the inherited Nuxt frontend, Express API, Netlify adapter, listener and proxy trust,
deployment workflows, dependency and native-package graph, and committed source history before the code became The Tutor
Lyfe downstream site. At the audit date, the inherited baseline had no identity, login, session, role, administrator,
promotion, demotion, database, secret, or privileged mutation workflow. Its sole API resource was a public, uncached,
read-only health signal.

No known npm vulnerability remains in either the full or production dependency graph. The root lockfile contains the
required Linux ARM64 native optional packages, and the standalone API lockfile produces a runtime-only dependency tree.
The Tutor Lyfe adaptation adds a narrowly scoped public lead intake at `POST /api/leads`; this historical audit is not a
claim that the later contact workflow was reviewed on 2026-08-02. The current boundary, controls, webhook handoff, and
privacy requirements are documented in `docs/security-model.md`. Any future protected data must use authenticated,
deny-by-default authorization at the backend boundary; frontend visibility and CORS are not authorization.

## Inherited findings remediated in v2.1.0

1. Self-hosted production still depended on Docker and Compose. Those files were removed. Static output now runs
   directly under Nginx and the API runs under a dedicated, unprivileged, capability-free systemd sandbox.
2. The standalone API accepted an arbitrary host from the environment, including public wildcard listeners. The
   server now accepts only IPv4 or IPv6 loopback addresses, and tests enforce that invariant.
3. Container startup did not provide a source-level atomic promotion and rollback transaction. Release preparation now
   requires the exact annotated tag and fetched main revision, verifies clean development and production installs and
   package provenance, writes exact public release identity, and proves the real direct runtime before promotion.
4. Rollout gates did not require both address families. Promotion now checks health, exact identity, strict edge
   headers, mutation denial, and reserved API denial over local IPv4 and IPv6 TLS without changing DNS.
5. Security scanning was limited to dependency audit and tests. Pinned CodeQL scanning now covers JavaScript,
   TypeScript, and workflow source in addition to local secret and vulnerability scans.
6. GitHub checkout credentials could remain available while package lifecycle scripts ran. Ordinary CI no longer
   persists a credential, and release preparation removes its temporary read credential immediately after the required
   fetch and before dependency installation.

The retained version gaps are intentional compatibility boundaries: Node 24 type definitions match the production LTS
line rather than Node 26, and the available c12 4.x release is still a prerelease. They are not vulnerability
exceptions.
