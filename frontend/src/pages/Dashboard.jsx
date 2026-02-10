import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { PlusCircle, Home, Heart, User, Settings } from 'lucide-react'
import propertyService from '../services/propertyService'
import PropertyCard from '../components/PropertyCard'

export default function Dashboard() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'properties')

  const { data: myProperties, isLoading: loadingProps } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: () => propertyService.getAll({ owner: user?.id }),
    enabled: !!user && tab === 'properties',
  })

  const { data: favorites, isLoading: loadingFavs } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => propertyService.getFavorites(),
    enabled: !!user && tab === 'favorites',
  })

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-4">Connectez-vous pour accéder à votre tableau de bord</p>
        <Link to="/login" className="btn-primary">Se connecter</Link>
      </div>
    )
  }

  const tabs = [
    { id: 'properties', label: 'Mes biens', icon: Home },
    { id: 'favorites', label: 'Favoris', icon: Heart },
    { id: 'profile', label: 'Profil', icon: User },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bonjour, {user.first_name || user.username}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gérez vos biens et votre profil</p>
        </div>
        <Link to="/properties/new" className="btn-primary flex items-center gap-2">
          <PlusCircle className="w-4 h-4" /> Publier un bien
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-8 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'properties' && (
        <div>
          {loadingProps ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 h-80 rounded-xl animate-pulse" />)}
            </div>
          ) : myProperties?.results?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProperties.results.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Vous n'avez pas encore publié de bien.</p>
              <Link to="/properties/new" className="btn-primary">Publier mon premier bien</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'favorites' && (
        <div>
          {loadingFavs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-200 h-80 rounded-xl animate-pulse" />)}
            </div>
          ) : favorites?.results?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.results.map((fav) => (
                <PropertyCard key={fav.id} property={fav.property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun favori pour le moment.</p>
              <Link to="/properties" className="text-primary-600 font-medium mt-2 inline-block">Parcourir les biens</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && (
        <div className="max-w-lg bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.first_name} {user.last_name}</h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-500">Membre depuis</span>
              <span className="font-medium">{new Date(user.date_joined).toLocaleDateString('fr-FR')}</span>
            </div>
            {user.profile?.bio && (
              <div className="py-2">
                <span className="text-gray-500 block mb-1">Bio</span>
                <p className="text-gray-700">{user.profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
