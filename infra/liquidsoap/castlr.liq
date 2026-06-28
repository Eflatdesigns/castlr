#!/usr/bin/env liquidsoap
# Castlr — Liquidsoap configuration
# Liquidsoap acts as the relay/processor between broadcaster and Icecast.
# It accepts an Icecast source (from OBS/BUTT/etc.), applies normalization,
# then re-outputs to Icecast for listener delivery.
#
# Install: apt install liquidsoap liquidsoap-plugin-icecast
# Run:     liquidsoap /etc/liquidsoap/castlr.liq
#
# For per-channel dynamic routing, see the README. This file shows the
# single-channel pattern; repeat the source/output block per channel.

# --- Configuration ---
let icecast_host = "localhost"
let icecast_port = 8000
let icecast_admin_password = "ICECAST_ADMIN_PASSWORD"

# Castlr webhook to sync live status with the database
let webhook_url = "https://yourdomain.com/api/stream/webhook"
let webhook_secret = "YOUR_STREAM_WEBHOOK_SECRET"

# --- Fallback: silence when no broadcaster is connected ---
let fallback_source = blank()

# --- Per-channel relay pattern ---
# Repeat this block for each channel, replacing CHANNEL_SLUG and STREAM_PASSWORD

def make_channel(slug, password) =
  # Accept incoming Icecast source from broadcaster
  input_source = input.harbor(
    slug,
    port=8000,
    password=password,
    on_connect=(fun (~headers, ~uri, ~protocol, ip) ->
      log("#{slug}: broadcaster connected from #{ip}")
      ignore(http.post(
        webhook_url,
        headers=[("x-webhook-secret", webhook_secret), ("content-type", "application/json")],
        data="{\"event\":\"connect\",\"mount\":\"/#{slug}\"}"
      ))
    ),
    on_disconnect=(fun () ->
      log("#{slug}: broadcaster disconnected")
      ignore(http.post(
        webhook_url,
        headers=[("x-webhook-secret", webhook_secret), ("content-type", "application/json")],
        data="{\"event\":\"disconnect\",\"mount\":\"/#{slug}\"}"
      ))
    )
  )

  # Normalize audio levels and apply gentle compression
  processed = normalize(
    target=-14.0,
    window=0.03,
    gain_min=-12.0,
    gain_max=12.0,
    input_source
  )

  # Fallback to silence if broadcaster disconnects
  stream = fallback(track_sensitive=false, [processed, fallback_source])

  # Output to Icecast for listener delivery
  output.icecast(
    %mp3(bitrate=128, stereo=true),
    host=icecast_host,
    port=icecast_port,
    password=icecast_admin_password,
    mount="/#{slug}",
    name=slug,
    description="Castlr channel: #{slug}",
    public=true,
    stream
  )
end

# Dynamic harbor: any valid Icecast source connecting to /mountname is accepted.
# For dynamic per-user channels without restarting Liquidsoap, use input.harbor
# with a wildcard and validate the password against the Castlr API.
def dynamic_harbor() =
  auth = fun(~address, ~login, password) ->
    # Call Castlr API to validate mount + password
    result = http.get(
      "https://yourdomain.com/api/stream/auth?mount=#{login}&password=#{password}"
    )
    result.status_code == 200
  end

  input.harbor(
    "/",
    port=8000,
    auth=auth,
    on_connect=(fun (~headers, ~uri, ~protocol, ip) ->
      log("Dynamic connect from #{ip}: #{uri}")
    )
  )
end

# Uncomment to use static single-channel mode:
# make_channel("my-station", "STREAM_PASSWORD")

# Or enable dynamic routing:
# dynamic_harbor()
