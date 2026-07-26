---
title: "RC Setlist"
year: 2026
role: "Author"
country: "Palmas, Tocantins, Brazil"
type: "Ableton Live extension"
production: "Source-available · PolyForm Noncommercial 1.0.0"
links:
  - url: "https://github.com/ntworm/rc-setlist"
    label: "GitHub"
  - url: "https://ntworm.github.io/rc-setlist/"
    label: "Landing"
  - url: "https://github.com/ntworm/rc-setlist/releases/latest"
    label: "Latest release"
tags: ["code", "ableton", "tool", "setlist"]
---

## RC Setlist

A source-available extension for <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> that turns the Arrangement's locators into a live show setlist. It reads the project's named cue points, builds an ordered setlist, and exposes it as two web views served over WebSocket on the local network: <code>/setlist</code> for the operator (next song, current lyrics, tempo, click, transport guard) and <code>/performance</code> for the stage (large-type next lyrics + QR code for phones on the same LAN). Synchronized <code>.lrc</code> lyrics, tempo and click feedback, and a guarded transport (no accidental stop on a busy stage).

Built on the <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton</a> Extensions SDK. No cloud, no account, no telemetry — the desktop extension talks to the browser views on port 4444 over LAN only, so it can run on a festival router or even a phone hotspot without anything leaving the room. Open the QR on the operator's screen, scan it from the stage, and the band reads the rest of the show from a phone.
