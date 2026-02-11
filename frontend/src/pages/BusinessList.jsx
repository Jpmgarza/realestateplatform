import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Building2, MapPin, Star, Users, Search, Plus } from 'lucide-react'
import businessService from '../services/businessService'
import { useAuth } from '../context/AuthContext'

const TYPE_LABELS = {
  agency: 'Agence immobilière',
  developer: 'Promoteur',
  notary: 'Notaire',
  architect: 'Architecte',
  contractor: 'Entrepreneur',
  other: 'Autre',
}

export default function BusinessList() {
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    loadBusinesses()
  }, [typeFilter])

  const loadBusinesses = async () => {
    setLoading(true)
    try {
      const params = {}
      if (typeFilter) params.business_type = typeFilter
      if (search) params.search = search
      const data = await businessService.getAll(params)
      setBusinesses(data.results || data)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadBusinesses()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Annuaire professionnel</h1>
          {user && (
            <Link to="/business/create" className="btn-primary flex items-center gap-2">
              <Plus size={16} />
              Créer mon entreprise
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une entreprise..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </form>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Business list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucune entreprise trouvée</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {businesses.map((biz) => (
              <Link
                key={biz.id}
                to={`/business/${biz.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Cover */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-700 relative">
                  {biz.cover_image && (
                    <img src={biz.cover_image} alt="" className="w-full h-full object-cover" />
                  )}
                  {biz.is_verified && (
                    <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Vérifié
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start gap-3 -mt-10 mb-3">
                    {biz.logo ? (
                      <img src={biz.logo} alt="" className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-sm bg-white" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-primary-600">
                        <Building2 size={24} />
                      </div>
                    )}
                  </div>

                  <h3 className="font-semibold text-gray-900 mb-1">{biz.name}</h3>
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                    {biz.type_display}
                  </span>

                  {biz.city && (
                    <p className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                      <MapPin size={14} />
                      {biz.city}, {biz.country}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-sm text-gray-500">
                    {biz.avg_rating && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        {biz.avg_rating}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {biz.team_members?.length || 0} membres
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
