---
title: "Eletronik Fields"
year: 2023
role: "Creator"
country: "Lisbon, Portugal"
type: "Generative audiovisual"
production: "Sonic Arts course (Artes Sónicas) with Adriana Sá, Universidade Lusófona"
youtubeId: "-LA7Wil530s"
links:
  - url: "https://youtu.be/-LA7Wil530s"
    label: "YouTube"
  - url: "https://vimeo.com/672483901"
    label: "Vimeo"
tags: ["generative", "code", "audiovisual", "hydra"]
---

## Eletronik Fields

An audiovisual performance system that turns the electromagnetic fields of everyday powered objects into MIDI notes, sound and real-time visuals. A magnetic induction coil picks up the fields; a performance patch I developed in Max analyzes the signal, synthesizes sound and sends MIDI notes to instruments in Ableton Live. Custom audio descriptors provide data to modulate visuals in Hydra.js via WebSocket. I built it in 2023, during my undergraduate studies at Universidade Lusófona in Lisbon, in the Sonic Arts course (Artes Sónicas), mentored by professor Adriana Sá.

## Signal chain

- **Capture:** a magnetic induction coil connected to an audio recorder picks up, as an audio signal, the electromagnetic fields of the batteries, lights, chargers, power supplies and phones laid out on the table.
- **Analysis:** a <a class="entity-link" href="https://cycling74.com/products/max" target="_blank" rel="noopener noreferrer">Max</a> patch analyzes that signal in real time. I also coded and customized my own audio descriptors, based on SP Descriptors, to extract sound information used to modulate the visuals.
- **Sound and MIDI:** the same patch synthesizes the sound and sends MIDI notes to the instruments loaded in <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a>.
- **Image:** the descriptors' data leaves Max through a WebSocket server and reaches a browser running <a class="entity-link" href="https://hydra.ojack.xyz" target="_blank" rel="noopener noreferrer">Hydra.js</a>, where it modulates visual parameters across several canvases and processing stages.

The music is composed in real time from that capture. The frequencies and oscillations arriving from each source decide which instrument plays, whether it stays in a low or high register, how dense the notes are and which rhythms come out of it. Moving the coil between the objects on the table is what changes the piece, and the complex patch I developed for the performance handles all of that mapping.

## Field research

Before building the installation, I walked the streets with the coil and the recorder, capturing as many types of electromagnetic field as I could find, to learn how each source behaves through the chain. The survey showed which sources worked best as material: chargers, mobile phones, lights, UPS units and other powered equipment. The recordings from this stage, processed by the system, are the material of the video above.

## Installation

I presented the installation for a single day at Universidade Lusófona, in the Sonic Arts room, during my undergraduate studies. The room was dark and the objects identified in the field research — batteries, chargers, phones, lamps, power supplies — were laid out on a table, with the coil left free for the university audience to handle. Bringing the coil close to an object changes the captured signal, and the system turns that change into sound and projected visuals in real time. The projection faces the person holding the coil, so the result of each movement is immediate. People from the university could also test the coil on their own phones and on the room's lights.
