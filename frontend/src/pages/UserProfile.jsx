import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, UserPlus, UserMinus, MapPin, Grid3X3, Heart } from 'lucide-react'
import PostCard from '../components/PostCard'
import socialService from '../services/socialService'
import { useAuth } from '../context/AuthContext'

export default function UserProfile() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const [profileData, postsData] = await Promise.all([
        socialService.getUserProfile(userId),
        socialService.getUserPosts(userId),
      ])
      setProfile(profileData)
      setPosts(postsData.results || postsData)
    } catch (err) {
      console.error('Erreur chargement profil:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || followLoading) return
    setFollowLoading(true)
    try {
      const res = await socialService.toggleFollow(userId)
      setProfile((prev) => ({
        ...prev,
        is_following: res.following,
        followers_count: res.followers_count,
      }))
    } catch (err) {
      console.error('Erreur follow:', err)
    } finally {
      setFollowLoading(false)
    }
  }

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    setProfile((prev) => ({
      ...prev,
      posts_count: Math.max(0, (prev.posts_count || 1) - 1),
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 text-lg">Utilisateur introuvable</p>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold border-4 border-white shadow-md">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {profile.full_name || profile.username}
                </h1>
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      profile.is_following
                        ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {profile.is_following ? (
                      <>
                        <UserMinus size={16} />
                        Abonné
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} />
                        Suivre
                      </>
                    )}
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-500 mb-3">@{profile.username}</p>

              {profile.bio && (
                <p className="text-sm text-gray-700 mb-3">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{profile.posts_count || 0}</p>
                  <p className="text-xs text-gray-500">Publications</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{profile.followers_count || 0}</p>
                  <p className="text-xs text-gray-500">Abonnés</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">{profile.following_count || 0}</p>
                  <p className="text-xs text-gray-500">Abonnements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-600">
          <Grid3X3 size={18} />
          Publications
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">
              {isOwnProfile
                ? "Vous n'avez pas encore publié"
                : "Aucune publication pour le moment"}
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
          </div>
        )}
      </div>
    </div>
  )
}
