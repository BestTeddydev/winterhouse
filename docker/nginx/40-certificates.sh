#!/bin/sh
# Runs before nginx starts (official image's /docker-entrypoint.d hook).
# nginx needs a certificate to start listening on 443, but Let's Encrypt can only issue one once
# nginx answers on port 80. So /etc/nginx/certs points at the Let's Encrypt certificate when it
# exists, and at a temporary self-signed one until then.
set -e

LIVE="/etc/letsencrypt/live/${DOMAIN}"
CERTS=/etc/nginx/certs
mkdir -p "$CERTS"

use_letsencrypt() {
  [ -f "$LIVE/fullchain.pem" ] || return 1
  ln -sf "$LIVE/fullchain.pem" "$CERTS/fullchain.pem"
  ln -sf "$LIVE/privkey.pem" "$CERTS/privkey.pem"
}

if use_letsencrypt; then
  echo "Using the Let's Encrypt certificate for ${DOMAIN}"
else
  echo "No certificate for ${DOMAIN} yet: using a temporary self-signed one"
  openssl req -x509 -nodes -newkey rsa:2048 -days 7 -subj "/CN=${DOMAIN}" \
    -keyout "$CERTS/privkey.pem" -out "$CERTS/fullchain.pem" 2>/dev/null
fi

# Pick up the first certificate and every renewal (certbot renews ~30 days before expiry)
(while :; do sleep 6h; use_letsencrypt && nginx -s reload; done) &
