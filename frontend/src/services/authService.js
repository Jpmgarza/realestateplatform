import api from './api'

const authService = {
  async register(data) {
    const response = await api.post('/auth/register/', data)
    const { access, refresh } = response.data
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    return response.data
  },

  async login(username, password) {
    const response = await api.post('/auth/login/', { username, password })
    const { access, refresh } = response.data
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    return response.data
  },

  logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },

  async getMe() {
    const response = await api.get('/auth/me/')
    return response.data
  },

  async updateProfile(data) {
    const response = await api.patch('/auth/me/', data)
    return response.data
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token')
  },
}

export default authService
