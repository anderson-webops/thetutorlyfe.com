#!/usr/bin/env bash
set -euo pipefail

version="${1:?Expected a pinned Node version}"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
test "${RUNNER_ENVIRONMENT:-}" = github-hosted
test "$(uname -s)" = Linux
case "${RUNNER_ARCH:-}" in
  X64) architecture=x64 ;;
  ARM64) architecture=arm64 ;;
  *) exit 1 ;;
esac

cache="$(realpath "${RUNNER_TOOL_CACHE:?Expected the runner tool-cache path}")"
test -d "$cache"
expected="$cache/node/$version/$architecture/bin/node"
node="$(realpath "$(command -v node)")"
test "$node" = "$expected"
test -f "$node" && test -O "$node"
chmod go-w "$node"
test "$("$node" --version)" = "v$version"
