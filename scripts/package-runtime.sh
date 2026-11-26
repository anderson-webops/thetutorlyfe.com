#!/usr/bin/env bash
# Package already validated, compiled source away from the production host.
set -euo pipefail

root=$(cd -- "$(dirname -- "$0")/.." && pwd)
cd -- "$root"
test "$(uname -s)" = Linux
test "$(uname -m)" = aarch64
test "$(node --version)" = v26.13.1
test "$(npm --version)" = 12.2.2
toolchain_receipt=$(node scripts/check-build-toolchain.mjs)
test -z "$(git status --porcelain)"
commit=$(git rev-parse HEAD)
output=$(realpath "${1:?Pass an empty output directory under .ai-work/runs}")
case "$output/" in
  "$root/.ai-work/runs/"*) ;;
  *) echo 'Output must be repository-owned scratch beneath .ai-work/runs' >&2; exit 1 ;;
esac
test -z "$(find "$output" -mindepth 1 -maxdepth 1 -print -quit)"

stage="$output/stage"
mkdir -p "$stage/back-end" "$stage/front-end/.output"
TUTORLYFE_RELEASE="v$(node -p 'require("./package.json").version')"
export TUTORLYFE_RELEASE
export TUTORLYFE_COMMIT_SHA="$commit"
export TUTORLYFE_DEPLOYED_AT
TUTORLYFE_DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
asset_prefix="thetutorlyfe-com-$TUTORLYFE_RELEASE-${commit:0:12}"
node scripts/write-release-metadata.mjs
cp package.json package-lock.json .tutorlyfe-release-prepared.json "$stage/"
cp back-end/package.json back-end/package-lock.json "$stage/back-end/"
mkdir -p "$stage/back-end/vendor"
for archive in qs-6.17.2-webops.5 cookie-2.0.2-webops.2 encodeurl-3.0.1-webops.2 raw-body-4.0.0-webops.2 type-is-3.0.0-webops.2; do
  cp "back-end/vendor/$archive.tgz" "$stage/back-end/vendor/"
done
cp front-end/package.json "$stage/front-end/"
cp -R back-end/dist "$stage/back-end/"
cp -R front-end/.output/public "$stage/front-end/.output/"

npm ci --prefix "$stage/back-end" --omit=dev --include=optional --workspaces=false --ignore-scripts --no-fund --no-audit
npm audit --prefix "$stage/back-end" --omit=dev --audit-level=low
npm audit --prefix "$stage/back-end" --audit-level=low
npm audit signatures --prefix "$stage/back-end"
npm ls --prefix "$stage/back-end" --omit=dev --all > "$output/$asset_prefix-dependency-tree.txt"
for archive in qs-6.17.2-webops.5 cookie-2.0.2-webops.2 encodeurl-3.0.1-webops.2 raw-body-4.0.0-webops.2 type-is-3.0.0-webops.2; do
  rm -- "$stage/back-end/vendor/$archive.tgz"
done
rmdir -- "$stage/back-end/vendor"
rm -rf -- "$stage/back-end/node_modules/.bin"

archive="$output/$asset_prefix-linux-arm64.tar.gz"
python3 -B scripts/runtime-artifact.py pack "$stage" --archive "$archive" --commit "$commit" > "$output/pack.json"
sha=$(sha256sum "$archive" | cut -d ' ' -f 1)
printf '%s  %s\n' "$sha" "$(basename "$archive")" > "$output/$asset_prefix-SHA256SUMS"
cp "$stage/runtime-manifest.json" "$output/$asset_prefix-runtime-manifest.json"

mkdir -m 700 "$output/unpacked"
(
  umask 077
  python3 -B scripts/runtime-artifact.py unpack "$output/unpacked" --archive "$archive" --sha256 "$sha" --commit "$commit"
)
bash scripts/test-unpacked-artifact.sh "$output/unpacked"
cp -R "$output/unpacked" "$output/copied"
python3 -B scripts/runtime-artifact.py verify "$output/copied" --archive "$archive" --sha256 "$sha" --commit "$commit"
bash scripts/test-unpacked-artifact.sh "$output/copied"
rm -- "$output/copied/back-end/dist/boundedRateStore.js"
if python3 -B scripts/runtime-artifact.py verify "$output/copied" --archive "$archive" --sha256 "$sha" --commit "$commit"; then
  echo 'Missing runtime module was incorrectly accepted' >&2
  exit 1
fi
bash scripts/test-unpacked-artifact.sh "$output/copied" missing-module

BUILD_TOOLCHAIN_RECEIPT="$toolchain_receipt" python3 -B - "$output" "$asset_prefix" <<'PY'
import datetime
import hashlib
import json
import os
from pathlib import Path
import sys

output = Path(sys.argv[1])
asset_prefix = sys.argv[2]
receipt = json.loads((output / "pack.json").read_text())
receipt["acceptedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
receipt["buildToolchain"] = json.loads(os.environ["BUILD_TOOLCHAIN_RECEIPT"])
receipt["bytes"] = (output / receipt["archive"]).stat().st_size
receipt["checks"] = [
    "production-only locked install",
    "full and production backend audits",
    "registry signatures",
    "closed manifest and independent required paths",
    "isolated unpacked runtime",
    "readiness failure and recovery",
    "GET and HEAD minimal probes",
    "synthetic in-process lead delivery",
    "repeated-signal drain",
    "restart",
    "post-copier verification",
    "missing-module rejection",
]
receipt["harnessSha256"] = {
    name: hashlib.sha256(Path(name).read_bytes()).hexdigest()
    for name in [
        "deploy/runtime-artifact.json",
        "scripts/runtime-artifact.py",
        "scripts/package-runtime.sh",
        "scripts/test-unpacked-artifact.sh",
        "scripts/direct-runtime-smoke.mjs",
        "scripts/artifact-acceptance/runtime.mjs",
        "scripts/write-release-metadata.mjs",
        "deploy/systemd/install-service.sh",
        "deploy/systemd/promote-release.sh",
        "deploy/systemd/trusted-paths.py",
        "scripts/test-promotion-recovery.py",
        "scripts/test-promotion-recovery.sh",
        "scripts/check-build-toolchain.mjs",
        "scripts/build-toolchain.mjs",
        "scripts/build-toolchain-state.mjs",
        "scripts/build-toolchain-cache.mjs",
        "scripts/build-toolchain-seed.mjs",
        "build-toolchain/PAYLOAD.json",
        "build-toolchain/UPSTREAM.json",
        "build-toolchain/package.json",
        "build-toolchain/package-lock.json",
    ]
}
(output / f"{asset_prefix}-acceptance.json").write_text(json.dumps(receipt, indent=2) + "\n")
PY

echo "Exact unpacked production artifact accepted: $archive"
