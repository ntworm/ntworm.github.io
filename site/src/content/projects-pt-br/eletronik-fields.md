---
role: "Criador"
country: "Palmas, Tocantins, Brasil"
type: "Audiovisual generativo"
production: "Projeto independente"
---

## Eletronik Fields

Um instrumento audiovisual que converte ruído eletromagnético em MIDI, o MIDI em uma cadeia de VSTs e o som em visuais que reagem a ele. Construído em torno de um único patch de Max, com <a class="entity-link" href="https://cycling74.com/products/max" target="_blank" rel="noopener noreferrer">Max 8</a> + <a class="entity-link" href="https://hydra.ojack.xyz" target="_blank" rel="noopener noreferrer">Hydra.js</a> + <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> + Zwobot. A peça existiu como instalação ao vivo e como curta-metragem.

O instrumento original vive numa pequena fazenda no Tocantins, cercada por campos de transmissores FM de baixa potência. A ideia era traduzir o espectro de rádio em algo que uma pessoa pudesse ouvir e ver na mesma sala.

## A cadeia de sinal

Uma bobina de indução magnética — do tipo usado para localizar fios enterrados — capta o campo eletromagnético ao seu redor e o transforma em tensão em taxa de áudio. Esse sinal entra direto num patch de <a class="entity-link" href="https://cycling74.com/products/max" target="_blank" rel="noopener noreferrer">Max 8</a> que faz o trabalho de tradução propriamente dito: seguidores de envelope, análise FFT e um pequeno conjunto de heurísticas que decidem quando o campo está interessante o bastante para contar como uma *nota*. O MIDI resultante passa por uma curta cadeia de VSTs no <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> e sai para a sala.

A mesma análise FFT alimenta um canvas em <a class="entity-link" href="https://hydra.ojack.xyz" target="_blank" rel="noopener noreferrer">Hydra.js</a> numa segunda janela: a amplitude controla o brilho, a frequência dominante controla o matiz e, por cima, um LFO lento modula a velocidade com que o canvas se redesenha. O ponto é que áudio e visuais leem o mesmo sinal ao mesmo tempo — nada nos visuais é fingido.

## Em cena

Na performance, o canvas é projetado em tela cheia numa parede escura. O público fica em pé ou sentado a dois ou três metros da bobina; a mixagem precisa disputar espaço com o que quer que a bobina esteja captando naquele momento, e isso nunca se repete. Não há partitura, nem setlist, nem duração fixa — a execução dura enquanto o campo continuar interessante.

A mesma instalação foi filmada e editada como uma curta peça documental. O filme mantém intacto o enquadramento ao vivo — uma câmera na bobina, outra na projeção, outra na sala — e deixa que o próprio sinal faça a edição.
