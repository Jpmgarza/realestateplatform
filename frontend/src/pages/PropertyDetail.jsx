import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { MapPin, BedDouble, Bath, Maximize, Calendar, User, ArrowLeft, Heart, Share2 } from 'lucide-react'
import propertyService from '../services/propertyService'

export default function PropertyDetail() {
  const { id } = useParams()

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getById(id),
  })

  const formatPrice = (price, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency, maximumFractionDigits: 0,
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-gray-200 h-96 rounded-xl" />
          <div className="bg-gray-200 h-8 w-1/2 rounded" />
          <div className="bg-gray-200 h-4 w-1/3 rounded" />
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Bien introuvable.</p>
        <Link to="/properties" className="text-primary-600 mt-4 inline-block">Retour à la liste</Link>
      </div>
    )
  }

  const images = property.images || []
  const coverImage = images.find(img => img.is_cover) || images[0]

  const typeLabels = {
    apartment: 'Appartement', villa: 'Villa', hotel: 'Hôtel',
    land: 'Terrain', commercial: 'Commercial', house: 'Maison',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <Link to="/properties" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-xl overflow-hidden mb-8">
        <div className="aspect-[4/3] bg-gray-100">
          {coverImage ? (
            <img src={coverImage.image} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Aucune image</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {images.slice(1, 5).map((img, i) => (
              <div key={img.id || i} className="aspect-[4/3] bg-gray-100">
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full">
                {property.transaction_type === 'rent' ? 'Location' : 'Vente'}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                {typeLabels[property.property_type] || property.property_type}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
            <div className="flex items-center gap-1 text-gray-500 mt-2">
              <MapPin className="w-4 h-4" />
              <span>{property.address}, {property.city}, {property.country}</span>
            </div>
          </div>

          {/* Caractéristiques */}
          <div className="flex flex-wrap gap-6 py-4 border-y border-gray-200">
            {property.bedrooms && (
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold">{property.bedrooms}</p>
                  <p className="text-xs text-gray-500">Chambres</p>
                </div>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold">{property.bathrooms}</p>
                  <p className="text-xs text-gray-500">Salles de bain</p>
                </div>
              </div>
            )}
            {property.surface_area && (
              <div className="flex items-center gap-2">
                <Maximize className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold">{property.surface_area} m²</p>
                  <p className="text-xs text-gray-500">Surface</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
            <p className="text-gray-600 whitespace-pre-line leading-relaxed">{property.description}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm sticky top-20">
            <p className="text-3xl font-bold text-primary-600 mb-1">
              {formatPrice(property.price)}
            </p>
            {property.transaction_type === 'rent' && (
              <p className="text-sm text-gray-500 mb-4">par mois</p>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Calendar className="w-4 h-4" />
              Publié le {new Date(property.created_at).toLocaleDateString('fr-FR')}
            </div>

            {/* Owner */}
            {property.owner && (
              <Link
                to={`/users/${property.owner}`}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4 hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Voir le profil</p>
                  <p className="text-xs text-gray-500">Propriétaire</p>
                </div>
              </Link>
            )}

            <div className="flex gap-2">
              <button className="flex-1 btn-primary py-3 flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" /> Favoris
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Share2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
