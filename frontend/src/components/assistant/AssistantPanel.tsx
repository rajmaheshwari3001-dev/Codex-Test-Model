import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../../services/api'
import type { ServiceDay } from '../../types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

const SUGGESTED_QUESTIONS = [
  'What are the active timetable hours?',
  'How do I travel from Kashmere Gate to Saket?',
  'What is the auto fare from AIIMS to Saket?',
  'Which routes interchange at Rajiv Chowk?',
]

interface Props {
  serviceDay: ServiceDay
}

export default function AssistantPanel({ serviceDay }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Namaste! I am AAROH-SAARTHI, your Delhi transit intelligence assistant.\n\nI provide route recommendations, distance & fare calculations, and delay insights grounded in Delhi GTFS timetables (06:00 AM – 11:35 PM) and statutory PoochhO tariffs.',
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
        text: res.reply || 'No timetable information available for that query.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Assistant query failed.')
      const errorMsgObj: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: 'Unable to reach the routing assistant engine. Please verify the backend is online and try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages(prev => [...prev, errorMsgObj])
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
        text: 'Conversation cleared. Inquire about Delhi Metro, DTC bus schedules, PoochhO auto fares, or transfers.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="flex flex-col rounded-xl border border-[#DAD3C6] bg-[#FBF8F1] shadow-xs text-[#29343A] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DAD3C6] px-4 py-3 bg-[#F5F0E6]">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#C49A43] text-white text-xs font-bold shadow-2xs">
            ✦
          </div>
          <div>
            <h3 className="font-serif text-sm font-bold text-[#172D3B]">
              Ask AAROH-SAARTHI
            </h3>
            <p className="text-[10px] text-[#73766F]">
              Get instant answers about routes, fares, delays and more.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="text-[10px] font-semibold text-[#73766F] hover:text-[#172D3B] px-2 py-0.5 rounded border border-[#DAD3C6] hover:bg-[#EDE7DB] transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="h-64 overflow-y-auto p-3.5 space-y-3 bg-[#FBF8F1]">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[#172D3B] text-white shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#29343A] border border-[#DAD3C6] shadow-2xs'
              }`}
            >
              <div className="whitespace-pre-line">{m.text}</div>
            </div>
            <span className="mt-1 px-1 text-[10px] text-[#73766F] font-mono">
              {m.timestamp}
            </span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-white border border-[#DAD3C6] p-2.5 text-xs text-[#73766F]">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#C49A43] border-t-transparent" />
            <span>Consulting Delhi transit database…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested Questions */}
      <div className="border-t border-[#DAD3C6] bg-[#F5F0E6] px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {SUGGESTED_QUESTIONS.map(q => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => handleSend(q)}
              className="rounded-md border border-[#DAD3C6] bg-[#FFFFFF] px-2 py-0.5 text-[10px] font-medium text-[#29343A] hover:border-[#C49A43] hover:text-[#172D3B] transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input & Gold Send Button */}
      <div className="border-t border-[#DAD3C6] bg-[#FFFFFF] p-2.5">
        {errorMsg && (
          <div className="mb-1 text-[10px] text-[#A64C42] font-semibold">{errorMsg}</div>
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
            placeholder="Ask a transit question..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#DAD3C6] bg-[#FBF8F1] px-3 py-1.5 text-xs text-[#29343A] focus:border-[#C49A43] focus:bg-[#FFFFFF] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[#C49A43] hover:bg-[#A97C2E] px-3 py-1.5 text-xs font-bold text-white transition-all disabled:opacity-40 shadow-2xs"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
