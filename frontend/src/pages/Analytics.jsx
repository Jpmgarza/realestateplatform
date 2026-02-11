import { useState, useEffect } from 'react'
import { Loader2, Eye, Heart, Users, Home, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import analyticsService from '../services/analyticsService'
import { useAuth } from '../context/AuthContext'

function StatCard({ icon: Icon, label, value, trend, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      {trend !== undefined && trend !== null && (
        <div className="flex items-center gap-1 mt-2">
          {trend > 0 ? (
            <TrendingUp size={14} className="text-green-500" />
          ) : trend < 0 ? (
            <TrendingDown size={14} className="text-red-500" />
          ) : (
            <Minus size={14} className="text-gray-400" />
          )}
          <span className={`text-xs font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trend > 0 ? '+' : ''}{trend}% vs mois dernier
          </span>
        </div>
      )}
    </div>
  )
}

function SimpleBarChart({ data, maxBars = 15 }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">Pas encore de données</p>
  }

  const displayData = data.slice(-maxBars)
  const maxValue = Math.max(...displayData.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-1 h-32">
      {displayData.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary-500 rounded-t-sm min-h-[2px] transition-all"
            style={{ height: `${(d.count / maxValue) * 100}%` }}
            title={`${d.date}: ${d.count} vues`}
          />
          {i % 3 === 0 && (
            <span className="text-[9px] text-gray-400 -rotate-45 origin-left">
              {d.date?.slice(5)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [propertyStats, setPropertyStats] = useState(null)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const data = await analyticsService.getDashboardStats()
      setStats(data)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPropertyStats = async (propertyId) => {
    setSelectedProperty(propertyId)
    try {
      const data = await analyticsService.getPropertyAnalytics(propertyId)
      setPropertyStats(data)
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour accéder aux statistiques</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        </div>

        {/* Stats globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Home}
            label="Biens publiés"
            value={stats?.total_properties || 0}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Eye}
            label="Vues totales"
            value={stats?.total_views || 0}
            trend={stats?.views_trend}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            icon={Heart}
            label="Favoris reçus"
            value={stats?.total_favorites || 0}
            color="bg-red-50 text-red-600"
          />
          <StatCard
            icon={Users}
            label="Abonnés"
            value={stats?.total_followers || 0}
            color="bg-purple-50 text-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Properties */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Top biens</h2>
            {!stats?.top_properties?.length ? (
              <p className="text-sm text-gray-400 text-center py-8">Pas encore de vues</p>
            ) : (
              <div className="space-y-3">
                {stats.top_properties.map((prop, i) => (
                  <button
                    key={prop.id}
                    onClick={() => loadPropertyStats(prop.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedProperty === prop.id ? 'bg-primary-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-gray-900 truncate">{prop.title}</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Eye size={14} /> {prop.views}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Property detail stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">
              {propertyStats ? propertyStats.title : 'Détails du bien'}
            </h2>
            {propertyStats ? (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{propertyStats.total_views}</p>
                    <p className="text-xs text-gray-500">Vues</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{propertyStats.unique_viewers}</p>
                    <p className="text-xs text-gray-500">Visiteurs</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{propertyStats.favorites_count}</p>
                    <p className="text-xs text-gray-500">Favoris</p>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Vues (30 derniers jours)</h3>
                <SimpleBarChart data={propertyStats.views_by_day} />
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">
                Sélectionnez un bien pour voir les détails
              </p>
            )}
          </div>
        </div>

        {/* Monthly comparison */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Comparaison mensuelle</h2>
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{stats?.views_this_month || 0}</p>
              <p className="text-sm text-gray-500">Vues ce mois</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-400">{stats?.views_last_month || 0}</p>
              <p className="text-sm text-gray-500">Vues mois dernier</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
