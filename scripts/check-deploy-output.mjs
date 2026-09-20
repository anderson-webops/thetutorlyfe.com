#!/usr/bin/env node
import { access, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..')
const paths = {
  apiApp: resolve(projectRoot, 'back-end/dist/app.js'),
  apiServer: resolve(projectRoot, 'back-end/dist/server.js'),
  artifactContract: resolve(projectRoot, 'deploy/runtime-artifact.json'),
  artifactPackager: resolve(projectRoot, 'scripts/package-runtime.sh'),
  artifactVerifier: resolve(projectRoot, 'scripts/runtime-artifact.py'),
  directReleaseWorkflow: resolve(projectRoot, '.github/workflows/direct-release.yml'),
  directEnvironmentExample: resolve(projectRoot, 'deploy/systemd/api.env.example'),
  directInstall: resolve(projectRoot, 'deploy/systemd/install-service.sh'),
  directNginx: resolve(projectRoot, 'deploy/nginx/thetutorlyfe.com.server.conf'),
  directPrepare: resolve(projectRoot, 'deploy/systemd/prepare-release.sh'),
  directPromote: resolve(projectRoot, 'deploy/systemd/promote-release.sh'),
  directService: resolve(projectRoot, 'deploy/systemd/thetutorlyfe-api.service'),
  frontendIndex: resolve(projectRoot, 'front-end/.output/public/index.html'),
  netlifyFunction: resolve(projectRoot, 'netlify/functions/api.ts'),
  netlifyConfiguration: resolve(projectRoot, 'netlify.toml'),
  promotionRecoveryTest: resolve(projectRoot, 'scripts/test-promotion-recovery.py'),
  productionVerifier: resolve(projectRoot, 'scripts/verify-production-install.mjs'),
  releaseMetadata: resolve(projectRoot, 'scripts/write-release-metadata.mjs'),
  trustedPaths: resolve(projectRoot, 'deploy/systemd/trusted-paths.py'),
}

for (const path of Object.values(paths))
  await access(path)

const [
  apiApp,
  apiServer,
  artifactContract,
  artifactPackager,
  artifactVerifier,
  directReleaseWorkflow,
  directEnvironmentExample,
  directInstall,
  directNginx,
  directPrepare,
  directPromote,
  directService,
  frontendIndex,
  netlifyConfiguration,
  promotionRecoveryTest,
  productionVerifier,
  releaseMetadata,
  trustedPaths,
] = await Promise.all([
  readFile(paths.apiApp, 'utf8'),
  readFile(paths.apiServer, 'utf8'),
  readFile(paths.artifactContract, 'utf8'),
  readFile(paths.artifactPackager, 'utf8'),
  readFile(paths.artifactVerifier, 'utf8'),
  readFile(paths.directReleaseWorkflow, 'utf8'),
  readFile(paths.directEnvironmentExample, 'utf8'),
  readFile(paths.directInstall, 'utf8'),
  readFile(paths.directNginx, 'utf8'),
  readFile(paths.directPrepare, 'utf8'),
  readFile(paths.directPromote, 'utf8'),
  readFile(paths.directService, 'utf8'),
  readFile(paths.frontendIndex, 'utf8'),
  readFile(paths.netlifyConfiguration, 'utf8'),
  readFile(paths.promotionRecoveryTest, 'utf8'),
  readFile(paths.productionVerifier, 'utf8'),
  readFile(paths.releaseMetadata, 'utf8'),
  readFile(paths.trustedPaths, 'utf8'),
])

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

assert(/http-equiv=["']content-security-policy["']/i.test(frontendIndex), 'Generated HTML must include a CSP meta policy')
assert(!frontendIndex.includes('http://localhost:3006'), 'Generated HTML must not embed the local API origin')
assert(!frontendIndex.includes('/api/pageview'), 'Generated HTML must not reference the removed mutable endpoint')
assert(!apiApp.includes('startedAt') && !apiApp.includes('pageview'), 'Compiled API must not expose process timing or page-view state')
assert(apiApp.includes('BoundedRateStore'), 'Compiled API must use bounded rate storage')
assert(apiServer.includes('maxConnections = 128'), 'Compiled API server must cap aggregate connections')
assert(!apiApp.includes('sourceMappingURL') && !apiServer.includes('sourceMappingURL'), 'Production API output must not expose source maps')
assert(/^User=thetutorlyfe$/m.test(directService), 'Direct API service must use its unprivileged account')
assert(/^WorkingDirectory=\/srv\/thetutorlyfe\.com\/current$/m.test(directService), 'Direct API service must use The Tutor Lyfe release root')
assert(/^EnvironmentFile=-\/etc\/thetutorlyfe\.com\/api\.env$/m.test(directService), 'Direct API service must load its server-only configuration')
assert(/^Environment=HOST=127\.0\.0\.1$/m.test(directService), 'Direct API service must bind only to loopback')
assert(/^ExecStart=\/opt\/node-24\.18\.1\/bin\/node back-end\/dist\/server\.js$/m.test(directService), 'Direct API service must use the approved isolated Node runtime')
assert(/^NoNewPrivileges=true$/m.test(directService), 'Direct API service must deny privilege escalation')
assert(/^ProtectSystem=strict$/m.test(directService), 'Direct API service must have a read-only system view')
assert(!/0\.0\.0\.0|docker/i.test(directService), 'Direct API service must not depend on a container listener')
assert(/^LEAD_WEBHOOK_URL=$/m.test(directEnvironmentExample), 'Direct deployment must document the server-only lead destination')
assert(/thetutorlyfe-api\.service/.test(directInstall), 'Direct installer must install The Tutor Lyfe API service')
assert(/\/srv\/thetutorlyfe\.com/.test(directInstall), 'Direct installer must create The Tutor Lyfe release root')
assert(/\/usr\/local\/libexec\/thetutorlyfe-release/.test(directInstall), 'Direct installer must create versioned protected helpers')
assert(/Existing runtime directory metadata needs operator review/.test(directInstall), 'Direct installer must not silently rewrite an existing host contract')
assert(/proxy_pass http:\/\/127\.0\.0\.1:3006;/.test(directNginx), 'Nginx must proxy the API to loopback')
assert(/location = \/healthz/.test(directNginx) && /location = \/readyz/.test(directNginx), 'Nginx must proxy exact root health and readiness routes')
assert(/root \/srv\/thetutorlyfe\.com\/current\//.test(directNginx), 'Nginx must serve the current The Tutor Lyfe release')
assert(/X-Forwarded-For \$remote_addr/.test(directNginx), 'Nginx must replace, not append, the forwarded chain')
assert(!/\$proxy_add_x_forwarded_for/.test(directNginx), 'Nginx must not trust a client-supplied forwarded chain')
assert(/npm audit signatures/.test(directPrepare), 'Direct preparation must verify package signatures')
assert(/origin\/main/.test(directPrepare), 'Direct preparation must require the exact remote main revision')
assert(/--unset-all http\.https:\/\/github\.com\/\.extraheader/.test(directPrepare), 'Release preparation must remove the checkout credential before dependency scripts run')
assert(/TUTORLYFE_RELEASE/.test(directPrepare) && /TUTORLYFE_COMMIT_SHA/.test(directPrepare), 'Release preparation must export downstream identity variables')
assert(/--ipv4/.test(directPromote) && /--ipv6/.test(directPromote), 'Promotion must gate both address families')
assert(/runtime-artifact\.py" verify/.test(directPromote), 'Promotion must verify the exact accepted artifact with the protected verifier')
assert(/--archive/.test(directPromote) && /--sha256/.test(directPromote) && /--commit/.test(directPromote), 'Promotion must bind candidate verification to archive, digest, and commit')
assert(/acceptance_root=.*accepted/.test(directPromote) && /--manifest-sha256/.test(directPromote), 'Promotion must bind every rollback to protected acceptance provenance')
assert(!/-X POST|--request POST/.test(directPromote), 'Production acceptance must use only read-only probes')
assert(/if \[\[ -L "\$current_link" \]\]; then/.test(directPromote), 'First promotion must not invent a rollback target')
assert(/restoring the previous direct release/i.test(directPromote), 'Promotion must provide source rollback')

const releaseIdentityFiles = [directPromote, productionVerifier, releaseMetadata]
assert(releaseIdentityFiles.every(source => source.includes('.tutorlyfe-release-prepared.json')), 'Direct release paths must agree on the downstream marker')
assert(releaseIdentityFiles.every(source => !source.includes('.vitesse-release-prepared.json')), 'Direct release paths must not retain the template marker')
assert(/TUTORLYFE_RELEASE/.test(releaseMetadata) && /TUTORLYFE_DEPLOYED_AT/.test(releaseMetadata), 'Release metadata must use downstream identity variables')
assert(!/persist-credentials:\s*true/.test(directReleaseWorkflow), 'Release checkout credentials must never persist into package execution')
assert((directReleaseWorkflow.match(/persist-credentials:\s*false/g) || []).length >= 2, 'Every release checkout must disable persisted credentials')
assert(/ubuntu-24\.04-arm/.test(directReleaseWorkflow), 'Exact direct artifacts must be built on Linux ARM64')
assert(/actions\/upload-artifact@/.test(directReleaseWorkflow), 'Accepted release assets must be retained as workflow evidence')
assert(/gh release create/.test(directReleaseWorkflow), 'Accepted immutable assets must be attached to the release')
assert(!/gh release upload|--clobber/.test(directReleaseWorkflow), 'Published release assets must never be replaced')
assert(/already exists; immutable assets will not be replaced/.test(directReleaseWorkflow), 'A release rerun must fail closed before publishing assets')
assert(/window_limit = 6/.test(netlifyConfiguration) && /aggregate_by = \["ip", "domain"\]/.test(netlifyConfiguration), 'Netlify must enforce edge lead-rate limits across warm instances')
assert(/from = "\/healthz"/.test(netlifyConfiguration) && /from = "\/readyz"/.test(netlifyConfiguration), 'Netlify must route exact root probes through the API')

const contract = JSON.parse(artifactContract)
assert(contract.runtime?.os === 'linux' && contract.runtime?.arch === 'arm64', 'Runtime contract must bind Linux ARM64')
assert(contract.required?.includes('back-end/dist/boundedRateStore.js'), 'Runtime contract must independently require the bounded rate module')
assert(contract.privateConfiguration?.includes('LEAD_WEBHOOK_URL'), 'Runtime contract must keep the webhook outside immutable artifacts')
assert(/git status --porcelain/.test(artifactPackager), 'Artifact packaging must require clean exact source')
assert(/post-copier verification|copied/.test(artifactPackager), 'Artifact packaging must verify the copied runtime tree')
assert(/asset_prefix=.*commit/.test(artifactPackager), 'Published artifact evidence must have commit-qualified names')
assert(/forbidden artifact path/.test(artifactVerifier), 'Artifact verifier must reject unlisted and private paths')
assert(/trusted manifest checksum mismatch/.test(artifactVerifier), 'Artifact verifier must enforce an external manifest digest')
assert(/mutable-candidate/.test(promotionRecoveryTest) && /rollback-provenance-failure/.test(promotionRecoveryTest) && /missing-previous-acceptance/.test(promotionRecoveryTest), 'Promotion tests must exercise mutable candidates, rollback failure, and missing rollback provenance')
assert(/st_uid != 0/.test(trustedPaths) && /0o022/.test(trustedPaths), 'Administrative paths must be root-owned and non-writable')

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
