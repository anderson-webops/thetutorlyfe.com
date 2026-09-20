# Security, resource, and release-boundary review

Review date: 2026-09-20

## Scope and result

The review covered the public Nuxt site, Express lead API, Netlify adapter, direct Nginx/systemd path, package graphs,
health/readiness behavior, error handling, resource lifetime, release artifact, privileged promotion, rollback, and
credential handling. The site has no login, account, session, role, administrator, promotion, or demotion feature, so no
authorization transition exists to repair.

Five source findings were confirmed and remediated:

1. A service-owned release checkout supplied scripts later executed by root. Promotion now executes only an immutable,
   versioned helper installed from a separately reviewed root-owned checkout.
2. Candidate, active, and rollback trees lacked a closed trusted inventory and were writable by the service identity.
   Accepted trees are root-owned and verified against the original archive digest, source commit, and per-file manifest.
   A separate root-only record binds every rollback to that provenance, so an older unrecorded tree cannot be restored
   automatically.
3. Rate-state cardinality, simultaneous direct connections, and aggregate outbound lead work were unbounded. Rate stores
   now cap identities at 2,048 per limiter with a strict overflow bucket, the API caps outbound deliveries at 16, and the
   direct server caps connections at 128. Netlify adds an edge limit by client IP and domain.
4. The release checkout credential remained available during global package-manager installation. Every release checkout
   now uses `persist-credentials: false`, and setup runs only after that boundary.
5. A malformed secret-bearing webhook URL could survive in the platform's raw startup exception. URL parsing now emits a
   sanitized policy error without the input or cause, and standalone startup logs only an allowlisted message.

The root and API liveness/readiness aliases now use minimal no-store GET/HEAD responses. Readiness fails when the lead
destination is unconfigured or shutdown has begun, without contacting the provider.

Published release assets are commit-qualified and write-once. A workflow rerun fails if the release already exists,
rather than replacing the archive or its verification metadata.

## Limits and deployment distinction

In-memory limits are per process or warm Netlify function instance. The Netlify edge rule materially reduces
cross-instance submission bursts, but strict platform-wide simultaneous execution still requires a verified Netlify
concurrency control or a shared atomic queue. No provider queue was added because that would change persistence,
privacy, retry, and operating semantics.

This source review and release gate do not establish that production ownership has been migrated or that a release has
been activated. Existing healthy installations require a separate operator review before changing ownership or
installing the protected helper. DNS, certificates, routing, firewall policy, environment values, provider records, and
submitted lead data were outside this source change.
