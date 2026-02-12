import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, FileText, Trash2, Send, Edit3, ArrowLeft, Image, Video } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'
import CreatePost from '../components/CreatePost'

export default function Drafts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingDraft, setEditingDraft] = useState(null)

  useEffect(() => {
    fetchDrafts()
  }, [])

  const fetchDrafts = async () => {
    setLoading(true)
    try {
      const res = await socialService.getDrafts()
      setDrafts(res.results || res)
    } catch (err) {
      console.error('Erreur chargement brouillons:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce brouillon ?')) return
    try {
      await socialService.deleteDraft(id)
      setDrafts(drafts.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const handlePublish = async (id) => {
    try {
      await socialService.publishPost(id)
      setDrafts(drafts.filter((d) => d.id !== id))
    } catch (err) {
      console.error('Erreur publication:', err)
    }
  }

  const handleEdited = () => {
    setEditingDraft(null)
    fetchDrafts()
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour voir vos brouillons</p>
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
          <FileText size={24} className="text-gray-600" />
          <h1 className="text-xl font-bold text-gray-900">Brouillons</h1>
          <span className="ml-auto text-sm text-gray-400">{drafts.length} brouillon{drafts.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Editing a draft */}
        {editingDraft && (
          <div className="mb-6">
            <CreatePost
              editDraft={editingDraft}
              onPostCreated={handleEdited}
              onClose={() => setEditingDraft(null)}
            />
          </div>
        )}

        {/* Drafts list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <FileText size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-700 font-medium mb-1">Aucun brouillon</p>
            <p className="text-gray-400 text-sm">Vos brouillons apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Draft indicator */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-600 text-xs font-medium rounded-full">
                        <FileText size={12} />
                        Brouillon
                      </span>
                      <span className="text-xs text-gray-400">
                        {draft.created_at &&
                          formatDistanceToNow(new Date(draft.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>

                    {/* Content preview */}
                    {draft.content && (
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">{draft.content}</p>
                    )}

                    {/* Media indicators */}
                    <div className="flex items-center gap-2">
                      {draft.images && draft.images.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Image size={14} />
                          {draft.images.length} photo{draft.images.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {draft.video && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Video size={14} />
                          Vidéo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {draft.images?.[0]?.image && (
                    <img
                      src={draft.images[0].image}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setEditingDraft(draft)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Edit3 size={14} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handlePublish(draft.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Send size={14} />
                    Publier
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                  >
                    <Trash2 size={14} />
                    Supprimer
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
