#!/bin/bash
# Called by Icecast when a broadcaster connects
# Icecast passes the mount as $ICECAST_ARG_MOUNT environment variable
# Install to /etc/icecast2/on-connect.sh and chmod +x

MOUNT="${ICECAST_ARG_MOUNT}"
WEBHOOK_URL="https://castlr.vercel.app/api/stream/webhook"
WEBHOOK_SECRET="YOUR_STREAM_WEBHOOK_SECRET"

curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d "{\"event\":\"connect\",\"mount\":\"$MOUNT\"}" \
  > /var/log/icecast2/webhook.log 2>&1
