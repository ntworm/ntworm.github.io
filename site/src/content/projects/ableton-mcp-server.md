---
title: "Ableton MCP Server"
year: 2026
role: "Author"
country: "Palmas, Tocantins, Brazil"
type: "Model Context Protocol server"
production: "Open-source · MIT License"
links:
  - url: "https://github.com/ntworm/ableton-mcp-server"
    label: "GitHub"
  - url: "https://ntworm.github.io/ableton-mcp-server/"
    label: "Landing"
tags: ["code", "mcp", "ableton", "tool", "ai"]
---

## Ableton MCP Server

Model Context Protocol (MCP) server for <a class="entity-link" href="https://www.ableton.com" target="_blank" rel="noopener noreferrer">Ableton Live 12</a>. Exposes 97 tools in v0.7.0 over TCP and WebSockets for AI agents (Claude Desktop, Antigravity, Gemini CLI, Codex) and audio developers to query parameters, drive transport, automate clips, analyze mix audio in non-realtime, and execute grouped batch commands in one grouped undo step; successful earlier commands persist if a later command fails.

Built with Python FastMCP and a dual-bridge architecture (MIDI Remote Script on TCP port 9888 + Ableton Extensions SDK bridge on WebSocket port 9889). Native WSL2 loopback execution allows Windows host integration with zero network latency.
