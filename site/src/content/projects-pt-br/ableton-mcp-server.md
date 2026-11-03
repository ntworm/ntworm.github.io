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

Servidor de Model Context Protocol (MCP) para o <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live 12</a>. Expõe 97 ferramentas, via TCP e WebSockets, para que agentes de IA (Claude Desktop, Antigravity, Gemini CLI, Codex) e desenvolvedores de áudio consultem parâmetros, controlem o transporte, automatizem clips, analisem o áudio da mixagem fora do tempo real e executem comandos em lote. Dependendo das operações, desfazer um lote pode exigir vários passos. Se um comando falhar, as alterações dos comandos anteriores bem-sucedidos permanecem, sem reversão automática.

Construído com Python FastMCP e uma arquitetura de ponte dupla (MIDI Remote Script na porta TCP 9888 + ponte do Ableton Extensions SDK na porta WebSocket 9889). No Windows, o servidor MCP roda nativamente no mesmo computador que o Live e se comunica localmente por loopback.
