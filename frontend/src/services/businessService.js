import api from './api'

const businessService = {
  getAll: async (params = {}) => {
    const res = await api.get('/business/', { params })
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/business/${id}/`)
    return res.data
  },

  create: async (formData) => {
    const res = await api.post('/business/create/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  update: async (id, data) => {
    const res = await api.patch(`/business/${id}/`, data)
    return res.data
  },

  delete: async (id) => {
    await api.delete(`/business/${id}/`)
  },

  getMine: async () => {
    const res = await api.get('/business/mine/')
    return res.data
  },

  addTeamMember: async (businessId, data) => {
    const res = await api.post(`/business/${businessId}/team/`, data)
    return res.data
  },

  removeTeamMember: async (businessId, memberId) => {
    await api.delete(`/business/${businessId}/team/${memberId}/`)
  },

  getReviews: async (businessId) => {
    const res = await api.get(`/business/${businessId}/reviews/`)
    return res.data
  },

  createReview: async (businessId, data) => {
    const res = await api.post(`/business/${businessId}/reviews/`, data)
    return res.data
  },
}

export default businessService
