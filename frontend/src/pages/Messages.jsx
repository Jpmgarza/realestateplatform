import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, Send, MessageSquare, ArrowLeft, Home } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import messagingService from '../services/messagingService'
import { useAuth } from '../context/AuthContext'

function ConversationList({ conversations, activeId, onSelect }) {
  return (
    <div className="space-y-1">
      {conversations.map((conv) => {
        const other = conv.participants_info?.[0]
        const isActive = conv.id === activeId

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
              isActive ? 'bg-primary-50 border border-primary-100' : 'hover:bg-gray-50'
            }`}
          >
            {other?.avatar ? (
              <img src={other.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
                {other?.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {other?.full_name || other?.username || 'Utilisateur'}
                </p>
                {conv.unread_count > 0 && (
                  <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              {conv.property_title && (
                <p className="text-xs text-primary-600 flex items-center gap-1 truncate">
                  <Home size={10} /> {conv.property_title}
                </p>
              )}
              {conv.last_message && (
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {conv.last_message.content}
                </p>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ChatView({ conversationId, onBack }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    loadMessages()
    // Polling toutes les 5 secondes
    intervalRef.current = setInterval(loadMessages, 5000)
    return () => clearInterval(intervalRef.current)
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    try {
      const data = await messagingService.getMessages(conversationId)
      setMessages(data.results || data)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return
    setSending(true)
    try {
      const msg = await messagingService.sendMessage(conversationId, newMessage.trim())
      setMessages((prev) => [...prev, msg])
      setNewMessage('')
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={24} className="animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile back button */}
      <button onClick={onBack} className="md:hidden flex items-center gap-2 p-3 text-sm text-gray-600 border-b border-gray-100">
        <ArrowLeft size={18} /> Retour
      </button>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Démarrez la conversation</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === user?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMe ? 'order-2' : ''}`}>
                  {!isMe && (
                    <p className="text-xs text-gray-500 mb-0.5 ml-1">{msg.sender_username}</p>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-gray-400 mt-0.5 ${isMe ? 'text-right mr-1' : 'ml-1'}`}>
                    {msg.created_at && formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Votre message..."
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="bg-primary-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(searchParams.get('conv') || null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const data = await messagingService.getConversations()
      setConversations(data.results || data)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour accéder à la messagerie</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`w-full md:w-80 border-r border-gray-100 overflow-y-auto p-3 ${activeConv ? 'hidden md:block' : ''}`}>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-primary-600" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-10">
                  <MessageSquare size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Aucune conversation</p>
                </div>
              ) : (
                <ConversationList
                  conversations={conversations}
                  activeId={activeConv}
                  onSelect={setActiveConv}
                />
              )}
            </div>

            {/* Chat area */}
            <div className={`flex-1 ${!activeConv ? 'hidden md:flex' : 'flex'} flex-col`}>
              {activeConv ? (
                <ChatView conversationId={activeConv} onBack={() => setActiveConv(null)} />
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare size={48} className="mx-auto text-gray-200 mb-3" />
                    <p className="text-gray-400">Sélectionnez une conversation</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
