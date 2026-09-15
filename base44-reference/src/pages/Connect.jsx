import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Copy, Plug, RefreshCw, Sparkles, MessageSquare, MousePointerClick, Code } from "lucide-react";

const CLIENTS = [
  {
    key: "claude",
    label: "Claude",
    icon: Sparkles,
    steps: [
      "Open the profile menu (top right) and go to Settings.",
      "Select Connectors → \"Add custom connector\".",
      "Name it and paste the server URL below, then Add.",
    ],
  },
  {
    key: "chatgpt",
    label: "ChatGPT",
    icon: MessageSquare,
    steps: [
      "Go to Apps and enable Developer mode (note the risk ChatGPT warns about).",
      "Click \"Create app\", name it, and paste the server URL below.",
      "Create the app, then enable it from the chat composer before prompting it.",
    ],
  },
  {
    key: "cursor",
    label: "Cursor",
    icon: MousePointerClick,
    steps: [
      "Open Settings → Tools & Integrations → \"New MCP Server\".",
      "This opens mcp.json — add an entry whose url is the server URL below.",
      "Save the file and toggle the server on.",
    ],
  },
  {
    key: "custom",
    label: "Custom",
    icon: Code,
    steps: [
      "Copy the server URL below.",
      "Add it as a streamable HTTP MCP server (name + URL is all most clients need).",
      "Reload the client so it picks up the new server.",
    ],
  },
];

export default function Connect() {
  const serverUrl = useMemo(
    () => new URL("/api/mcp", window.location.origin).toString(),
    []
  );
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState("claude");

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(serverUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const activeClient = CLIENTS.find((c) => c.key === active);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gradient-to-br from-amber-600 to-amber-800 rounded-xl flex items-center justify-center shadow">
          <Plug className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Conectar un asistente de IA</h1>
          <p className="text-sm text-stone-500">
            Permite que ChatGPT, Claude, Cursor u otros clientes de IA accedan a Café-UNA.
          </p>
        </div>
      </div>

      <Card className="p-5">
        <p className="text-sm font-medium text-stone-700 mb-2">URL del servidor MCP</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2.5 rounded-lg bg-stone-100 text-stone-700 text-sm font-mono break-all">
            {serverUrl}
          </code>
          <Button onClick={copyUrl} variant="outline" className="flex-shrink-0">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5" /> Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" /> Copiar
              </>
            )}
          </Button>
        </div>
      </Card>

      <div>
        <div className="flex gap-2 mb-4 border-b border-stone-200">
          {CLIENTS.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active === c.key
                  ? "border-amber-700 text-amber-800"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <c.icon className="w-4 h-4" />
              {c.label}
            </button>
          ))}
        </div>

        <Card className="p-5">
          <ol className="space-y-3">
            {activeClient.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-sm text-stone-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="p-5 bg-amber-50/50 border-amber-200">
        <div className="flex gap-3">
          <RefreshCw className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-stone-700">
            <p className="font-medium mb-1">Inicia sesión para autorizar</p>
            <p className="text-stone-600">
              Al conectarse, el cliente abrirás la página de consentimiento de Café-UNA, donde
              iniciarás sesión con tu propia cuenta y aprobarás el acceso. El asistente siempre
              actúa en tu nombre. Tras cambios en la app, vuelve a cargar el conector en tu cliente
              de IA, ya que estos guardan en caché la lista de herramientas.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}