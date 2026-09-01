#!/usr/bin/env bash
set -euo pipefail

PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export PATH

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
	echo "Run install-service.sh with root privileges." >&2
	exit 1
fi
if [[ ! -x /usr/bin/node || "$(/usr/bin/node --version)" != "v24.18.1" ]]; then
	echo "/usr/bin/node must be Node 24.18.1." >&2
	exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"

if ! getent group thetutorlyfe >/dev/null; then
	groupadd --system thetutorlyfe
fi
if ! id thetutorlyfe >/dev/null 2>&1; then
	useradd --system --gid thetutorlyfe --home-dir /srv/thetutorlyfe.com --shell /usr/sbin/nologin thetutorlyfe
fi

install -d -o thetutorlyfe -g thetutorlyfe -m 0750 /srv/thetutorlyfe.com
install -d -o thetutorlyfe -g thetutorlyfe -m 0750 /srv/thetutorlyfe.com/releases
install -d -o thetutorlyfe -g thetutorlyfe -m 0750 /srv/thetutorlyfe.com/shared
install -d -o thetutorlyfe -g thetutorlyfe -m 0700 /srv/thetutorlyfe.com/shared/npm-cache
install -d -o root -g root -m 0700 /etc/thetutorlyfe.com
if [[ -L /etc/thetutorlyfe.com/api.env || ( -e /etc/thetutorlyfe.com/api.env && ! -f /etc/thetutorlyfe.com/api.env ) ]]; then
	echo "Refusing to replace non-file API configuration: /etc/thetutorlyfe.com/api.env" >&2
	exit 1
fi
if [[ ! -e /etc/thetutorlyfe.com/api.env ]]; then
	install -o root -g root -m 0600 "$script_dir/api.env.example" /etc/thetutorlyfe.com/api.env
else
	chown root:root /etc/thetutorlyfe.com/api.env
	chmod 0600 /etc/thetutorlyfe.com/api.env
fi
install -o root -g root -m 0644 "$script_dir/thetutorlyfe-api.service" /etc/systemd/system/thetutorlyfe-api.service

systemctl daemon-reload
systemctl enable thetutorlyfe-api.service

echo "Installed The Tutor Lyfe API service without starting it. Configure the lead webhook, install the Nginx server snippet, and promote a prepared release."
