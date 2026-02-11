import { useState, useEffect, useCallback } from 'react'
import { Loader2, Globe, Users } from 'lucide-react'
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

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPosts(nextPage, true)
  }

  const handlePostCreated = () => {
    fetchPosts(1)
  }

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
          {user && (
            <button
              onClick={() => setTab('following')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'following'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={18} />
              Mon flux
            </button>
          )}
          <button
            onClick={() => setTab('global')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'global'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe size={18} />
            Explorer
          </button>
        </div>

        {/* Create post */}
        {user && <div className="mb-6"><CreatePost onPostCreated={handlePostCreated} /></div>}

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">
              {tab === 'following'
                ? 'Aucune publication dans votre flux'
                : 'Aucune publication pour le moment'}
            </p>
            <p className="text-gray-400 text-sm">
              {tab === 'following'
                ? 'Suivez des utilisateurs pour voir leurs publications ici'
                : 'Soyez le premier a publier quelque chose !'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
                onUpdate={() => {}}
              />
            ))}
            {hasMore && (
              <div className="flex justify-center py-4">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore && <Loader2 size={16} className="animate-spin" />}
                  Voir plus
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
