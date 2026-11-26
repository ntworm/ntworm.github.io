---
title: "Soprü — Show Lighting"
year: 2026
role: "Lighting design and control system"
country: "Palmas, Tocantins, Brazil"
type: "Live show lighting"
production: "Soprü · Cidade do Suor live show"
links:
  - url: "https://onerpm.link/cidade_do_suor"
    label: "Cidade do Suor (album)"
  - url: "https://www.instagram.com/sopruuuuu/"
    label: "Soprü on Instagram"
tags: ["performance", "lighting", "ableton", "lumikit", "live-show", "real-time"]
youtubeShorts:
  - id: "I8gjhhnX5dw"
    title: "Areia no teto"
  - id: "Nj3ahroct6M"
    title: "Bossa"
  - id: "xW3KL8fANdI"
    title: "Somália"
---

## Soprü — Show Lighting

<a class="entity-link" href="https://www.instagram.com/sopruuuuu/" target="_blank" rel="noopener noreferrer">Soprü</a> is an indie pop band from Palmas. Their second album, *Cidade do Suor*, came out on 22 September 2026 through Rockambole: eight songs made possible by the PNAB, Brazil's national cultural funding policy. The cover maps a sun-baked island of buildings, rivers, animals, and synthesizers, and the live show carries that palette onto the stage.

I designed the lighting for the album's live show and built the system that runs it. The light is written as automation on the timeline of its own Ableton Live set, which runs in step with the band's set song by song.

## The control system

Instead of operating a lighting desk by hand, I built a control layer inside <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a>. A light track holds racks of knobs (colour themes drawn from the album's palette, fixture groups, intensity, combined looks, moving-head positions, and effects) that send MIDI to LumiKit SHOW, which drives the fixtures over Art-Net. Each song's light is written as automation in the arrangement, so a cue lands on the same beat every night, and the effects that should breathe with the music follow the show's tempo.

The show files are generated and checked by scripts rather than edited by hand, which keeps every version reproducible and lets a change be compared against the last accepted show before it reaches the stage. Every look was previewed in a 3D model of the stage in Capture before reaching the rig. The current patch covers 18 fixtures, including four moving heads, placed from a measured plan of the venue's stage.

## The release show

The album's release show took place on 21 November 2026. It ran on two Ableton Live sessions: Iury Groove, the band's bassist and synth player, ran the backing tracks on his laptop, and I ran the lighting on mine. To keep the two together I built <a class="entity-link" href="/work/rc-setlist">RC Setlist</a>, an Ableton extension made for this band at Iury's request. When he hit play, my session started with his, and the light automation followed his audio song by song through the whole set. My session sent the cues to LumiKit SHOW, which drove the fixtures over Ethernet through a Pro RDM2.

In the videos below, the screen shows my lighting session running the song, next to phone footage from the stage.

## Credits (selected)

- **Band**: Soprü
- **Album**: *Cidade do Suor* (Rockambole, 2026)
- **Lighting design, control system, and programming**: Gabriel Worm
