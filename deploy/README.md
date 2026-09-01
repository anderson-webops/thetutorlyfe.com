# The Tutor Lyfe Docker-free production rollout

The default self-hosted topology is static Nuxt output served by the host Nginx process plus one loopback-only Express
process managed by systemd. Netlify remains a separate supported Docker-free adapter. There is no production Docker,
Compose, Podman, or container-registry dependency.

## Contact destination handoff

The captured public site referenced a deployed Google Apps Script URL from browser-side JavaScript. The previous Google
Apps Script project, its backend source, and ownership or deployment access were not included in the takeover material.
Treat the captured URL as historical evidence, not as a destination this repository controls. Do not put a webhook URL
in browser code or commit it to Git.

The Tutor Lyfe API accepts validated contact submissions at `POST /api/leads` and forwards them to the operator-owned
HTTPS destination in `LEAD_WEBHOOK_URL`. It sends `application/x-www-form-urlencoded` data with `parentName`,
`studentName`, `email`, `phone`, `grade`, `subject`, `preferred`, `message`, `source`, and `submittedAt`. The destination
must return a `2xx` response for the API to accept the handoff. Obtain a new owner-controlled endpoint, verify its
storage and notification behavior with the site owner, and retain submitted personal information only as long as needed.

For direct production, `install-service.sh` creates `/etc/thetutorlyfe.com/api.env` as a root-owned `0600` file without
overwriting an existing value. Set the real endpoint before the first promotion:

```bash
sudoedit /etc/thetutorlyfe.com/api.env
```

```dotenv
LEAD_WEBHOOK_URL=https://operator-owned.example/webhook
```

For Netlify, set the same server-only variable in the site environment and redeploy. If the variable is missing, contact
submissions fail closed with an unavailable response while the health endpoint remains available. Release promotion does
not send a synthetic lead because that would mutate the external destination; submit and confirm one authorized test lead
after configuration.

## First direct rollout

1. Install Node `24.18.1` at `/usr/bin/node`. Run `sudo deploy/systemd/install-service.sh`; this creates the
   unprivileged `thetutorlyfe` account, `/srv/thetutorlyfe.com`, and the root-owned API environment file, but does not
   start the service. Configure `LEAD_WEBHOOK_URL` as described above.
2. Copy the contents of `deploy/nginx/thetutorlyfe.com.server.conf` into the existing certificate-covered
   `thetutorlyfe.com` TLS server block. Retain its IPv4 and IPv6 listeners, test the complete Nginx configuration, and
   reload it only after a release is prepared.
3. Check out the annotated release tag beneath `/srv/thetutorlyfe.com/releases` as `thetutorlyfe`, then run:

   ```bash
   NPM_CONFIG_CACHE=/srv/thetutorlyfe.com/shared/npm-cache \
   deploy/systemd/prepare-release.sh /srv/thetutorlyfe.com/releases/<release>
   ```

   Preparation rejects source-local environment files and requires a clean checkout at the exact fetched
   `origin/main` and annotated version tag. It validates the full and production dependency graphs, package signatures,
   Linux ARM64 bindings, source, API behavior, generated output, accessibility, and the real minimal direct runtime.
4. Promote as root with the certificate-covered hostname:

   ```bash
   sudo PUBLIC_HOST=thetutorlyfe.com \
   deploy/systemd/promote-release.sh /srv/thetutorlyfe.com/releases/<release>
   ```

   Promotion atomically selects the candidate, restarts the API, reloads Nginx, and verifies API health, exact release
   identity, strict headers, mutation denial on the health route, and reserved API denial through both local IPv4 and
   IPv6 TLS paths. Any failure restores the previous prepared release automatically.

This workflow does not modify DNS, certificates, routing, or firewall policy. Preserve every existing A and AAAA record
and both address families. A or AAAA records are not troubleshooting controls; repair the host listener, certificate,
route, or firewall separately if one family fails.
