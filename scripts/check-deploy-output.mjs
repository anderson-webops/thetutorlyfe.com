#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const paths = {
  apiApp: resolve(projectRoot, 'back-end/dist/app.js'),
  apiServer: resolve(projectRoot, 'back-end/dist/server.js'),
  directEnvironmentExample: resolve(projectRoot, 'deploy/systemd/api.env.example'),
  directInstall: resolve(projectRoot, 'deploy/systemd/install-service.sh'),
  directNginx: resolve(projectRoot, 'deploy/nginx/thetutorlyfe.com.server.conf'),
  directPrepare: resolve(projectRoot, 'deploy/systemd/prepare-release.sh'),
  directPromote: resolve(projectRoot, 'deploy/systemd/promote-release.sh'),
  directService: resolve(projectRoot, 'deploy/systemd/thetutorlyfe-api.service'),
  frontendHealth: resolve(projectRoot, 'front-end/.output/public/healthz'),
  frontendIndex: resolve(projectRoot, 'front-end/.output/public/index.html'),
  netlifyFunction: resolve(projectRoot, 'netlify/functions/api.ts'),
  productionVerifier: resolve(projectRoot, 'scripts/verify-production-install.mjs'),
  releaseMetadata: resolve(projectRoot, 'scripts/write-release-metadata.mjs'),
}

for (const path of Object.values(paths))
  await access(path)

const [
  apiApp,
  apiServer,
  directEnvironmentExample,
  directInstall,
  directNginx,
  directPrepare,
  directPromote,
  directService,
  frontendHealth,
  frontendIndex,
  productionVerifier,
  releaseMetadata,
] = await Promise.all([
  readFile(paths.apiApp, 'utf8'),
  readFile(paths.apiServer, 'utf8'),
  readFile(paths.directEnvironmentExample, 'utf8'),
  readFile(paths.directInstall, 'utf8'),
  readFile(paths.directNginx, 'utf8'),
  readFile(paths.directPrepare, 'utf8'),
  readFile(paths.directPromote, 'utf8'),
  readFile(paths.directService, 'utf8'),
  readFile(paths.frontendHealth, 'utf8'),
  readFile(paths.frontendIndex, 'utf8'),
  readFile(paths.productionVerifier, 'utf8'),
  readFile(paths.releaseMetadata, 'utf8'),
])

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

assert(JSON.parse(frontendHealth).ok === true, 'Static health check must return {"ok":true}')
assert(/http-equiv=["']content-security-policy["']/i.test(frontendIndex), 'Generated HTML must include a CSP meta policy')
assert(!frontendIndex.includes('http://localhost:3006'), 'Generated HTML must not embed the local API origin')
assert(!frontendIndex.includes('/api/pageview'), 'Generated HTML must not reference the removed mutable endpoint')
assert(!apiApp.includes('startedAt') && !apiApp.includes('pageview'), 'Compiled API must not expose process timing or page-view state')
assert(!apiApp.includes('sourceMappingURL') && !apiServer.includes('sourceMappingURL'), 'Production API output must not expose source maps')
assert(/^User=thetutorlyfe$/m.test(directService), 'Direct API service must use its unprivileged account')
assert(/^WorkingDirectory=\/srv\/thetutorlyfe\.com\/current$/m.test(directService), 'Direct API service must use The Tutor Lyfe release root')
assert(/^EnvironmentFile=-\/etc\/thetutorlyfe\.com\/api\.env$/m.test(directService), 'Direct API service must load its server-only configuration')
assert(/^Environment=HOST=127\.0\.0\.1$/m.test(directService), 'Direct API service must bind only to loopback')
assert(/^NoNewPrivileges=true$/m.test(directService), 'Direct API service must deny privilege escalation')
assert(/^ProtectSystem=strict$/m.test(directService), 'Direct API service must have a read-only system view')
assert(!/0\.0\.0\.0|docker/i.test(directService), 'Direct API service must not depend on a container listener')
assert(/^LEAD_WEBHOOK_URL=$/m.test(directEnvironmentExample), 'Direct deployment must document the server-only lead destination')
assert(/thetutorlyfe-api\.service/.test(directInstall), 'Direct installer must install The Tutor Lyfe API service')
assert(/\/srv\/thetutorlyfe\.com/.test(directInstall), 'Direct installer must create The Tutor Lyfe release root')
assert(/proxy_pass http:\/\/127\.0\.0\.1:3006;/.test(directNginx), 'Nginx must proxy the API to loopback')
assert(/root \/srv\/thetutorlyfe\.com\/current\//.test(directNginx), 'Nginx must serve the current The Tutor Lyfe release')
assert(/X-Forwarded-For \$remote_addr/.test(directNginx), 'Nginx must replace, not append, the forwarded chain')
assert(!/\$proxy_add_x_forwarded_for/.test(directNginx), 'Nginx must not trust a client-supplied forwarded chain')
assert(/npm audit signatures/.test(directPrepare), 'Direct preparation must verify package signatures')
assert(/origin\/main/.test(directPrepare), 'Direct preparation must require the exact remote main revision')
assert(/--unset-all http\.https:\/\/github\.com\/\.extraheader/.test(directPrepare), 'Release preparation must remove the checkout credential before dependency scripts run')
assert(/TUTORLYFE_RELEASE/.test(directPrepare) && /TUTORLYFE_COMMIT_SHA/.test(directPrepare), 'Release preparation must export downstream identity variables')
assert(/--ipv4/.test(directPromote) && /--ipv6/.test(directPromote), 'Promotion must gate both address families')
assert(/if \[\[ -L "\$current_link" \]\]; then/.test(directPromote), 'First promotion must not invent a rollback target')
assert(/restoring the previous direct release/i.test(directPromote), 'Promotion must provide source rollback')

const releaseIdentityFiles = [directPromote, productionVerifier, releaseMetadata]
assert(releaseIdentityFiles.every(source => source.includes('.tutorlyfe-release-prepared.json')), 'Direct release paths must agree on the downstream marker')
assert(releaseIdentityFiles.every(source => !source.includes('.vitesse-release-prepared.json')), 'Direct release paths must not retain the template marker')
assert(/TUTORLYFE_RELEASE/.test(releaseMetadata) && /TUTORLYFE_DEPLOYED_AT/.test(releaseMetadata), 'Release metadata must use downstream identity variables')

for (const removedPath of ['.dockerignore', 'Dockerfile', 'compose.yaml', 'docker-compose.yml', 'nginx.conf']) {
  try {
    await access(resolve(projectRoot, removedPath))
    throw new Error(`${removedPath} must be absent from the direct production site`)
  }
  catch (error) {
    if (error?.code !== 'ENOENT')
      throw error
  }
}

console.log('Deployment output check passed for direct systemd/Nginx and Netlify production paths.')
