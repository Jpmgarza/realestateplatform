import api from './api'

const analyticsService = {
  trackPropertyView: async (propertyId) => {
    try {
      await api.post(`/analytics/track/property/${propertyId}/`)
    } catch (err) {
      // Silently fail - tracking should not block UI
    }
  },

  trackProfileView: async (userId) => {
    try {
      await api.post(`/analytics/track/profile/${userId}/`)
    } catch (err) {
      // Silently fail
    }
  },

  trackSearch: async (query, filters = {}, resultsCount = 0) => {
    try {
      await api.post('/analytics/track/search/', {
        query,
        filters,
        results_count: resultsCount,
      })
    } catch (err) {
      // Silently fail
    }
  },

  getDashboardStats: async () => {
    const res = await api.get('/analytics/dashboard/')
    return res.data
  },

  getPropertyAnalytics: async (propertyId) => {
    const res = await api.get(`/analytics/property/${propertyId}/`)
    return res.data
  },
}

export default analyticsService
