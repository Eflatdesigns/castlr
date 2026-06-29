#!/bin/bash
# Called by Icecast when a broadcaster disconnects
# Install to /etc/icecast2/on-disconnect.sh and chmod +x

MOUNT="${ICECAST_ARG_MOUNT}"
WEBHOOK_URL="https://castlr.vercel.app/api/stream/webhook"
WEBHOOK_SECRET="YOUR_STREAM_WEBHOOK_SECRET"

curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d "{\"event\":\"disconnect\",\"mount\":\"$MOUNT\"}" \
  > /var/log/icecast2/webhook.log 2>&1
