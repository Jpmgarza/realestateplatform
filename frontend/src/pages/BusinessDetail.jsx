import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Building2, MapPin, Star, Phone, Mail, Globe, Users, Shield, Send } from 'lucide-react'
import businessService from '../services/businessService'
import { useAuth } from '../context/AuthContext'

export default function BusinessDetail() {
  const { businessId } = useParams()
  const { user } = useAuth()
  const [business, setBusiness] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadBusiness()
  }, [businessId])

  const loadBusiness = async () => {
    setLoading(true)
    try {
      const [bizData, reviewsData] = await Promise.all([
        businessService.getById(businessId),
        businessService.getReviews(businessId),
      ])
      setBusiness(bizData)
      setReviews(reviewsData.results || reviewsData)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (e) => {
    e.preventDefault()
    if (!reviewForm.content.trim()) return
    setSubmitting(true)
    try {
      const newReview = await businessService.createReview(businessId, reviewForm)
      setReviews([newReview, ...reviews])
      setReviewForm({ rating: 5, content: '' })
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500 text-lg">Entreprise introuvable</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-primary-600 to-primary-800 relative">
        {business.cover_image && (
          <img src={business.cover_image} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-16 pb-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {business.logo ? (
              <img src={business.logo} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 border-2 border-white shadow-md">
                <Building2 size={32} />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
                {business.is_verified && (
                  <Shield size={20} className="text-green-500" />
                )}
              </div>
              <span className="text-sm text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                {business.type_display}
              </span>
              {business.description && (
                <p className="text-sm text-gray-600 mt-3">{business.description}</p>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
            {business.city && (
              <span className="flex items-center gap-1"><MapPin size={14} /> {business.city}, {business.country}</span>
            )}
            {business.phone && (
              <span className="flex items-center gap-1"><Phone size={14} /> {business.phone}</span>
            )}
            {business.email && (
              <span className="flex items-center gap-1"><Mail size={14} /> {business.email}</span>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                <Globe size={14} /> Site web
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{business.properties_count || 0}</p>
              <p className="text-xs text-gray-500">Biens</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{business.team_members?.length || 0}</p>
              <p className="text-xs text-gray-500">Membres</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{business.reviews_count || 0}</p>
              <p className="text-xs text-gray-500">Avis</p>
            </div>
            {business.avg_rating && (
              <div className="text-center">
                <p className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  {business.avg_rating}
                </p>
                <p className="text-xs text-gray-500">Note</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={18} /> Équipe
            </h2>
            {business.team_members?.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun membre</p>
            ) : (
              <div className="space-y-3">
                {business.team_members?.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-semibold">
                      {m.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.full_name}</p>
                      <p className="text-xs text-gray-500">{m.role_display}{m.title && ` - ${m.title}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star size={18} /> Avis ({reviews.length})
            </h2>

            {/* Review form */}
            {user && (
              <form onSubmit={handleReview} className="mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600">Note:</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    >
                      <Star
                        size={20}
                        className={n <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                    placeholder="Laisser un avis..."
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-400"
                  />
                  <button type="submit" disabled={submitting} className="text-primary-600 hover:text-primary-700">
                    <Send size={18} />
                  </button>
                </div>
              </form>
            )}

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun avis pour le moment</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{review.author_username}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            size={12}
                            className={n <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
