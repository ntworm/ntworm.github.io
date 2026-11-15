---
title: "aafton"
year: 2026
role: "Author"
country: "Palmas, Tocantins, Brazil"
type: "Session converter (desktop app and CLI)"
production: "Open source · MIT"
links:
  - url: "https://github.com/ntworm/aafton"
    label: "GitHub"
tags: ["code", "ableton", "tool", "post-production", "aaf"]
---

## aafton

An open-source converter for post-production sound sessions. It moves a session between AAF, EDL, Final Cut Pro XML, and <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> 12, so an edit coming from Pro Tools, DaVinci Resolve, Premiere Pro, or Final Cut Pro can be opened and worked on in Live, and sent back as AAF for the mix.

## Why I built it

I have spent years in film and series sound: editing the ambience beds of a TV series in Lisbon, directing sound on short films, finishing features here in Tocantins. Ableton Live is where I compose, design sounds, and think about a scene. The picture, though, always arrives as an AAF made for Pro Tools. On every job I had the same choice: rebuild the editor's session by hand in Live, clip by clip, or leave Live out of the film altogether.

aafton is the bridge I needed. The editor's session opens in Live the way it was cut, with stereo pairs joined, fades in place, the media found, and the reference video lined up with the session's timecode. When the work is done, the set goes back to the mix room as an AAF that nobody has to repair. Production sound from the field recorder comes in too, organised by shooting day.

## Made to be trusted

A converter that moves a session by a few samples is worse than none: the dialogue slips off the lips and nobody notices until the mix. So aafton checks its own work. After each conversion it compares where every clip starts and ends in the original and in the Live set and reports any difference, and when something in the session cannot be carried over exactly, it stops and says what, instead of handing over a set that looks right and is not.

It has been run on real Pro Tools and Premiere Pro sessions, there and back, with every clip landing exactly where it started, including drop-frame sessions, where a common shortcut drifts more than three seconds per hour.

## Status

- **Runs on**: Windows desktop app, or any system with Python 3.10+
- **Licence**: MIT, source on GitHub
- **Stage**: pre-alpha; every converted session should still be checked against its source
