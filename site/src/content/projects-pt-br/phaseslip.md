---
role: "Autor"
country: "Palmas, Tocantins, Brasil"
type: "Extensão para Ableton Live"
production: "Em desenvolvimento"
---

## PhaseSlip

Uma extensão para o <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> 12 que alinha a fase de clips gravados por mais de um microfone ao mesmo tempo, como o boom e a lapela na mesma fala, para que a voz continue cheia quando os dois tocam juntos.

## Por que construí

Em todo filme e série em que trabalhei, o diálogo chega em pelo menos dois microfones: o boom sobre o ator e a lapela no peito. Os dois nunca estão à mesma distância, e essa distância muda de um plano para o outro. Tocados juntos sem cuidado, eles se anulam em alguns pontos, e a voz fica fina e oca. A correção é deslizar cada clip alguns samples, no ouvido e no olho, um clip de cada vez. Isso come horas de uma edição, e o Live não tinha ferramenta para isso.

A PhaseSlip faz a medição e deixa a decisão para o ouvido. Ela compara cada clip com uma referência, acha o deslocamento e desliza só aquele clip; quando a distância muda no meio da tomada, corta o clip onde muda. Os arquivos de áudio originais nunca são tocados, e tudo roda no computador, sem conta e sem nuvem.

## Como funciona

Selecione um trecho, clique com o botão direito nas faixas e escolha *PhaseSlip: Align phase*. Um painel abre com todas as faixas e começa a medir sozinho. Você ouve o original contra a versão alinhada, revisa um a um os clips em que ela tem dúvida, ajusta à mão onde discordar e aplica. Quando o motor tem dúvida, ele diz em palavras simples, por exemplo que duas leituras cabem e vale ouvir as duas.

Ela serve além do diálogo: dois microfones num amplificador de guitarra, uma bateria com dois microfones, um par estéreo que precisa se mover junto. Ela sempre confere o grave, para que nenhuma correção tire o grave da mixagem, e toda aplicação se desfaz com o desfazer do próprio Live.

## Situação

- **Programa**: Ableton Live 12 Suite, Windows e macOS
- **Etapa**: em desenvolvimento; versões para outros programas a caminho
