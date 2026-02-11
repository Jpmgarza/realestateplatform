import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Trash2, Send } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [newComment, setNewComment] = useState('')
  const [loadingLike, setLoadingLike] = useState(false)
  const [loadingComment, setLoadingComment] = useState(false)

  const handleLike = async () => {
    if (!user || loadingLike) return
    setLoadingLike(true)
    try {
      const res = await socialService.toggleLike(post.id)
      setLiked(res.liked)
      setLikesCount(res.likes_count)
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Erreur like:', err)
    } finally {
      setLoadingLike(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim() || loadingComment) return
    setLoadingComment(true)
    try {
      const comment = await socialService.createComment(post.id, newComment.trim())
      setComments([...comments, comment])
      setNewComment('')
    } catch (err) {
      console.error('Erreur commentaire:', err)
    } finally {
      setLoadingComment(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Supprimer cette publication ?')) return
    try {
      await socialService.deletePost(post.id)
      if (onDelete) onDelete(post.id)
    } catch (err) {
      console.error('Erreur suppression:', err)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await socialService.deleteComment(commentId)
      setComments(comments.filter((c) => c.id !== commentId))
    } catch (err) {
      console.error('Erreur suppression commentaire:', err)
    }
  }

  const loadAllComments = async () => {
    try {
      const res = await socialService.getComments(post.id)
      setComments(res.results || res)
    } catch (err) {
      console.error('Erreur chargement commentaires:', err)
    }
  }

  const timeAgo = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })
    : ''

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/profile/${post.author}`} className="flex items-center gap-3">
          {post.author_avatar ? (
            <img
              src={post.author_avatar}
              alt={post.author_username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold">
              {post.author_username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {post.author_full_name || post.author_username}
            </p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
        </Link>
        {user?.id === post.author && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-800 text-sm whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Images */}
      {post.images && post.images.length > 0 && (
        <div
          className={`grid gap-0.5 ${
            post.images.length === 1
              ? 'grid-cols-1'
              : post.images.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-2'
          }`}
        >
          {post.images.slice(0, 4).map((img, i) => (
            <div
              key={img.id}
              className={`relative ${
                post.images.length === 3 && i === 0 ? 'col-span-2' : ''
              }`}
            >
              <img
                src={img.image}
                alt=""
                className="w-full h-64 object-cover"
              />
              {i === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-gray-50">
        <button
          onClick={handleLike}
          disabled={!user}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments)
            if (!showComments && comments.length <= 3) loadAllComments()
          }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          <MessageCircle size={20} />
          <span>{post.comments_count || 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2">
              {comment.avatar ? (
                <img src={comment.avatar} alt="" className="w-7 h-7 rounded-full object-cover mt-0.5" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs mt-0.5">
                  {comment.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold text-gray-900">{comment.username}</p>
                  <p className="text-sm text-gray-700">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-400">
                    {comment.created_at &&
                      formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  </span>
                  {user?.username === comment.username && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* New comment form */}
          {user && (
            <form onSubmit={handleComment} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:border-primary-400"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || loadingComment}
                className="text-primary-600 hover:text-primary-700 disabled:text-gray-300"
              >
                <Send size={18} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
