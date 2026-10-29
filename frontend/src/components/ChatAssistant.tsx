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
      text: 'Namaste! I am your Aaroh-Saarthi transit assistant. I answer public-transit inquiries grounded strictly in our Delhi network timetable (operating 06:30 – 12:30) and simulated live delay metrics.\n\nTry clicking a question below or ask about routes, schedules, stops, or live fleet status.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setErrorMsg] = useState('')
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
        text: res.reply || 'No information available for that query.',
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
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Chat history cleared. Ask about transit routes, stops, schedules (06:30 - 12:30), or delays. Include departure times for journey lookups.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="flex h-[390px] flex-col overflow-hidden rounded-[1.75rem] border border-[#d8d3c7] bg-[#fffdf7] shadow-[0_18px_50px_-36px_rgba(27,39,35,0.5)]">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-[#34443e] bg-[#172421] px-5 py-3 text-[#f6f2e7]">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#d9ed55]" />
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#afc19b]">03 / Ask the network</p>
            <span className="text-sm font-bold text-white">Transit assistant</span>
          </div>
          <span className="hidden rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] font-semibold text-[#c8d0c8] sm:inline-block">
            SCHEDULE-GROUNDED
          </span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-[#c8d0c8] transition-colors hover:bg-white/10 hover:text-white"
          title="Clear chat history"
        >
          Clear
        </button>
      </div>

      {/* Grounding Transparency Note */}
      <div className="flex items-center justify-between border-b border-[#e5e1d6] bg-[#f5f3ec] px-4 py-2 text-[10px] font-medium text-[#57665d]">
        <span>Route and departure answers are checked against the selected timetable.</span>
        <span className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-[#47572d]">{serviceDay}</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-3.5 overflow-y-auto bg-[#fbfaf6] p-4 text-sm">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-2xs whitespace-pre-wrap leading-relaxed text-sm ${
                m.role === 'user'
                  ? 'rounded-br-xs bg-[#263b31] text-white'
                  : 'rounded-bl-xs border border-[#e5e1d6] bg-white text-[#24312c]'
              }`}
            >
              {m.text}
            </div>
            <span className="mt-1 px-1.5 text-[10px] text-slate-400">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex max-w-fit items-center gap-2 rounded-xl border border-[#e5e1d6] bg-white p-3 text-slate-600">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#708540]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#708540] [animation-delay:0.2s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#708540] [animation-delay:0.4s]" />
            <span className="ml-1 text-xs font-semibold">Checking timetable records…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="flex gap-2 overflow-x-auto border-t border-[#e7e3d9] bg-[#f5f3ec] px-4 py-2 text-xs no-scrollbar">
        <span className="flex flex-shrink-0 items-center pr-1 font-semibold text-[#7d867b]">Ask:</span>
        {SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(sug)}
            disabled={loading}
            className="flex-shrink-0 rounded-full border border-[#ddd9ce] bg-[#fffdf7] px-3 py-1 font-medium text-[#46544c] shadow-2xs transition-colors hover:border-[#9aab59] hover:bg-[#f1f4df] disabled:opacity-40"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault()
          handleSend()
        }}
        className="flex gap-2.5 border-t border-[#e7e3d9] bg-[#fffdf7] p-2.5"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask e.g. 'Route from Kashmere Gate to Saket at 08:00'…"
          disabled={loading}
          className="min-h-[44px] flex-1 rounded-xl border border-[#d8d5ca] bg-[#f6f4ed] px-3.5 py-2 text-sm text-[#1d2b27] outline-none transition-colors focus:border-[#53652f] focus:ring-4 focus:ring-[#d9ed55]/35"
          aria-label="Transit inquiry input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-xl bg-[#172421] px-5 py-2.5 text-sm font-bold text-white shadow-2xs transition-colors hover:bg-[#263b31] disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  )
}
