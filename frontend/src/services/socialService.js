import api from './api'

const socialService = {
  // Feed
  getFeed: async (page = 1) => {
    const res = await api.get('/social/feed/', { params: { page } })
    return res.data
  },

  getGlobalFeed: async (page = 1) => {
    const res = await api.get('/social/feed/global/', { params: { page } })
    return res.data
  },

  // Posts
  createPost: async (formData) => {
    const res = await api.post('/social/posts/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  getPost: async (id) => {
    const res = await api.get(`/social/posts/${id}/`)
    return res.data
  },

  deletePost: async (id) => {
    await api.delete(`/social/posts/${id}/`)
  },

  getUserPosts: async (userId, page = 1) => {
    const res = await api.get(`/social/users/${userId}/posts/`, { params: { page } })
    return res.data
  },

  // Likes
  toggleLike: async (postId) => {
    const res = await api.post(`/social/posts/${postId}/like/`)
    return res.data
  },

  // Comments
  getComments: async (postId, page = 1) => {
    const res = await api.get(`/social/posts/${postId}/comments/`, { params: { page } })
    return res.data
  },

  createComment: async (postId, content) => {
    const res = await api.post(`/social/posts/${postId}/comments/`, { content })
    return res.data
  },

  deleteComment: async (commentId) => {
    await api.delete(`/social/comments/${commentId}/`)
  },

  // Follow
  toggleFollow: async (userId) => {
    const res = await api.post(`/social/users/${userId}/follow/`)
    return res.data
  },

  // Profile social
  getUserProfile: async (userId) => {
    const res = await api.get(`/social/users/${userId}/profile/`)
    return res.data
  },
}

export default socialService
