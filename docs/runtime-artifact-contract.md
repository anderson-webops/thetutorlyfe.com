# Direct runtime artifact contract

`deploy/runtime-artifact.json` independently declares the direct production entrypoint, required files, static tree,
production dependency root, runtime, generated clients, native bindings, writable state, private configuration, and host
topology. Empty arrays are reviewed declarations, not omissions to fill implicitly.

The current direct runtime has one compiled Express entrypoint, no modules outside `back-end/dist`, no generated client,
no native production binding, no database, no queue, and no writable application state. Logs remain in the existing
service journal. `LEAD_WEBHOOK_URL` remains in the protected host environment and must never enter the archive.

## Acceptance invariants

- Build only from a clean exact annotated release commit on Linux ARM64 with Node 24.18.1 and npm 12.0.2.
- Install the standalone backend from `back-end/package-lock.json` with no fallback and no development packages.
- Inventory every file by path, size, and SHA-256; independently require critical files so an incomplete self-authored
  inventory cannot pass.
- Reject symlinks, unsafe archive members, environment files, credentials, keys, databases, undeclared native code,
  unrelated dependencies, version drift, or release-identity drift.
- Test the exact unpacked artifact read-only without the source checkout, development dependencies, host environment, or
  external network. The provider is replaced by an injected in-process fixture, so acceptance cannot send a real lead.
- Exercise compiled startup, liveness, readiness failure and recovery, synthetic lead delivery, route policy, repeated
  shutdown signals, clean drain, restart, copier verification, and deliberate missing-module rejection.
- Publish the original archive digest, closed manifest, and acceptance receipt with the matching release. A deployment
  copier cannot establish trust by rehashing its own output. Release assets are commit-qualified, and an existing
  release is never overwritten by a workflow rerun.

## Host boundary

The direct host keeps static output and the API isolated from protected configuration and writable state. Root owns
accepted releases, rollbacks, `current`, recovery records, and versioned administrative helpers. The `thetutorlyfe`
account owns only disposable builds and cache. Preserve loopback port 3006, the existing service identity, Nginx edge,
IPv4 and IPv6 listeners, certificate handling, and `/etc/thetutorlyfe.com/api.env` unless an operator approves a separate
migration. A root-only acceptance record binds each rollback tree to the archive digest, source commit, and closed
manifest that were verified before its first activation; a legacy tree without that record is not eligible for automatic
rollback.

Netlify is a separate adapter and does not consume this direct-runtime archive. It must still pass the same source/API
tests and preserve the same minimal probes, lead semantics, and private webhook boundary.
