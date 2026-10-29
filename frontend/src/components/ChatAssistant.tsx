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
      text: 'Namaste! I am your Aaroh-Saarthi transit assistant. I answer public-transit questions from the selected sample timetable (active 06:30 – 12:30) and simulated delay data. For journey or departure queries, include your target departure time.\n\nTry a sample question below or ask about routes, schedules, stops, or live fleet status.',
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
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 flex flex-col h-[380px] overflow-hidden">
      {/* Chat Header */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-xs text-gray-800">Transit Query Assistant</span>
          <span className="text-[10px] bg-gray-200/70 text-gray-600 px-1.5 py-0.2 rounded font-mono">
            Grounded Rules
          </span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-gray-400 hover:text-gray-600 font-medium transition-colors"
          title="Clear chat history"
        >
          Clear
        </button>
      </div>

      {/* Grounding Transparency Note */}
      <div className="bg-indigo-50/50 border-b border-indigo-100/60 px-3 py-1 text-[11px] text-indigo-900/80 flex items-center justify-between">
        <span>Route and departure answers are checked against the selected timetable.</span>
        <span className="font-mono text-[10px] text-indigo-600 uppercase font-semibold">{serviceDay}</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
        {messages.map(m => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-xl shadow-2xs whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs'
                  : 'bg-gray-100 text-gray-800 rounded-bl-xs border border-gray-200/50'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-2.5 rounded-xl max-w-fit border border-gray-150">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] ml-1">Checking timetable records...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-3 py-1.5 bg-gray-50/50 border-t border-gray-100 overflow-x-auto flex gap-1.5 text-[11px] no-scrollbar">
        <span className="text-gray-400 flex items-center pr-1 flex-shrink-0">Suggestions:</span>
        {SUGGESTIONS.map((sug, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(sug)}
            disabled={loading}
            className="flex-shrink-0 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200 rounded-full px-2.5 py-0.5 transition-colors disabled:opacity-40"
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
        className="border-t border-gray-200 p-2 flex gap-2 bg-white"
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask e.g. 'Route from Kashmere Gate to Saket at 08:00'..."
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-colors"
          aria-label="Transit inquiry input"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-2xs"
        >
          Send
        </button>
      </form>
    </div>
  )
}
