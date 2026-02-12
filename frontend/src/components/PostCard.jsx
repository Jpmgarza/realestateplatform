import { useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Trash2, Send, Bookmark } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'
import VideoPlayer from './VideoPlayer'
import ImageCarousel from './ImageCarousel'

export default function PostCard({ post, onDelete, onUpdate, isVisible = false }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState(post.comments || [])
  const [newComment, setNewComment] = useState('')
  const [loadingLike, setLoadingLike] = useState(false)
  const [loadingComment, setLoadingComment] = useState(false)
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const lastTapRef = useRef(0)

  const handleLike = async () => {
    if (!user || loadingLike) return
    setLoadingLike(true)
    try {
      const res = await socialService.toggleLike(post.id)
      setLiked(res.liked)
      setLikesCount(res.likes_count)
      if (res.liked) triggerHeartAnim()
      if (onUpdate) onUpdate()
    } catch (err) {
      console.error('Erreur like:', err)
    } finally {
      setLoadingLike(false)
    }
  }

  const triggerHeartAnim = () => {
    setShowHeartAnim(true)
    setTimeout(() => setShowHeartAnim(false), 800)
  }

  // Double-tap to like
  const handleDoubleTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < 300) {
      if (!liked && user) {
        handleLike()
      } else {
        triggerHeartAnim()
      }
    }
    lastTapRef.current = now
  }, [liked, user])

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.author_full_name || post.author_username,
          text: post.content?.slice(0, 100),
          url: window.location.origin + `/feed`,
        })
      } catch {}
    }
  }

  const timeAgo = post.created_at
    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })
    : ''

  const hasMedia = (post.images && post.images.length > 0) || post.video

  return (
    <div className="bg-white border-b border-gray-200 md:rounded-xl md:shadow-sm md:border md:border-gray-100 md:mb-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <Link to={`/profile/${post.author}`} className="flex items-center gap-3">
          {post.author_avatar ? (
            <img
              src={post.author_avatar}
              alt={post.author_username}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-pink-100"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
              {post.author_username?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {post.author_full_name || post.author_username}
            </p>
            <p className="text-xs text-gray-400">{timeAgo}</p>
          </div>
        </Link>
        {user?.id === post.author && (
          <button onClick={handleDelete} className="text-gray-400 hover:text-red-500 transition-colors p-1">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Media (Video / Carousel / Single Image) */}
      {hasMedia && (
        <div className="relative" onClick={handleDoubleTap}>
          {post.video ? (
            <VideoPlayer src={post.video} isVisible={isVisible} />
          ) : (
            <ImageCarousel images={post.images} />
          )}

          {/* Heart animation on double-tap */}
          {showHeartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <Heart
                size={80}
                className="text-white drop-shadow-lg animate-heart-burst"
                fill="white"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-5">
          <button
            onClick={handleLike}
            disabled={!user}
            className="transition-transform active:scale-125"
          >
            <Heart
              size={26}
              className={`transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-gray-800 hover:text-gray-500'}`}
            />
          </button>
          <button
            onClick={() => {
              setShowComments(!showComments)
              if (!showComments && comments.length <= 3) loadAllComments()
            }}
            className="text-gray-800 hover:text-gray-500 transition-colors"
          >
            <MessageCircle size={26} />
          </button>
          <button onClick={handleShare} className="text-gray-800 hover:text-gray-500 transition-colors">
            <Share2 size={24} />
          </button>
        </div>
        <Bookmark size={26} className="text-gray-800 hover:text-gray-500 cursor-pointer transition-colors" />
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <div className="px-4 pb-1">
          <p className="text-sm font-semibold text-gray-900">{likesCount} J'aime</p>
        </div>
      )}

      {/* Caption */}
      {post.content && (
        <div className="px-4 pb-2">
          <p className="text-sm text-gray-800">
            <span className="font-semibold mr-1.5">{post.author_username}</span>
            <span className="whitespace-pre-wrap">{post.content}</span>
          </p>
        </div>
      )}

      {/* Comments preview */}
      {(post.comments_count > 0 || comments.length > 0) && !showComments && (
        <button
          onClick={() => { setShowComments(true); loadAllComments() }}
          className="px-4 pb-2 text-sm text-gray-400 hover:text-gray-500"
        >
          Voir les {post.comments_count || comments.length} commentaire{(post.comments_count || comments.length) > 1 ? 's' : ''}
        </button>
      )}

      {/* Comments expanded */}
      {showComments && (
        <div className="px-4 pb-3 space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2">
              {comment.avatar ? (
                <img src={comment.avatar} alt="" className="w-7 h-7 rounded-full object-cover mt-0.5" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs mt-0.5">
                  {comment.username?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-gray-900 mr-1">{comment.username}</span>
                  <span className="text-gray-700">{comment.content}</span>
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-400">
                    {comment.created_at &&
                      formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                  </span>
                  {user?.username === comment.username && (
                    <button onClick={() => handleDeleteComment(comment.id)} className="text-xs text-gray-400 hover:text-red-500">
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* New comment */}
          {user && (
            <form onSubmit={handleComment} className="flex items-center gap-2 pt-2 border-t border-gray-50">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                className="flex-1 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400 py-1"
              />
              <button
                type="submit"
                disabled={!newComment.trim() || loadingComment}
                className="text-primary-600 font-semibold text-sm disabled:text-gray-300"
              >
                Publier
              </button>
            </form>
          )}
        </div>
      )}

      {/* Inline comment input (always visible like IG) */}
      {user && !showComments && (
        <form onSubmit={handleComment} className="flex items-center gap-2 px-4 pb-3">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ajouter un commentaire..."
            className="flex-1 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none placeholder-gray-400"
          />
          {newComment.trim() && (
            <button type="submit" disabled={loadingComment} className="text-primary-600 font-semibold text-sm">
              Publier
            </button>
          )}
        </form>
      )}
    </div>
  )
}
