#!/bin/bash
# Called by Icecast when a broadcaster connects
# Icecast passes the mount as $ICECAST_ARG_MOUNT environment variable
# Install to /etc/icecast2/on-connect.sh and chmod +x

MOUNT="${ICECAST_ARG_MOUNT}"
WEBHOOK_URL="https://castlr.vercel.app/api/stream/webhook"
WEBHOOK_SECRET="a8e523dd2d55411dcceba0e90cc02dc06958a78a605325de9a22f0cb2c89de0f"

curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $WEBHOOK_SECRET" \
  -d "{\"event\":\"connect\",\"mount\":\"$MOUNT\"}" \
  > /var/log/icecast2/webhook.log 2>&1
