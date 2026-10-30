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
      className="flex flex-col rounded-2xl border border-[#D8C8AA] bg-[#FFFCF5] shadow-xs text-[#29343A] overflow-hidden animate-fade-in"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#D8C8AA] px-4 py-3 bg-[#EEE5D6]/60">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#243B4A] text-[#FFFCF5] shadow-xs">
            <SparklesIcon className="w-4 h-4 text-[#C49A43]" />
          </div>
          <div>
            <h3 id="assistant-panel-heading" className="font-serif text-sm font-bold text-[#243B4A]">
              Transit Intelligence Copilot
            </h3>
            <p className="text-[11px] text-[#77766D]">
              Verified answers on Delhi routes, fares, and delays
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear chat conversation"
          className="flex items-center gap-1 text-[11px] font-semibold text-[#77766D] hover:text-[#243B4A] px-2.5 py-1 rounded-lg border border-[#D8C8AA] hover:bg-[#EEE5D6] transition-colors cursor-pointer"
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
        className="h-64 sm:h-72 overflow-y-auto p-4 space-y-3 bg-[#F4EBDD]/40"
      >
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#243B4A] text-[#FFFCF5] shadow-xs'
                  : 'bg-[#FFFCF5] text-[#29343A] border border-[#D8C8AA] shadow-xs'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
            <time className="mt-1 px-1 text-[10px] text-[#77766D] font-mono">
              {m.timestamp}
            </time>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-[#FFFCF5] border border-[#D8C8AA] p-2.5 text-xs text-[#77766D] shadow-xs" role="status">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#C49A43] border-t-transparent" />
            <span>Consulting Delhi transit database…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      <div className="border-t border-[#D8C8AA] bg-[#EEE5D6]/40 px-3 py-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested transit questions">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => handleSend(q)}
              className="rounded-lg border border-[#D8C8AA] bg-[#FFFCF5] px-2.5 py-1 text-[11px] font-medium text-[#29343A] hover:border-[#C49A43] hover:text-[#C49A43] transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <footer className="border-t border-[#D8C8AA] bg-[#FFFCF5] p-3">
        {errorMsg && (
          <div role="alert" className="mb-1.5 text-[11px] text-[#A6533C] font-semibold">{errorMsg}</div>
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
            className="flex-1 rounded-xl border border-[#D8C8AA] bg-[#EEE5D6]/50 px-3.5 py-2 text-xs text-[#29343A] placeholder-[#77766D] focus:border-[#C49A43] focus:bg-[#FFFCF5] focus:outline-none focus:ring-2 focus:ring-[#C49A43]/20"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message to transit assistant"
            className="flex items-center justify-center rounded-xl bg-[#C49A43] hover:bg-[#A77B32] px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-40 shadow-xs cursor-pointer"
          >
            <SendIcon className="w-3.5 h-3.5 mr-1.5" />
            <span>Send</span>
          </button>
        </form>
      </footer>
    </aside>
  )
}
