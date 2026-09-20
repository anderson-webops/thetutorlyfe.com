import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import process from 'node:process'

assert.equal(process.platform, 'linux')
assert.equal(process.arch, 'arm64')
assert.equal(process.version, 'v24.18.1')
assert.equal(process.cwd(), '/app')
for (const absent of ['/home/builder', '/mnt/input', '/app/node_modules', '/app/back-end/src', '/app/.git'])
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

  const { createApp } = await import('/app/back-end/dist/app.js')
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
        const response = await fetch(`${origin}/readyz`, { method, signal: AbortSignal.timeout(2_000) })
        assert.equal(response.status, value ? 200 : 503)
        assert.equal(response.headers.get('cache-control'), 'no-store')
        assert.equal(response.headers.get('set-cookie'), null)
        assert.equal(response.headers.get('location'), null)
        assert.equal(await response.text(), method === 'HEAD' ? '' : JSON.stringify({ ok: value }))
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
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
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
  }))
}
