import api from './api'

const propertyService = {
  async getAll(params = {}) {
    const response = await api.get('/properties/', { params })
    return response.data
  },

  async getById(id) {
    const response = await api.get(`/properties/${id}/`)
    return response.data
  },

  async create(data) {
    const response = await api.post('/properties/', data)
    return response.data
  },

  async update(id, data) {
    const response = await api.patch(`/properties/${id}/`, data)
    return response.data
  },

  async delete(id) {
    await api.delete(`/properties/${id}/`)
  },

  async uploadImages(id, files) {
    const formData = new FormData()
    files.forEach((file) => formData.append('images', file))
    const response = await api.post(`/properties/${id}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // Favoris
  async getFavorites() {
    const response = await api.get('/favorites/')
    return response.data
  },

  async addFavorite(propertyId) {
    const response = await api.post('/favorites/', { property_id: propertyId })
    return response.data
  },

  async removeFavorite(favoriteId) {
    await api.delete(`/favorites/${favoriteId}/`)
  },
}

export default propertyService
