---
title: "Kakofoni Orquestra"
year: 2022
role: "Collaborator + Programmer (audio + reactivity)"
country: "Web-based (Tezos / fxhash)"
type: "Generative audiovisual"
collaborator: "Rangga Purnama Aji (main visuals)"
links:
  - url: "https://www.fxhash.xyz/article/kakofoni-orquestra"
    label: "fxhash article"
  - url: "https://www.fxhash.xyz/iteration/kakofoni-orquestra-37"
    label: "Edition #37 (Madison Museum)"
  - url: "https://www.fxhash.xyz/u/nt_worm"
    label: "nt_worm profile"
tags: ["hydra", "ableton", "max-live", "generative", "fxhash", "audiovisual"]
---

## Kakofoni Orquestra

A generative audiovisual piece published on [fxhash](https://www.fxhash.xyz/article/kakofoni-orquestra). I handled **audio and reactive elements** — Hydra.js for visuals was by <a class="entity-link" href="https://www.instagram.com/ranggapurnamaaji/" target="_blank" rel="noopener noreferrer">Rangga Purnama Aji</a>. The piece is inspired by Brian Eno's *Ambient 1: Music for Airports* — a reinterpretation through the lens of two collaborators who hadn't shared a continent, building a piece live over IPFS.

The audio side: ten instruments — orchestral and synthesised — combined through random articulations, tempos, intensities, densities, and dynamics. Web Audio API does the heavy lifting on volume, filter, compression, IR convolution, and FFT analysis. Two FFT readers (one per audio loop) feed RGB / HSV modulations into two Hydra.js gradients in `DIFF` mode, so each loop generates its own colour filter.

Edition #37 of the piece was acquired by the Madison Museum through fxhash, which is the version most people will have seen on social media.
