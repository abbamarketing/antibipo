import { useState, useRef, useEffect, useCallback } from "react";
import { Search, Send, MessageCircle, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

/* ─── Types ─── */
type Tab = "guia" | "faq" | "chat";
type Msg = { role: "user" | "assistant"; content: string };

/* ─── Knowledge (static) ─── */
const quickItems = [
  { emoji: "📞", text: "ALERTA RECEBIDO", action: "Ligue para o paciente" },
  { emoji: "❌", text: "FALTOU", action: "Arraste para NÃO COMPARECEU" },
  { emoji: "💭", text: "VEIO, NÃO FECHOU", action: "Arraste para EM NEGOCIAÇÃO" },
  { emoji: "✅", text: "FECHOU PROTOCOLO", action: "Arraste para PROTOCOLO VENDIDO" },
  { emoji: "📅", text: "NOVO AGENDAMENTO", action: "Cadastre no Calendário" },
  { emoji: "✏️", text: "DADO ERRADO", action: "Corrija em Contatos" },
];

const faqCategories = [
  {
    cat: "📋 Pipeline & Oportunidades",
    items: [
      { q: "Como mover um paciente no pipeline?", a: "Vá em **Oportunidades** (ícone $ no menu lateral). Encontre o cartão do paciente e arraste para a coluna correta: Não Compareceu, Em Negociação ou Protocolo Vendido." },
      { q: "Qual a diferença entre as etapas do pipeline?", a: "**Novo Lead:** Paciente acabou de chegar (automático)\n\n**Avaliação Agendada:** Tem horário marcado (automático)\n\n**Não Compareceu:** Faltou (VOCÊ move)\n\n**Em Negociação:** Veio mas não fechou (VOCÊ move)\n\n**Protocolo Vendido:** Fechou (VOCÊ move)\n\n**Perdido:** Desistiu (automático)" },
      { q: "O que fazer no final do dia com o pipeline?", a: "Nenhum paciente pode ficar em 'Avaliação Agendada' se já foi atendido. Mova TODOS para: Protocolo Vendido, Em Negociação ou Não Compareceu." },
    ],
  },
  {
    cat: "📅 Calendário",
    items: [
      { q: "Como cadastrar uma avaliação manualmente?", a: "Menu **Calendários** → Selecione 'Avaliação - Dr. [Nome]' → Clique no dia/horário → Preencha o contato → **IMPORTANTE:** deixe status como 'Unconfirmed' → Salve." },
      { q: "Devo confirmar os agendamentos manualmente?", a: "**NÃO!** Deixe sempre como 'Unconfirmed'. O sistema envia lembrete 24h antes. Se o paciente confirmar no WhatsApp, o status muda automaticamente." },
      { q: "Como reagendar ou cancelar?", a: "Clique no compromisso. Para **cancelar:** mude status para 'Cancelled'. Para **reagendar:** altere data/horário." },
      { q: "Diferença entre Avaliação e Sessão?", a: "**Avaliação:** Paciente NOVO, primeira consulta.\n\n**Sessão:** Paciente que JÁ fechou protocolo e está em tratamento." },
    ],
  },
  {
    cat: "🔔 Alertas & Confirmações",
    items: [
      { q: "Recebi um alerta de não confirmação, o que fazer?", a: "O paciente NÃO respondeu o lembrete de 24h. O alerta chega 2h antes do horário. **Ação:** Ligue para o paciente e confirme por telefone." },
      { q: "Por que recebo alertas se o sistema é automático?", a: "O sistema envia lembrete 24h antes. Se o paciente não responder, você recebe alerta 2h antes para fazer contato humano." },
    ],
  },
  {
    cat: "💬 Conversas & Contatos",
    items: [
      { q: "Como ver o histórico de atendimento da Olivia?", a: "Menu **Conversas** → Clique no nome do paciente. Você vê todo o histórico do WhatsApp." },
      { q: "Posso responder pelas Conversas?", a: "**NÃO.** O atendimento WhatsApp é feito pela Olivia. Se precisar falar com o paciente, ligue." },
      { q: "Como corrigir dados de um paciente?", a: "Menu **Contatos** → Busque pelo nome ou telefone → Clique no campo errado → Corrija → Salva automaticamente." },
      { q: "Posso apagar um contato?", a: "**NUNCA apague!** Apagar remove todo o histórico. Se errou, apenas corrija os dados." },
    ],
  },
  {
    cat: "⚠️ Situações Especiais",
    items: [
      { q: "Paciente chegou sem agendamento?", a: "Atenda normalmente. Depois busque em Contatos e crie o compromisso retroativo, ou avise o gestor." },
      { q: "Paciente em Negociação ligou querendo fechar?", a: "Encontre o cartão em 'Em Negociação' → Arraste para 'Protocolo Vendido' → Agende as sessões no calendário." },
      { q: "Sistema está lento?", a: "Atualize a página com **F5**. Se persistir, avise o gestor de marketing." },
    ],
  },
  {
    cat: "🎯 Boas Práticas",
    items: [
      { q: "Com que frequência devo atualizar o pipeline?", a: "**NO MESMO DIA.** Ao final do expediente, todos os pacientes atendidos devem estar nas etapas corretas." },
      { q: "Preciso cadastrar todos os agendamentos manualmente?", a: "**NÃO.** A Olivia agenda automaticamente pelo WhatsApp. Você só cadastra quando alguém ligar DIRETO para a clínica." },
    ],
  },
];

/* ─── Streaming helper ─── */
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/crm-chat`;

async function streamChat(
  messages: Msg[],
  onDelta: (t: string) => void,
  onDone: () => void,
  onError: (e: string) => void,
) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    onError(body.error || "Erro ao conectar com a IA.");
    return;
  }

  if (!resp.body) { onError("Stream indisponível"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const c = JSON.parse(json).choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch { /* partial */ }
    }
  }
  onDone();
}

/* ─── Components ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border-2 rounded-xl p-3.5 mb-2.5 cursor-pointer transition-colors ${open ? "border-indigo-500" : "border-gray-200 hover:border-indigo-300"}`}
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center gap-2 font-semibold text-sm text-gray-900 select-none">
        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        {q}
      </div>
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none">
          <ReactMarkdown>{a}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function AjudaCRM() {
  const [tab, setTab] = useState<Tab>("guia");
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat(
        [...messages, userMsg],
        upsert,
        () => setLoading(false),
        (err) => { upsert(`⚠️ ${err}`); setLoading(false); },
      );
    } catch {
      upsert("⚠️ Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }, [input, loading, messages]);

  const filtered = search
    ? faqCategories.map((c) => ({ ...c, items: c.items.filter((i) => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase())) })).filter((c) => c.items.length > 0)
    : faqCategories;

  return (
    <div className="w-full h-screen flex flex-col bg-white text-gray-900" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-emerald-500 text-white px-5 py-5 text-center shrink-0">
        <h1 className="text-lg font-semibold">📚 Central de Ajuda — CRM da Abba</h1>
        <p className="text-xs opacity-90 mt-0.5">Doutor Hérnia — Guia Completo</p>
      </header>

      {/* Search */}
      {tab !== "chat" && (
        <div className="px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value && tab === "guia") setTab("faq"); }}
              placeholder="🔍 Buscar ajuda..."
              className="w-full pl-9 pr-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <nav className="flex border-b border-gray-200 px-4 gap-1 shrink-0">
        {([
          { id: "guia" as Tab, label: "🚀 Guia Rápido", icon: BookOpen },
          { id: "faq" as Tab, label: "❓ Perguntas", icon: BookOpen },
          { id: "chat" as Tab, label: "💬 Chat IA", icon: MessageCircle },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "text-indigo-600 border-indigo-600" : "text-gray-500 border-transparent hover:text-indigo-500"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "guia" && (
          <div className="p-5 space-y-3">
            <h3 className="text-lg font-semibold">🚀 Guia Rápido Diário</h3>
            <div className="bg-gray-50 border-l-4 border-emerald-500 p-3 rounded-lg text-sm text-gray-700 font-medium leading-relaxed">
              ⏰ <strong>Final do dia:</strong> Todo paciente atendido deve estar em: Protocolo Vendido, Em Negociação ou Não Compareceu
            </div>
            {quickItems.map((item) => (
              <div key={item.text} className="flex items-center gap-3 border-2 border-gray-200 rounded-xl p-3.5 hover:border-indigo-300 transition-colors">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <p className="font-semibold text-sm">{item.text}</p>
                  <p className="text-gray-500 text-xs">→ {item.action}</p>
                </div>
              </div>
            ))}
            <div className="mt-5 p-3.5 bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-xl text-center text-sm text-gray-600">
              💬 <strong>Dúvida?</strong> Use o <button onClick={() => setTab("chat")} className="text-indigo-600 font-semibold underline">Chat IA</button> ou fale com o gestor de marketing
            </div>
          </div>
        )}

        {tab === "faq" && (
          <div className="p-5">
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p>Nenhum resultado encontrado</p>
                <button onClick={() => { setTab("chat"); setInput(search); setSearch(""); }} className="mt-3 text-indigo-600 font-medium text-sm underline">
                  Perguntar ao Chat IA
                </button>
              </div>
            ) : (
              filtered.map((cat) => (
                <div key={cat.cat} className="mb-6">
                  <h3 className="text-base font-semibold mb-3 pb-2 border-b-2 border-gray-200">{cat.cat}</h3>
                  {cat.items.map((item) => <FAQItem key={item.q} q={item.q} a={item.a} />)}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "chat" && (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Pergunte qualquer coisa sobre o CRM</p>
                  <p className="text-xs mt-1">Pipeline, calendário, alertas, GHL...</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {["Como movo um paciente?", "O que é pipeline?", "Como reagendar?"].map((s) => (
                      <button
                        key={s}
                        onClick={() => { setInput(s); }}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-indigo-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md prose prose-sm max-w-none"}`}>
                    {m.role === "assistant" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3 shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Digite sua dúvida..."
                  className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
