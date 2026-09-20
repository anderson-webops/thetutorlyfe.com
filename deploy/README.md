# The Tutor Lyfe protected Docker-free production rollout

The direct adapter is static Nuxt output served by the host Nginx process plus one loopback-only Express process managed
by systemd. Netlify remains a separate Docker-free adapter. No production path requires Docker, Compose, Podman, or a
container registry.

Source delivery and production activation are separate. A pushed tag and published artifact do not establish that a host
was changed. Preserve existing DNS, A and AAAA records, certificates, edge listeners, service paths, and protected
configuration unless an operator separately authorizes an exact infrastructure change.

## Contact destination and probes

The API accepts validated contact submissions at `POST /api/leads` and forwards them to the operator-owned HTTPS
destination in `LEAD_WEBHOOK_URL`. The destination stays in `/etc/thetutorlyfe.com/api.env`, owned by root with mode
`0600`. It is never part of a release artifact, browser bundle, command argument, test log, or acceptance receipt.

The public probe contract is:

- `GET` and `HEAD` `/healthz`, `/api/healthz`, and `/api/health`: liveness, always minimal `200 {"ok":true}` while the
  process can serve requests.
- `GET` and `HEAD` `/readyz` and `/api/readyz`: `200 {"ok":true}` only when the lead destination is validly configured
  and shutdown has not started; otherwise `503 {"ok":false}`.
- Every probe uses `Cache-Control: no-store` and exposes no cookies, redirects, authentication state, secrets, provider
  details, host information, database names, environment data, or process metrics.

Readiness does not send a lead or mutate the provider. One end-to-end test lead requires separate owner authorization
after configuration.

## Trust and ownership model

The unprivileged `thetutorlyfe` account may write only:

- `/srv/thetutorlyfe.com/builds`, for disposable source builds;
- `/srv/thetutorlyfe.com/shared`, for its bounded package cache.

It cannot write `/srv/thetutorlyfe.com`, `releases`, `current`, `.deployment-recovery`, the systemd unit, the protected
environment, or `/usr/local/libexec/thetutorlyfe-release`. Accepted releases and retained rollbacks are root-owned and
non-writable. Candidate files are data only and never supply code that root executes.

The administrative installer must run from a separately reviewed, root-owned checkout. It installs a versioned copy of
the promoter, path validator, artifact verifier, and contract beneath
`/usr/local/libexec/thetutorlyfe-release/<version>`. It refuses to overwrite a helper version, unit, existing directory
metadata, or protected environment file.

Each accepted release also has a root-only record beneath `.deployment-recovery/accepted`. The record binds its
canonical release path, source commit, original archive digest, and closed-manifest digest. Automatic rollback refuses
an older release without this independently protected provenance, even if its embedded manifest and marker appear valid.

An older installation whose release tree is owned by the service account requires a reviewed ownership/topology
migration. Do not run the installer blindly, normalize permissions recursively, or take a healthy service offline to
force the new model.

## Source and release gates

The annotated tag must peel to the exact fetched `origin/main` revision. Every checkout sets
`persist-credentials: false`; the package-manager setup and dependency lifecycle never receive a checkout credential.
The unprivileged source gate performs locked installation, full and production audits, registry signature checks, lint,
types, tests, builds, accessibility checks, native lock checks, deployment checks, a production-only backend install,
and direct runtime startup/shutdown tests.

The Linux ARM64 release job then:

1. Builds from the exact clean tag with Node 24.18.1 and npm 12.0.2.
2. Copies only the declared compiled API, static output, source manifests, and independent production lock.
3. Installs only the standalone backend production graph and rejects development or unrelated packages.
4. Creates a closed per-file SHA-256 and size inventory bound to the source commit.
5. Unpacks the archive and runs it read-only in an isolated process, network, and mount namespace without source,
   development dependencies, environment files, or real provider access.
6. Exercises every compiled entrypoint, GET/HEAD probes, readiness failure/recovery, one injected synthetic lead,
   repeated-signal draining, clean exit, and restart.
7. Re-verifies a copied tree against the original archive and proves that a deliberately missing runtime module fails
   verification and startup.
8. Publishes commit-qualified archive, checksum, runtime-manifest, and acceptance-receipt assets on the matching GitHub
   release. A pre-existing release is a hard failure; workflow reruns never replace published provenance.

The complete contract is in `deploy/runtime-artifact.json` and `docs/runtime-artifact-contract.md`.

## Reviewed bootstrap

On a fresh or separately reviewed compatible installation:

```bash
sudo NODE_BIN_DIR=/opt/node-24.18.1/bin \
  /root/reviewed/thetutorlyfe.com/deploy/systemd/install-service.sh
```

This creates protected directories and an empty protected environment file only when absent. It does not start or
restart the API and does not replace an existing unit. Configure the webhook with `sudoedit
/etc/thetutorlyfe.com/api.env`. Install the reviewed Nginx snippet inside the existing certificate-covered TLS server,
retaining both IPv4 and IPv6 listeners, then validate the complete Nginx configuration.

## Candidate installation and promotion

Download the four published assets to a root-only review location. Verify the annotated tag, release commit, checksum
file, workflow result, and acceptance receipt. Never compute a new digest from the server's copied candidate and treat
that as release authority.

Create a new root-owned empty release directory, unpack with the installed verifier, and keep the reviewed archive:

```bash
sudo install -d -o root -g root -m 0750 /srv/thetutorlyfe.com/releases/<release>
sudo /usr/bin/python3 -I \
  /usr/local/libexec/thetutorlyfe-release/<version>/scripts/runtime-artifact.py unpack \
  /srv/thetutorlyfe.com/releases/<release> \
  --archive /root/reviewed/<archive>.tar.gz \
  --sha256 <published-sha256> \
  --commit <published-full-source-commit>
sudo chown -R root:root /srv/thetutorlyfe.com/releases/<release>
sudo chmod -R go-w /srv/thetutorlyfe.com/releases/<release>
```

Promote only with the installed helper and the same archive record:

```bash
sudo PUBLIC_HOST=thetutorlyfe.com \
  /usr/local/libexec/thetutorlyfe-release/<version>/deploy/systemd/promote-release.sh \
  /srv/thetutorlyfe.com/releases/<release> \
  /root/reviewed/<archive>.tar.gz \
  <published-sha256> \
  <published-full-source-commit>
```

Promotion takes a protected lock, verifies the candidate against the original archive and commit, atomically switches
`current`, restarts the API, reloads only valid Nginx configuration, and gates liveness, readiness, exact public release
identity, strict page headers, and reserved-route denial over local IPv4 and IPv6 TLS. Method-denial behavior stays in
isolated application tests so production acceptance uses only read-only probes. Any unsuccessful
exit after mutation, including a signal, attempts rollback to the exact retained release. A failed rollback retains a
root-only recovery record and requires operator intervention. Before mutation, promotion creates or verifies the
candidate's protected acceptance record and re-verifies the retained rollback against its own record and closed
manifest both before mutation and immediately before restoration. A legacy release without that record requires a
reviewed migration and cannot become an automatic rollback.

## Netlify adapter

Netlify routes exact root probes and `/api/leads` before the general `/api/*` and SPA fallbacks. Its edge rate rule limits
leads by client IP and domain, while the same bounded stores and 16-delivery in-process gate apply per warm function
instance. Strict site-wide in-flight concurrency requires a verified platform-level concurrency ceiling or a shared
atomic queue; local memory state cannot coordinate horizontally scaled instances. No code in this repository claims
otherwise.
