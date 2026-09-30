---
role: "Autor"
country: "Palmas, Tocantins, Brasil"
type: "Extensão para Ableton Live"
production: "Código-fonte disponível · PolyForm Noncommercial 1.0.0"
links:
  - url: "https://ntworm.github.io/rc-setlist/"
    label: "Página do projeto"
  - url: "https://github.com/ntworm/rc-setlist/releases/latest"
    label: "Versão mais recente"
---

## RC Setlist

Uma extensão para o <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a>, com código-fonte disponível, que transforma os locators do Arrangement no setlist do show. Ela lê os marcadores nomeados do projeto, monta um setlist ordenado e o publica em duas telas web servidas via WebSocket na rede local: <code>/setlist</code> para o operador (próxima música, letra atual, andamento, click, trava do transporte) e <code>/performance</code> para o palco (os próximos versos em fonte grande + QR code para os celulares na mesma rede). Letras <code>.lrc</code> sincronizadas, indicação de andamento e click, e um transporte com trava de segurança (nada de um stop acidental num palco agitado).

Construída sobre o Extensions SDK oficial da <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton</a> (Live 12.4.5+ Suite, runtime Node.js, `.ablx`). Sem nuvem, sem conta, sem telemetria — a extensão no computador conversa com as telas do navegador pela porta 4444, apenas na rede local, então dá para rodar num roteador de festival ou até no hotspot de um celular sem que nada saia da sala. Abra o QR na tela do operador, escaneie do palco, e a banda acompanha o resto do show pelo celular.
