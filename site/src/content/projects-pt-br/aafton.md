---
role: "Autor"
country: "Palmas, Tocantins, Brasil"
type: "Conversor de sessões (aplicativo e linha de comando)"
production: "Código aberto · MIT"
---

## aafton

Um conversor de código aberto para sessões de pós-produção de som. Ele leva uma sessão entre AAF, EDL, XML do Final Cut Pro e o <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live</a> 12, para que uma montagem vinda do Pro Tools, do DaVinci Resolve, do Premiere Pro ou do Final Cut Pro possa ser aberta e trabalhada no Live, e devolvida em AAF para a mixagem.

## Por que construí

Passei anos no som de cinema e de séries: editando as camadas de ambiente de uma série de TV em Lisboa, dirigindo o som de curtas, finalizando longas aqui no Tocantins. O Ableton Live é onde eu componho, desenho sons e penso uma cena. A imagem, porém, sempre chega como um AAF feito para o Pro Tools. Em todo trabalho eu tinha a mesma escolha: remontar a sessão do montador à mão no Live, clip por clip, ou deixar o Live fora do filme.

O aafton é a ponte que me faltava. A sessão do montador abre no Live do jeito que foi cortada, com os pares estéreo juntos, os fades no lugar, a mídia encontrada e o vídeo de referência alinhado ao timecode da sessão. Quando o trabalho termina, o set volta para a sala de mixagem como um AAF que ninguém precisa consertar. O som direto do gravador de campo também entra, organizado por diária.

## Feito para dar confiança

Um conversor que desloca uma sessão em poucos samples é pior que nenhum: a fala escorrega da boca e ninguém percebe até a mixagem. Por isso o aafton confere o próprio trabalho. Depois de cada conversão, ele compara onde cada clip começa e termina no original e no set do Live e aponta qualquer diferença; e quando algo da sessão não pode ser levado com exatidão, ele para e diz o quê, em vez de entregar um set que parece certo e não está.

Ele já rodou em sessões reais do Pro Tools e do Premiere Pro, de ida e de volta, com cada clip caindo exatamente onde começou, inclusive em sessões drop-frame, em que um atalho comum desliza mais de três segundos por hora.

## Situação

- **Roda em**: aplicativo para Windows, ou qualquer sistema com Python 3.10+
- **Licença**: MIT, código no GitHub
- **Etapa**: pré-alfa; toda sessão convertida ainda deve ser conferida contra a origem
