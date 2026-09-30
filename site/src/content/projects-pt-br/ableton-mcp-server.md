---
role: "Autor"
country: "Palmas, Tocantins, Brasil"
type: "Servidor de Model Context Protocol"
production: "Código aberto · Licença MIT"
links:
  - url: "https://ntworm.github.io/ableton-mcp-server/"
    label: "Página do projeto"
---

## Ableton MCP Server

Servidor de Model Context Protocol (MCP) para o <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live 12</a>. Expõe 97 ferramentas na v0.7.0, via TCP e WebSockets, para que agentes de IA (Claude Desktop, Antigravity, Gemini CLI, Codex) e desenvolvedores de áudio consultem parâmetros, controlem o transporte, automatizem clips, analisem o áudio da mixagem fora do tempo real e executem comandos em lote agrupados num único passo de desfazer; os comandos anteriores bem-sucedidos permanecem mesmo que um comando posterior falhe.

Construído com Python FastMCP e uma arquitetura de ponte dupla (MIDI Remote Script na porta TCP 9888 + ponte do Ableton Extensions SDK na porta WebSocket 9889). A execução nativa em loopback no WSL2 permite a integração com o host Windows sem latência de rede.
