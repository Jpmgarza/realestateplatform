import api from './api'

const messagingService = {
  getConversations: async () => {
    const res = await api.get('/messaging/conversations/')
    return res.data
  },

  startConversation: async (userId, propertyId = null, message = '') => {
    const data = { user_id: userId }
    if (propertyId) data.property_id = propertyId
    if (message) data.message = message
    const res = await api.post('/messaging/conversations/start/', data)
    return res.data
  },

  getConversation: async (id) => {
    const res = await api.get(`/messaging/conversations/${id}/`)
    return res.data
  },

  getMessages: async (conversationId) => {
    const res = await api.get(`/messaging/conversations/${conversationId}/messages/`)
    return res.data
  },

  sendMessage: async (conversationId, content) => {
    const res = await api.post(`/messaging/conversations/${conversationId}/send/`, { content })
    return res.data
  },

  getUnreadCount: async () => {
    const res = await api.get('/messaging/unread/')
    return res.data
  },
}

export default messagingService
