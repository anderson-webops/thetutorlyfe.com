import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import process from 'node:process'
import { Readable } from 'node:stream'

assert.equal(process.platform, 'linux')
assert.equal(process.arch, 'arm64')
assert.equal(process.version, 'v26.13.1')
assert.equal(process.cwd(), '/app')
assert.ok(['complete', 'missing-module'].includes(process.argv[2]))
for (const absent of [
  '/home/builder',
  '/mnt/input',
  '/app/node_modules',
  '/app/back-end/src',
  '/app/.git',
])
  await assert.rejects(access(absent))

if (process.argv[2] === 'missing-module') {
  const result = spawnSync(process.execPath, ['/app/back-end/dist/server.js'], {
    timeout: 5_000,
    env: {
      DOTENV_CONFIG_PATH: '/absent',
      HOST: '127.0.0.1',
      NODE_ENV: 'production',
      PORT: '18767',
    },
    encoding: 'utf8',
  })
  assert.equal(result.signal, null)
  assert.notEqual(result.status, 0)
  assert.match(result.stderr, /ERR_MODULE_NOT_FOUND/)
  assert.match(result.stderr, /boundedRateStore/)
  console.log(JSON.stringify({ missingRuntimeModule: 'rejected by compiled entrypoint' }))
}
else {
  const metadata = JSON.parse(await readFile('/app/front-end/.output/public/release.json', 'utf8'))
  const manifest = JSON.parse(await readFile('/app/runtime-manifest.json', 'utf8'))
  assert.equal(metadata.commitSha, manifest.commit)
  assert.equal(manifest.contract.runtime.node, '26.13.1')
  assert.equal(manifest.contract.deployment.applicationId, 'thetutorlyfe.com')
  const runtimeRequire = createRequire('/app/back-end/package.json')
  const expressRequire = createRequire(runtimeRequire.resolve('express'))
  const bodyParserRequire = createRequire(expressRequire.resolve('body-parser'))
  const cookie = expressRequire('cookie')
  const encodeUrl = expressRequire('encodeurl')
  const getRawBody = bodyParserRequire('raw-body')
  const typeIs = bodyParserRequire('type-is')
  assert.equal(cookie.serialize('runtime', 'value /', { httpOnly: true, sameSite: 'strict' }), 'runtime=value%20%2F; HttpOnly; SameSite=Strict')
  assert.equal(encodeUrl('/runtime path'), '/runtime%20path')
  assert.equal(typeIs({
    headers: { 'content-type': 'application/problem+json', 'content-length': '1' },
  }, '+json'), 'application/problem+json')
  assert.equal(await getRawBody(Readable.from([
    Buffer.from([118, 0, 0, 0]),
  ]), { encoding: 'utf-32le' }), 'v')
  await assert.rejects(getRawBody(Readable.from([
    Buffer.alloc(3),
  ]), { limit: 2 }), { status: 413, type: 'entity.too.large' })

  const { createApp } = await import('/app/back-end/dist/app.js')
  const guard = spawnSync(process.execPath, ['--input-type=module', '-e', `
    Object.defineProperty(process, 'version', { value: 'v26.13.0' })
    const { createApp } = await import('/app/back-end/dist/app.js')
    createApp()
  `], {
    env: { NODE_ENV: 'production', DOTENV_CONFIG_PATH: '/absent' },
    encoding: 'utf8',
    timeout: 5000,
  })
  assert.equal(guard.signal, null)
  assert.notEqual(guard.status, 0)
  assert.match(guard.stderr, /requires Node.js 26.13.1/)
  let ready = false
  let forwarded = 0
  const app = createApp({
    fetchImpl: async (input, init) => {
      assert.equal(String(input), 'https://provider.invalid/fixture')
      assert.equal(init.method, 'POST')
      assert.ok(init.body instanceof URLSearchParams)
      forwarded += 1
      return new Response(null, { status: 204 })
    },
    isReady: () => ready,
    leadWebhookUrl: 'https://provider.invalid/fixture',
  })
  const server = createServer(app)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const origin = `http://127.0.0.1:${server.address().port}`
    for (const value of [false, true, false, true]) {
      ready = value
      for (const method of ['GET', 'HEAD']) {
        const response = await fetch(`${origin}/readyz`, {
          method,
          signal: AbortSignal.timeout(2_000),
        })
        assert.equal(response.status, value ? 200 : 503)
        assert.equal(response.headers.get('cache-control'), 'no-store')
        assert.equal(response.headers.get('set-cookie'), null)
        assert.equal(response.headers.get('location'), null)
        assert.equal(await response.text(), method === 'HEAD'
          ? ''
          : JSON.stringify({ ok: value }))
      }
    }

    const lead = await fetch(`${origin}/api/leads`, {
      body: JSON.stringify({
        email: 'fixture@example.invalid',
        grade: '5th Grade',
        message: 'Synthetic acceptance fixture only.',
        parentName: 'Fixture Parent',
        phone: '5551234567',
        preferred: 'Never sent externally',
        studentName: 'Fixture Student',
        subject: 'General Math Help',
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
      signal: AbortSignal.timeout(2_000),
    })
    assert.equal(lead.status, 202)
    assert.deepEqual(await lead.json(), { ok: true })
    assert.equal(forwarded, 1)
  }
  finally {
    await new Promise((resolve, reject) => server.close(error => error
      ? reject(error)
      : resolve()))
  }

  for (let run = 0; run < 2; run++) {
    const result = spawnSync(process.execPath, ['/harness/direct-runtime-smoke.mjs', '/app'], {
      env: { PATH: '/runtime:/usr/bin:/bin' },
      stdio: 'inherit',
      timeout: 30_000,
    })
    assert.equal(result.signal, null)
    assert.equal(result.status, 0)
  }
  console.log(JSON.stringify({
    sterileArtifact: 'passed',
    commit: manifest.commit,
    readinessRecovery: true,
    syntheticLead: true,
    restart: true,
    modernHttpCompatibility: true,
    unsupportedRuntimeRejected: true,
  }))
}
