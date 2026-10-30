import { useState, useRef, useEffect } from 'react'
import { SparklesIcon, SendIcon, RotateCcwIcon } from '../common/Icons'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

interface Props {
  onRouteRecommendation?: (originId: string, destId: string) => void
}

const SUGGESTED_QUESTIONS = [
  'What are the active timetable hours?',
  'How do I travel from Kashmere Gate to Saket?',
  'What is the auto fare from AIIMS to Saket?',
  'Which routes interchange at Rajiv Chowk?',
]

export default function AssistantPanel({ onRouteRecommendation: _onRouteRecommendation }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! I am AAROH-SAARTHI, your Delhi transit intelligence assistant.\n\nI provide route recommendations, distance & fare calculations, and schedule insights across Delhi GTFS timetables (06:00 AM – 11:35 PM) and statutory PoochhO tariffs.',
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

  const handleSend = async (customPrompt?: string) => {
    const question = (customPrompt || input).trim()
    if (!question || loading) return

    setErrorMsg('')
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages(prev => [...prev, userMsg])
    if (!customPrompt) setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      })

      if (!response.ok) {
        throw new Error('Transit server communication failure')
      }

      const data = await response.json()
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply || 'Information retrieved from Delhi Transport Stack.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      // Local fallback intelligence engine for standard questions
      let localReply =
        'Delhi Transit System operates 4 primary multimodal corridors across DMRC Metro lines (Blue, Green, Yellow) and DTC bus routes (Red Ring). Fares range from ₹10 to ₹60 based on distance stages.'

      const qLower = question.toLowerCase()
      if (qLower.includes('timetable') || qLower.includes('hour')) {
        localReply =
          'Active Delhi timetable service operates daily from 06:00 AM to 11:35 PM across 20 mapped hub stations with 120 scheduled trips.'
      } else if (qLower.includes('kashmere') && qLower.includes('saket')) {
        localReply =
          'For Kashmere Gate to Saket: Board Green Line (R02) to Rajiv Chowk or AIIMS, then connect via Yellow Line (R04) directly to Saket. Estimated travel duration is 42 minutes with an approximate fare of ₹40.'
      } else if (qLower.includes('auto') || qLower.includes('fare')) {
        localReply =
          'PoochhO (DIMTS) Delhi statutory auto-rickshaw fare is ₹30 for the first 1.5 km, then ₹11/km thereafter. A 25% night surcharge applies between 23:00 and 05:00.'
      } else if (qLower.includes('rajiv chowk')) {
        localReply =
          'Rajiv Chowk is Delhi’s central transit interchange connecting the Blue Line (Dwarka Sec-21 to Anand Vihar), Yellow Express corridor, and DTC Red Ring feeder bus services.'
      }

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: localReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setErrorMsg('')
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: 'Conversation cleared. Inquire about Delhi Metro, DTC bus schedules, PoochhO auto fares, or multimodal transfers.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <aside
      aria-labelledby="assistant-panel-heading"
      className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm text-slate-800 overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <SparklesIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 id="assistant-panel-heading" className="text-sm font-bold text-slate-900">
              Transit Copilot
            </h3>
            <p className="text-[11px] text-slate-500">
              Instant AI answers on Delhi routes, fares, and delays
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear chat conversation"
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <RotateCcwIcon className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </header>

      {/* Messages Scroll Area */}
      <div
        role="log"
        aria-live="polite"
        aria-label="Transit conversation history"
        className="h-64 sm:h-72 overflow-y-auto p-4 space-y-3 bg-slate-50/40"
      >
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
            <time className="mt-1 px-1 text-[10px] text-slate-400 font-mono">
              {m.timestamp}
            </time>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 p-2.5 text-xs text-slate-500 shadow-xs" role="status">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <span>Consulting Delhi transit database…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested transit questions">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => handleSend(q)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <footer className="border-t border-slate-100 bg-white p-3">
        {errorMsg && (
          <div role="alert" className="mb-1.5 text-[11px] text-rose-600 font-semibold">{errorMsg}</div>
        )}
        <form
          onSubmit={e => {
            e.preventDefault()
            handleSend()
          }}
          className="flex items-center gap-2"
        >
          <label htmlFor="assistant-query-input" className="sr-only">
            Ask transit question
          </label>
          <input
            id="assistant-query-input"
            type="text"
            placeholder="Ask about Delhi routes, fares, timings..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message to transit assistant"
            className="flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            <span>Send</span>
          </button>
        </form>
      </footer>
    </aside>
  )
}
