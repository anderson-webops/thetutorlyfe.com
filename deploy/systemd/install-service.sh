#!/usr/bin/env bash
# Bootstrap only from a separately reviewed, root-owned checkout, never a build tree.
set -euo pipefail

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH
unset NODE_OPTIONS NODE_PATH PYTHONPATH PYTHONHOME
umask 077

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo 'Run the reviewed administrative installer as root.' >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
source_root="$(cd -- "$script_dir/../.." && pwd -P)"
node_bin_dir="${NODE_BIN_DIR:-/opt/node-24.18.1/bin}"
/usr/bin/python3 -I "$script_dir/trusted-paths.py" --tree "$script_dir" \
  "$source_root/scripts/runtime-artifact.py" "$source_root/deploy/runtime-artifact.json" \
  "$source_root/package.json" "$source_root/scripts/write-release-metadata.mjs" \
  "$node_bin_dir/node"
if [[ "$("$node_bin_dir/node" --version)" != v24.18.1 ]]; then
  echo 'NODE_BIN_DIR must select Node 24.18.1 without replacing the host-wide runtime.' >&2
  exit 1
fi

version="$("$node_bin_dir/node" -p 'require(process.argv[1]).version' "$source_root/package.json")"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
helper_parent=/usr/local/libexec/thetutorlyfe-release
if [[ -e "$helper_parent" || -L "$helper_parent" ]]; then
  /usr/bin/python3 -I "$script_dir/trusted-paths.py" "$helper_parent"
fi
helper_root="$helper_parent/$version"
if [[ -e "$helper_root" || -L "$helper_root" ]]; then
  echo "Reviewed helper version already exists: $helper_root. Do not overwrite it." >&2
  exit 1
fi

unit=/etc/systemd/system/thetutorlyfe-api.service
if [[ ! -e "$unit" && "$node_bin_dir" != /opt/node-24.18.1/bin ]]; then
  echo 'Review the unit ExecStart for this alternate runtime before installing the service.' >&2
  exit 1
fi

base=/srv/thetutorlyfe.com
for directory in "$base" "$base/releases"; do
  if [[ -e "$directory" || -L "$directory" ]]; then
    /usr/bin/python3 -I "$script_dir/trusted-paths.py" "$directory"
  fi
done

if ! getent group thetutorlyfe >/dev/null; then
  groupadd --system thetutorlyfe
fi
if ! id thetutorlyfe >/dev/null 2>&1; then
  useradd --system --gid thetutorlyfe --home-dir "$base" --shell /usr/sbin/nologin thetutorlyfe
fi
service_uid="$(id -u thetutorlyfe)"
service_gid="$(id -g thetutorlyfe)"

ensure_directory() {
  local path="$1" owner="$2" group="$3" mode="$4"
  if [[ ! -e "$path" ]]; then
    install -d -o "$owner" -g "$group" -m "$mode" "$path"
    return
  fi
  if [[ -L "$path" || ! -d "$path" ]]; then
    echo "Expected a real runtime directory: $path" >&2
    exit 1
  fi
  if [[ "$(stat -c '%u:%g:%a' "$path")" != "$owner:$group:$mode" ]]; then
    echo "Existing runtime directory metadata needs operator review; left unchanged: $path" >&2
    exit 1
  fi
}

ensure_directory "$base" 0 "$service_gid" 750
ensure_directory "$base/releases" 0 "$service_gid" 750
for directory in "$base/builds" "$base/shared"; do
  ensure_directory "$directory" "$service_uid" "$service_gid" 700
done

config_root=/etc/thetutorlyfe.com
ensure_directory "$config_root" 0 0 700
environment_file="$config_root/api.env"
if [[ ! -e "$environment_file" ]]; then
  install -o root -g root -m 0600 "$script_dir/api.env.example" "$environment_file"
elif [[ -L "$environment_file" || ! -f "$environment_file" || "$(stat -c '%u:%g:%a' "$environment_file")" != 0:0:600 ]]; then
  echo "Existing protected environment metadata needs operator review; left unchanged: $environment_file" >&2
  exit 1
fi

mkdir -p -- "$helper_parent"
/usr/bin/python3 -I "$script_dir/trusted-paths.py" "$helper_parent"
install -d -o root -g root -m 0755 "$helper_root" "$helper_root/scripts" "$helper_root/deploy" "$helper_root/deploy/systemd"
install -o root -g root -m 0755 \
  "$script_dir/promote-release.sh" "$script_dir/trusted-paths.py" \
  "$helper_root/deploy/systemd/"
install -o root -g root -m 0755 "$source_root/scripts/runtime-artifact.py" "$helper_root/scripts/"
install -o root -g root -m 0644 "$source_root/deploy/runtime-artifact.json" "$helper_root/deploy/"

if [[ ! -e "$unit" ]]; then
  install -o root -g root -m 0644 "$script_dir/thetutorlyfe-api.service" "$unit"
  systemctl daemon-reload
  systemctl enable thetutorlyfe-api.service
fi

echo "Installed protected The Tutor Lyfe release helpers at $helper_root. Existing units and services were not changed or restarted."
