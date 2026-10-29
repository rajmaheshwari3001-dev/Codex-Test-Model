import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../services/api'
import type { ServiceDay } from '../types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

const SUGGESTIONS = [
  'What are the active timetable hours?',
  'How do I get from Kashmere Gate to Saket at 08:00?',
  'Why do evening searches return no buses?',
  'Are there any delays on the network?',
  'Tell me about route R01',
  'What routes connect at Rajiv Chowk?',
]

export default function ChatAssistant({ serviceDay }: { serviceDay: ServiceDay }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! I am your Aaroh-Saarthi transit copilot.\n\nI answer public-transit inquiries grounded strictly in our Delhi network GTFS timetable (operating 06:30 – 12:30) and simulated live delay telemetry. Ask about routes, stops, schedules, or live fleet status.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleSend(customText?: string) {
    const text = (customText || input).trim()
    if (!text || loading) return

    setInput('')
    setErrorMsg('')
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await sendChatMessage(text, serviceDay)
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: res.reply || 'No information available for that query in the timetable records.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to reach transit assistant server.')
      const errorResponse: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Sorry, I could not query the transit database. Please verify the backend is running and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setLoading(false)
    }
  }

  function handleClear() {
    setErrorMsg('')
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Chat history cleared. Inquire about Delhi transit lines, schedules (06:30 - 12:30), or live delays. Mention your planned departure time for exact timetable checks.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  function handleCopy(msgId: string, text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(msgId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-slate-900 via-[#172554] to-slate-900 px-5 py-3.5 text-white">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/30 text-base font-bold ring-1 ring-blue-400/40">
            <span>🤖</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">Delhi Transit Copilot</span>
              <span className="rounded-md bg-blue-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
                AI Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-300">Grounded in GTFS Timetable & Live Delay Telemetry</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:bg-white/20 hover:text-white"
            title="Clear conversation history"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Grounding Transparency Sub-bar */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Grounded in active timetable (06:30 – 12:30)</span>
        </div>
        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 uppercase">
          {serviceDay}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/60 p-4 text-sm sm:p-5">
        {messages.map(m => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-end gap-2 max-w-[88%]">
              {m.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-xs text-blue-900">
                  AS
                </div>
              )}
              <div
                className={`relative px-4 py-3 rounded-2xl whitespace-pre-wrap leading-relaxed text-xs sm:text-sm shadow-xs ${
                  m.role === 'user'
                    ? 'rounded-br-xs bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium'
                    : 'rounded-bl-xs border border-slate-200/90 bg-white text-slate-900 ring-1 ring-slate-100'
                }`}
              >
                {m.text}

                {m.role === 'assistant' && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.id, m.text)}
                      className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      {copiedId === m.id ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>
                )}
              </div>
            </div>
            {m.role === 'user' && (
              <span className="mt-1 pr-1 font-mono text-[10px] text-slate-400">{m.timestamp}</span>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/80 p-3.5 text-xs font-bold text-blue-900">
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.4s]" />
            </div>
            <span>Analyzing timetable routes and delay patterns…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips Ribbon */}
      <div className="flex gap-2 overflow-x-auto border-t border-slate-200/80 bg-white px-4 py-2.5 text-xs no-scrollbar">
        <span className="flex shrink-0 items-center pr-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          Suggested:
        </span>
        {SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(sug)}
            disabled={loading}
            className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold text-slate-700 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 active:scale-95 disabled:opacity-40"
          >
            {sug}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-900">
          Connection issue: {errorMsg}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSend()
        }}
        className="flex gap-2 border-t border-slate-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask e.g. 'Route from Kashmere Gate to Saket at 08:00'…"
          disabled={loading}
          className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50"
          aria-label="Transit inquiry input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-blue-500/20 transition-all hover:opacity-95 active:scale-95 disabled:opacity-40"
        >
          <span>Send</span>
          <span aria-hidden="true">➔</span>
        </button>
      </form>
    </div>
  )
}
