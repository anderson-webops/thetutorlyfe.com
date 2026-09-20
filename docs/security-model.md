# Security and authorization model

## Current boundary

The Tutor Lyfe is a public information site with no identity system, login, session, role, administrator, promotion,
demotion, or privileged administration workflow. Its API has two deliberate public resources:

- `GET` or `HEAD` on `/healthz`, `/api/healthz`, or legacy `/api/health` is a minimal liveness signal.
- `GET` or `HEAD` on `/readyz` or `/api/readyz` is a minimal dependency-aware readiness signal.
- `POST /api/leads` accepts a prospective customer's contact request and hands it to an operator-controlled webhook.

The lead route is an unauthenticated intake endpoint, not an authorization mechanism. It handles personal contact
information and is therefore constrained by route-specific methods, validation, payload limits, rate limits, outbound
timeouts, and a server-only destination. The API does not keep a local copy of a submission.

The security boundary is the Express application, not the Nuxt UI. The browser uses the same-origin `/api` route in
every supported deployment. Cross-origin credential sharing is disabled, and CORS is not treated as authentication.

## Contact destination boundary

The captured previous site exposed a Google Apps Script deployment URL in browser JavaScript. The associated Google Apps
Script backend, source project, ownership, and deployment access were not included in the takeover material. A captured
URL does not establish operational control. Do not embed it in the rebuilt frontend or reuse it without separately
confirming ownership and access.

The current API reads `LEAD_WEBHOOK_URL` only from the server environment. The value must be HTTPS, cannot contain URL
credentials, and must answer without redirecting. Validated fields are forwarded as `application/x-www-form-urlencoded`
data with server-added `source` and
`submittedAt` values. The API accepts the handoff only when the destination returns `2xx`; a missing destination fails
closed, and an unsuccessful or timed-out handoff is reported as a delivery failure.

Before enabling the form in production, the operator must supply an owner-controlled destination and confirm:

1. Who can access the stored lead data and receive notifications.
2. How long contact data is retained and how deletion requests are handled.
3. That the endpoint returns an accurate success status only after accepting the submission.
4. That one authorized end-to-end test lead arrives with the expected fields.

The webhook URL belongs only in an uncommitted local environment, the root-owned direct-production environment file, or
the Netlify server-side environment. It must never appear in Nuxt public runtime configuration or committed source.

## Enforced controls

- The health route accepts only `GET`, `HEAD`, and `OPTIONS`; the lead route accepts only `POST` and `OPTIONS`.
- Contact JSON is limited to `16kb`, required fields and allowed selections are checked, strings have explicit maximum
  lengths, and malformed email or phone values are rejected.
- The lead route has a narrow per-client submission limit in addition to the general API rate limit. Both limiters use
  fixed-cardinality stores; excess identities share a strict overflow bucket instead of allocating unbounded state.
- No more than 16 webhook deliveries run concurrently in an application process. Outbound requests use a bounded
  timeout, provider bodies are canceled without logging them, and API errors do not include submitted fields or
  destination details. Netlify also enforces an edge lead limit by client IP and domain.
- Liveness and readiness responses contain only `{ "ok": true }` or `{ "ok": false }`; they disclose no cookies,
  redirects, authentication state, process metrics, host information, environment, database names, provider details,
  or secrets and are never cached. Readiness checks configuration and draining state without sending a provider message.
- Helmet supplies response hardening headers; Nginx, Netlify, and generated Nuxt output add browser-facing
  defense-in-depth headers and CSP.
- Proxy trust is set explicitly by each deployment adapter rather than globally trusting forwarded headers.
- Listener ports, proxy-hop counts, server request durations, keep-alive durations, shutdown durations, and direct
  server connections are bounded.
- Production source maps are disabled.
- The direct API is loopback-only on port `3006` and runs as the unprivileged `thetutorlyfe` account in a
  capability-free systemd service with a read-only system view; Nginx is the only public listener.
- npm optional dependencies and Linux ARM64 native lock entries are checked, while unreviewed dependency install scripts
  fail installation.
- A closed runtime manifest binds every accepted file, required module, production dependency, release identity, source
  commit, and archive digest. The exact unpacked and copied runtime is tested without source, development packages,
  secrets, or provider access.
- Privileged promotion executes only a versioned root-owned helper and verifier. Candidates and rollbacks are root-owned
  immutable data; the unprivileged service/build account cannot supply root-executed code or alter the active tree.

## Requirements for future protected workflows

Before adding accounts, protected records, or privileged mutation, this repository must:

1. Authenticate on the backend using a reviewed session or token design.
2. Authorize every protected route on the server using deny-by-default role or capability checks.
3. Re-read an actor's current role from trusted server-side state for security-sensitive changes.
4. Prevent self-promotion and require an authorized actor for every role change.
5. Revoke or refresh active sessions after security-sensitive account changes.
6. Record immutable audit events for role and privilege changes without logging credentials, session secrets, webhook
   URLs, or lead payloads.
7. Add positive and negative tests for anonymous, ordinary, stale-role, demoted, and administrator cases.
8. Add CSRF protection before accepting cookie-authenticated mutations.
9. Define retention, access, deletion, and incident-response rules before storing additional personal information.

Frontend visibility checks may improve usability, but they never satisfy these requirements.
