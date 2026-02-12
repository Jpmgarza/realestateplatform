import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Globe, Users, Plus, FileText, Clock } from 'lucide-react'
import PostCard from '../components/PostCard'
import CreatePost from '../components/CreatePost'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(user ? 'following' : 'global')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [visiblePostId, setVisiblePostId] = useState(null)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)
  const postRefs = useRef({})

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const fetcher = tab === 'following' ? socialService.getFeed : socialService.getGlobalFeed
      const res = await fetcher(pageNum)
      const results = res.results || res

      if (append) {
        setPosts((prev) => [...prev, ...results])
      } else {
        setPosts(results)
      }
      setHasMore(!!res.next)
    } catch (err) {
      console.error('Erreur chargement feed:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tab])

  useEffect(() => {
    setPage(1)
    fetchPosts(1)
  }, [fetchPosts])

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore && hasMore) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPosts(nextPage, true)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, page, fetchPosts])

  // Video autoplay observer: track which post is most visible
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setVisiblePostId(entry.target.dataset.postId)
          }
        })
      },
      { threshold: 0.5 }
    )
    observerRef.current = observer

    Object.values(postRefs.current).forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [posts])

  const handlePostCreated = () => {
    setShowCreate(false)
    fetchPosts(1)
  }

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="min-h-screen bg-white md:bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 md:border-0 md:bg-transparent">
        <div className="max-w-lg mx-auto">
          {/* Tabs */}
          <div className="flex items-center justify-between px-4 py-2 md:pt-4">
            <div className="flex gap-6">
              {user && (
                <button
                  onClick={() => setTab('following')}
                  className={`flex items-center gap-1.5 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    tab === 'following'
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Users size={16} />
                  Abonnements
                </button>
              )}
              <button
                onClick={() => setTab('global')}
                className={`flex items-center gap-1.5 py-2 text-sm font-semibold border-b-2 transition-colors ${
                  tab === 'global'
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Globe size={16} />
                Explorer
              </button>
            </div>

            <div className="flex items-center gap-2">
              {user && (
                <>
                  <Link
                    to="/drafts"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Brouillons"
                  >
                    <FileText size={20} />
                  </Link>
                  <Link
                    to="/scheduled"
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                    title="Programmés"
                  >
                    <Clock size={20} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Create post section */}
        {user && (
          <div className="px-4 md:px-0 py-3">
            {showCreate ? (
              <CreatePost
                onPostCreated={handlePostCreated}
                onClose={() => setShowCreate(false)}
              />
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full flex items-center gap-3 bg-white md:rounded-xl md:shadow-sm md:border md:border-gray-100 p-4 text-left hover:bg-gray-50 transition-colors"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-400 flex-1">Quoi de neuf ?</span>
                <Plus size={20} className="text-primary-600" />
              </button>
            )}
          </div>
        )}

        {/* Posts Feed */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              {tab === 'following' ? <Users size={32} className="text-gray-400" /> : <Globe size={32} className="text-gray-400" />}
            </div>
            <p className="text-gray-700 font-medium mb-1">
              {tab === 'following'
                ? 'Votre flux est vide'
                : 'Aucune publication'}
            </p>
            <p className="text-gray-400 text-sm">
              {tab === 'following'
                ? 'Suivez des utilisateurs pour voir leurs publications'
                : 'Soyez le premier à publier !'}
            </p>
          </div>
        ) : (
          <div className="md:px-4 md:space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                ref={(el) => { postRefs.current[post.id] = el }}
                data-post-id={post.id}
              >
                <PostCard
                  post={post}
                  onDelete={handlePostDeleted}
                  onUpdate={() => {}}
                  isVisible={visiblePostId === post.id}
                />
              </div>
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={loadMoreRef} className="py-4 flex justify-center">
              {loadingMore && <Loader2 size={24} className="animate-spin text-primary-600" />}
              {!hasMore && posts.length > 0 && (
                <p className="text-sm text-gray-400">Vous avez tout vu !</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
