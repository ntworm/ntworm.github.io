---
role: "Colaborador + programador (áudio + reatividade)"
country: "Na web (Tezos / fxhash)"
type: "Audiovisual generativo"
links:
  - url: "https://killedbyapixel.github.io/fxhashArchive/#/token/kakofoni-orquestra"
    label: "Ler o artigo e o arquivo no fxhash"
  - url: "https://lnkd.in/dJEfXHVs"
    label: "Anúncio da entrada no acervo"
  - url: "https://killedbyapixel.github.io/fxhashArchive/#/artist/tz1du7JyqkpAWrQf7kspXS383wpMxkVWCoqQ"
    label: "Perfil de nt_worm no arquivo do fxhash"
interactiveEmbed:
  title: "KAKOFONI ORQUESTRA — obra generativa ao vivo"
  cta: "Clique para entrar na obra"
---

## Agora no acervo do Madison Museum

*KAKOFONI ORQUESTRA* é uma obra audiovisual generativa feita com <a class="entity-link" href="https://www.instagram.com/ranggapurnamaaji/" target="_blank" rel="noopener noreferrer">Rangga Purnama Aji</a> e publicada no fxhash em 2022. A edição #37 hoje faz parte do acervo do **Madison Museum of Art and Technology, em Wisconsin**.

## Uma composição montada em tempo real

O motor de áudio roda na **Web Audio API**: 16 loops gravados em pares complementares, distribuídos entre 10 instrumentos e duas escalas relativas — lá menor harmônica e dó maior pentatônica. Cadeias de efeitos sorteadas moldam volume, filtragem, compressão e convolução por IR. A 89 BPM, o ciclo completo se desenrola ao longo de cerca de 16 minutos.

O método de composição segue a mesma lógica que Brian Eno usou em *Ambient 1: Music for Airports*: cada par de loops é pensado para que o envelope ADSR e o timbre de um complementem os do outro. O sistema escolhe como esses materiais se encontram, mas as relações entre eles são compostas.

## Um só sistema para som e imagem

Os visuais são uma colaboração. Rangga criou as texturas e o conceito visual inicial; por cima deles, desenvolvi a modulação de cor guiada por FFT usando o Hydra, o ambiente de live coding de código aberto com que trabalho desde 2021. Dois leitores de FFT analisam o áudio em tempo real e mapeiam o espectro em gradientes RGB e HSV no modo `DIFF`. As cores na tela são o espectro dos loops que estão tocando naquele instante.

A obra não é uma gravação com um vídeo por cima. Som e imagem saem do mesmo loop, do mesmo código e do mesmo instante. É esse sistema compartilhado, sempre em execução, que faz a peça parecer viva, e não apenas configurável.

[Ver KAKOFONI ORQUESTRA no arquivo do fxhash](https://killedbyapixel.github.io/fxhashArchive/#/token/kakofoni-orquestra).
