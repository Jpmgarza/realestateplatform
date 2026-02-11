import api from './api'

const reservationService = {
  // Calendar
  getCalendar: async (propertyId) => {
    const res = await api.get(`/reservations/properties/${propertyId}/calendar/`)
    return res.data
  },

  // Availability
  getAvailabilities: async (propertyId) => {
    const res = await api.get(`/reservations/properties/${propertyId}/availability/`)
    return res.data
  },

  createAvailability: async (propertyId, data) => {
    const res = await api.post(`/reservations/properties/${propertyId}/availability/`, data)
    return res.data
  },

  deleteAvailability: async (id) => {
    await api.delete(`/reservations/availability/${id}/`)
  },

  // Blocked dates
  getBlockedDates: async (propertyId) => {
    const res = await api.get(`/reservations/properties/${propertyId}/blocked/`)
    return res.data
  },

  blockDate: async (propertyId, data) => {
    const res = await api.post(`/reservations/properties/${propertyId}/blocked/`, data)
    return res.data
  },

  // Reservations
  create: async (data) => {
    const res = await api.post('/reservations/create/', data)
    return res.data
  },

  getMine: async () => {
    const res = await api.get('/reservations/mine/')
    return res.data
  },

  getHosting: async () => {
    const res = await api.get('/reservations/hosting/')
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/reservations/${id}/`)
    return res.data
  },

  confirm: async (id) => {
    const res = await api.post(`/reservations/${id}/confirm/`)
    return res.data
  },

  cancel: async (id, reason = '') => {
    const res = await api.post(`/reservations/${id}/cancel/`, { reason })
    return res.data
  },

  // Stripe
  createCheckout: async (id, successUrl, cancelUrl) => {
    const res = await api.post(`/reservations/${id}/checkout/`, {
      success_url: successUrl,
      cancel_url: cancelUrl,
    })
    return res.data
  },
}

export default reservationService
