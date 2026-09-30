# Reverse proxy in front of the Next.js app: HTTPS (Let's Encrypt via the certbot service), gzip,
# long caching of Next.js build assets. The site config is rendered from templates/ with $DOMAIN.
FROM nginx:1.27-alpine

# openssl: temporary self-signed certificate until Let's Encrypt has issued the real one
RUN apk add --no-cache openssl

COPY templates/ /etc/nginx/templates/
COPY snippets/ /etc/nginx/snippets/
COPY 40-certificates.sh /docker-entrypoint.d/40-certificates.sh
RUN chmod +x /docker-entrypoint.d/40-certificates.sh
