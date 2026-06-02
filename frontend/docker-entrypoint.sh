#!/bin/sh
set -e

# Stamp runtime env vars into the pre-built env.js asset, then start nginx.
# Only the two listed variables are substituted; all other ${...} in the file
# are left untouched.
envsubst '${API_URL} ${WS_URL}' \
  < /usr/share/nginx/html/assets/env.js \
  > /tmp/env.js
mv /tmp/env.js /usr/share/nginx/html/assets/env.js

exec nginx -g 'daemon off;'
