import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Clock, Trash2, Send, Edit3, ArrowLeft, Image, Video, Calendar } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'
import CreatePost from '../components/CreatePost'

export default function Scheduled() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPost, setEditingPost] = useState(null)

  useEffect(() => {
    fetchScheduled()
  }, [])

  const fetchScheduled = async () => {
    setLoading(true)
    try {
      const res = await socialService.getScheduled()
      setPosts(res.results || res)
    } catch (err) {
      console.error('Erreur chargement programmés:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette publication programmée ?')) return
    try {
      await socialService.deletePost(id)
      setPosts(posts.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const handlePublishNow = async (id) => {
    try {
      await socialService.publishPost(id)
      setPosts(posts.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Erreur publication:', err)
    }
  }

  const handleEdited = () => {
    setEditingPost(null)
    fetchScheduled()
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour voir vos publications programmées</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-1 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={22} />
          </button>
          <Clock size={24} className="text-orange-500" />
          <h1 className="text-xl font-bold text-gray-900">Publications programmées</h1>
          <span className="ml-auto text-sm text-gray-400">{posts.length}</span>
        </div>

        {/* Editing */}
        {editingPost && (
          <div className="mb-6">
            <CreatePost
              editDraft={editingPost}
              onPostCreated={handleEdited}
              onClose={() => setEditingPost(null)}
            />
          </div>
        )}

        {/* Scheduled list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-50 flex items-center justify-center">
              <Calendar size={28} className="text-orange-400" />
            </div>
            <p className="text-gray-700 font-medium mb-1">Aucune publication programmée</p>
            <p className="text-gray-400 text-sm">Programmez des publications depuis le feed</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Scheduled indicator */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 text-xs font-medium rounded-full">
                        <Clock size={12} />
                        Programmé
                      </span>
                      {post.scheduled_at && (
                        <span className="text-xs text-orange-500 font-medium">
                          {format(new Date(post.scheduled_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      )}
                    </div>

                    {/* Content preview */}
                    {post.content && (
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{post.content}</p>
                    )}

                    {/* Media indicators */}
                    <div className="flex items-center gap-2">
                      {post.images && post.images.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Image size={14} />
                          {post.images.length} photo{post.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {post.video && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Video size={14} />
                          Vidéo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {post.images?.[0]?.image && (
                    <img
                      src={post.images[0].image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>

                {/* Time until publish */}
                {post.scheduled_at && (
                  <div className="mt-2 text-xs text-gray-400">
                    Publication {formatDistanceToNow(new Date(post.scheduled_at), { addSuffix: true, locale: fr })}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={14} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handlePublishNow(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    Publier maintenant
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
