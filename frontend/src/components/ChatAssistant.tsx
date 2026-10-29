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
  'Tell me about route R01',
  'What routes connect at Rajiv Chowk?',
]

export default function ChatAssistant({ serviceDay }: { serviceDay: ServiceDay }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! I am your Aaroh-Saarthi transit copilot.\n\nI answer public-transit inquiries grounded strictly in our Delhi network timetable (operating 06:00 AM – 11:35 PM) and simulated disruption telemetry. Ask about bus routes, stops, schedules, or transfers.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
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
      setErrorMsg(err instanceof Error ? err.message : 'Failed to query assistant backend.')
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
        text: 'Chat history cleared. Inquire about Delhi transit lines, schedules (06:00 AM – 11:35 PM), or transfers.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="flex h-[450px] flex-col overflow-hidden rounded-xl border border-[#E8DFCE] bg-[#FFFFFF] shadow-xs">
      {/* Console Header */}
      <div className="flex items-center justify-between border-b border-[#E8DFCE] bg-[#173B32] px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
              Transit Assistant
            </h3>
            <p className="text-[10px] text-[#E8DFCE]/80">
              Grounded in GTFS timetable schedules
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="rounded-md border border-[#E8DFCE]/30 px-2.5 py-1 text-[11px] text-[#E8DFCE] hover:bg-white/10"
        >
          Clear
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF7F2]">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#173B32] text-white'
                  : 'bg-[#FFFFFF] text-[#25312D] border border-[#E8DFCE] shadow-2xs'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
            <span className="mt-1 px-1 text-[10px] text-[#53645F] font-mono">
              {m.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-lg bg-[#FFFFFF] border border-[#E8DFCE] p-3 text-xs text-[#53645F]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#173B32] border-t-transparent" />
            <span>Consulting transit database…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <div className="border-t border-[#E8DFCE] bg-[#FFFFFF] px-3 py-2">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => handleSend(s)}
              className="rounded-md border border-[#E8DFCE] bg-[#FAF7F2] px-2 py-1 text-[10px] font-medium text-[#25312D] hover:border-[#173B32] hover:bg-[#FFFFFF] transition-colors disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="border-t border-[#E8DFCE] bg-[#FFFFFF] p-3">
        {errorMsg && (
          <div className="mb-2 text-[11px] text-[#A44735] font-semibold">{errorMsg}</div>
        )}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about bus routes, schedules, or stops…"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#E8DFCE] bg-[#FAF7F2] px-3 py-2 text-xs text-[#25312D] focus:border-[#173B32] focus:bg-[#FFFFFF] focus:outline-none focus:ring-1 focus:ring-[#173B32]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[#173B32] px-4 py-2 text-xs font-bold text-white hover:bg-[#1f4d42] disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
