import api from './api'

const referralService = {
  getAll: async (direction = 'all') => {
    const res = await api.get('/referrals/', { params: { direction } })
    return res.data
  },

  create: async (data) => {
    const res = await api.post('/referrals/create/', data)
    return res.data
  },

  getById: async (id) => {
    const res = await api.get(`/referrals/${id}/`)
    return res.data
  },

  updateStatus: async (id, statusValue) => {
    const res = await api.patch(`/referrals/${id}/`, { status: statusValue })
    return res.data
  },

  createCommission: async (referralId, transactionAmount) => {
    const res = await api.post(`/referrals/${referralId}/commission/`, {
      transaction_amount: transactionAmount,
    })
    return res.data
  },

  getStats: async () => {
    const res = await api.get('/referrals/stats/')
    return res.data
  },
}

export default referralService
