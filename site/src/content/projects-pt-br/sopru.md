---
title: "Soprü — Luz do show"
role: "Desenho de luz e sistema de controle"
country: "Palmas, Tocantins, Brasil"
type: "Luz de show ao vivo"
production: "Soprü · show do álbum Cidade do Suor"
links:
  - url: "https://onerpm.link/cidade_do_suor"
    label: "Cidade do Suor (álbum)"
  - url: "https://www.instagram.com/sopruuuuu/"
    label: "Soprü no Instagram"
---

## Soprü — Luz do show

A <a class="entity-link" href="https://www.instagram.com/sopruuuuu/" target="_blank" rel="noopener noreferrer">Soprü</a> é uma banda de indie pop de Palmas. O segundo disco, *Cidade do Suor*, saiu em 22 de setembro de 2026 pela Rockambole: oito canções viabilizadas pela PNAB, a política nacional de fomento à cultura. A capa mapeia uma ilha torrada de sol, com prédios, rios, bichos e sintetizadores, e o show ao vivo leva essa paleta para o palco.

Desenhei a luz do show do álbum e construí o sistema que o comanda. A luz está escrita como automação na linha do tempo de um set próprio do Ableton Live, que anda junto com o set da banda música por música.

## O sistema de controle

Em vez de operar uma mesa de luz à mão, construí uma camada de controle dentro do <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a>. Uma faixa de luz reúne racks de knobs (temas de cor tirados da paleta do álbum, grupos de aparelhos, intensidade, combinações prontas, posições dos moving heads e efeitos) que mandam MIDI ao LumiKit SHOW, que comanda os aparelhos por Art-Net. A luz de cada música é escrita como automação no arrangement, então cada mudança cai no mesmo tempo toda noite, e os efeitos que precisam respirar com a música seguem o andamento do show.

Os arquivos do show são gerados e conferidos por scripts em vez de editados à mão, o que mantém cada versão reproduzível e permite comparar uma mudança com o último show aceito antes de ela chegar ao palco. Cada cena foi vista num modelo 3D do palco no Capture antes de chegar ao rig. O patch atual cobre 18 aparelhos, entre eles quatro moving heads, posicionados a partir de uma planta medida do palco da casa.

## O show de lançamento

O show de lançamento do álbum foi em 21 de novembro de 2026. Rodou em duas sessões do Ableton Live: o Iury Groove, que toca baixo e synths na banda, soltava o playback no notebook dele, e eu cuidava da luz no meu. Para manter as duas juntas construí o <a class="entity-link" href="/pt-br/work/rc-setlist">RC Setlist</a>, uma extensão do Ableton feita para essa banda a pedido do Iury. Quando ele dava play, a minha sessão começava junto com a dele, e a automação de luz seguia o áudio dele música por música, o show inteiro. A minha sessão mandava as cenas para o LumiKit SHOW, que comandava os aparelhos por Ethernet através de um Pro RDM2.

Nos vídeos abaixo, a tela mostra a minha sessão de luz tocando a música, ao lado de imagens do palco gravadas no celular.

## Créditos (seleção)

- **Banda**: Soprü
- **Álbum**: *Cidade do Suor* (Rockambole, 2026)
- **Desenho de luz, sistema de controle e programação**: Gabriel Worm
