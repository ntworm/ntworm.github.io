---
title: "Eletronik Fields"
year: 2023
role: "Creator"
country: "Palmas, Tocantins, Brazil"
type: "Generative audiovisual"
links:
  - url: "https://vimeo.com/672483901"
    label: "Vimeo"
tags: ["generative", "code", "audiovisual", "hydra"]
---

## Eletronik Fields

An audiovisual instrument that converts electromagnetic noise into MIDI, into a VST chain, into sound-reactive visuals. Built around a single Max patch with <a class="entity-link" href="https://cycling74.com/products/max" target="_blank" rel="noopener noreferrer">Max 8</a> + <a class="entity-link" href="https://hydra.ojack.xyz" target="_blank" rel="noopener noreferrer">Hydra.js</a> + <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> + Zwobot. The piece ran as a live installation and short film.

The original instrument lives in a small farm in Tocantins, surrounded by fields of low-power FM transmitters. The point was to translate the radio spectrum into something a person could hear and see in the same room.

## The signal chain

A magnetic induction coil — the kind used to find buried wires — picks up the electromagnetic field around the coil and turns it into audio-rate voltage. That signal feeds straight into a <a class="entity-link" href="https://cycling74.com/products/max" target="_blank" rel="noopener noreferrer">Max 8</a> patch that does the actual translation work: envelope followers, FFT analysis, and a small set of heuristics that decide when the field is interesting enough to count as a *note*. The resulting MIDI runs through a short <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> VST chain and out to the room.

The same FFT analysis drives a <a class="entity-link" href="https://hydra.ojack.xyz" target="_blank" rel="noopener noreferrer">Hydra.js</a> canvas in a second window: amplitude drives brightness, dominant frequency drives hue, and a slow LFO on top modulates the rate at which the canvas redraws. The point is that audio and visuals are reading the same signal at the same time — nothing in the visuals is faked.

## Staging

In performance the canvas is projected full-frame onto a dark wall. The audience stands or sits within two or three metres of the coil; the audio mix has to compete with whatever the coil is picking up at that moment, which is never the same twice. There is no score, no setlist, and no fixed duration — the run is as long as the field stays interesting.

The same setup was filmed and edited into a short documentary piece. The film keeps the live framing intact — one camera on the coil, one on the projection, one on the room — and lets the signal itself do the editing.