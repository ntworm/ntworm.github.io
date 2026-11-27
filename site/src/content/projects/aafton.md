---
title: "AAFton"
year: 2026
role: "Author"
country: "Palmas, Tocantins, Brazil"
type: "Session converter (Windows app)"
production: "Beta · US$30 on Gumroad"
links:
  - url: "https://gabworm.gumroad.com/l/imubtk"
    label: "Buy on Gumroad"
  - url: "https://gabworm.gumroad.com/l/mzpwjg"
    label: "Free 10-day trial"
tags: ["code", "ableton", "tool", "post-production", "aaf"]
---

## AAFton

A converter for post-production sound sessions. It opens AAF sessions from DaVinci Resolve, Premiere Pro, Media Composer and Pro Tools in <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> 12, so an edit can be worked on in Live and sent back as AAF for the mix.

## Why I built it

I have spent years in film and series sound: editing the ambience beds of a TV series in Lisbon, directing sound on short films, finishing features here in Tocantins. Ableton Live is where I compose, design sounds, and think about a scene. The picture, though, always arrives as an AAF made for Pro Tools. On every job I had the same choice: rebuild the editor's session by hand in Live, clip by clip, or leave Live out of the film altogether.

AAFton is the bridge I needed. The editor's session opens in Live the way it was cut, with stereo pairs joined, fades in place, the media found, and the reference video lined up with the session's timecode. When the work is done, the set goes back to the mix room as an AAF that nobody has to repair. Production sound from the field recorder comes in too, organised by shooting day.

## Made to be trusted

A converter that moves a session by a few samples is worse than none: the dialogue slips off the lips and nobody notices until the mix. So AAFton checks its own work. After each conversion it compares where every clip starts and ends in the original and in the Live set and reports any difference, and when something in the session cannot be carried over exactly, it stops and says what, instead of handing over a set that looks right and is not.

It has been run on real Pro Tools and Premiere Pro sessions, there and back, with every clip landing exactly where it started, including drop-frame sessions, where a common shortcut drifts more than three seconds per hour.

## Status

- **Runs on**: Windows 10 or 11, 64-bit, with Ableton Live 12; no Mac version yet
- **Licence**: US$30 for one computer, with a free 10-day trial, on Gumroad
- **Stage**: beta; check every converted session against its source before delivery
