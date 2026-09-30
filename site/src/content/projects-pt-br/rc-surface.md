---
role: "Autor"
country: "Palmas, Tocantins, Brasil"
type: "Extensão para Ableton Live"
production: "Código-fonte disponível · PolyForm Noncommercial 1.0.0"
links:
  - url: "https://ntworm.github.io/rc-surface/"
    label: "Página do projeto"
  - url: "https://github.com/ntworm/rc-surface/releases/latest"
    label: "Versão mais recente"
---

## RC Surface

Uma extensão para o <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a>, com código-fonte disponível sob a licença PolyForm Noncommercial 1.0.0. Transforma o navegador de qualquer celular em um controlador MIDI sem fio com múltiplos sensores: 12 pads de performance, dois pads XY (um deles com física), knobs e faders, mapeamento de sensores (movimento, orientação, áudio, visão) e um editor de mapeamento no próprio navegador. Não é preciso instalar nada no celular.

Construída sobre o Extensions SDK oficial da <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton</a> (Live 12.4.5+ Suite, runtime Node.js, `.ablx`). O lado mobile roda como um web app no navegador do celular; o lado desktop roda como uma extensão dentro do Live. Os dois conversam via WebSocket, e o editor de mapeamento também vive no navegador — então dá para montar ou alterar um layout pelo celular com o Live já no palco.
