---
role: "Criador"
country: "Lisboa, Portugal"
type: "Audiovisual generativo"
production: "Disciplina de Artes Sónicas com Adriana Sá, Universidade Lusófona"
---

## Eletronik Fields

Sistema audiovisual de performance que transforma os campos eletromagnéticos de aparelhos e objetos sobre uma mesa em notas MIDI, som e visuais em tempo real. Uma bobina de indução magnética capta os campos; um patch de performance que desenvolvi no Max analisa o sinal, realiza síntese sonora e envia notas MIDI para instrumentos no Ableton Live. Descritores de áudio próprios fornecem dados para modular as imagens no Hydra.js, via WebSocket. Fiz o trabalho em 2023, durante a graduação na Universidade Lusófona, em Lisboa, na disciplina de Artes Sónicas, com a professora Adriana Sá.

## Cadeia de sinal

- **Captação:** uma bobina de indução magnética ligada a um gravador de áudio capta, como sinal de áudio, os campos eletromagnéticos das baterias, lâmpadas, carregadores, fontes e celulares dispostos sobre a mesa.
- **Análise:** um patch do <a class="entity-link" href="https://cycling74.com/products/max" target="_blank" rel="noopener noreferrer">Max</a> analisa esse sinal em tempo real. Também programei e customizei descritores de áudio próprios, baseados em SP Descriptors, para obter informações sonoras usadas na modulação visual.
- **Som e MIDI:** o mesmo patch sintetiza o som e envia notas MIDI para os instrumentos carregados no <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a>.
- **Imagem:** os dados dos descritores saem do Max por um servidor WebSocket e chegam a um navegador rodando <a class="entity-link" href="https://hydra.ojack.xyz" target="_blank" rel="noopener noreferrer">Hydra.js</a>, onde modulam parâmetros visuais em vários canvases e etapas de processamento.

A música é composta em tempo real a partir dessa captação. As frequências e oscilações que chegam de cada fonte decidem qual instrumento toca, se ele fica num registro grave ou agudo, qual é a densidade das notas e quais ritmos resultam disso. É mover a bobina entre os objetos da mesa que faz a peça mudar, e o patch complexo que desenvolvi para a performance cuida de todo esse mapeamento.

## Pesquisa de campo

Antes de montar a instalação, percorri as ruas com a bobina e o gravador, captando o maior número possível de tipos de campo eletromagnético, para entender como cada fonte se comporta ao passar pela cadeia. Esse levantamento mostrou quais fontes funcionavam melhor como material: carregadores, celulares, lâmpadas, nobreaks e outros equipamentos ligados à energia. As gravações dessa etapa, processadas pelo sistema, são o material do vídeo acima.

## Instalação

Apresentei a instalação durante um único dia na Universidade Lusófona, na sala de Artes Sónicas, durante a graduação. A sala ficou escura e os objetos identificados na pesquisa de campo — baterias, carregadores, celulares, lâmpadas, nobreaks — ficaram dispostos sobre uma mesa, com a bobina livre para a comunidade universitária usar. Ao aproximar a bobina de um objeto, o sinal captado muda, e o sistema converte essa variação em som e em visuais projetados em tempo real. A projeção fica de frente para quem está com a bobina, então o resultado de cada movimento é imediato. Quem estudava na universidade também podia testar a bobina nos próprios celulares e nas luzes da sala.
