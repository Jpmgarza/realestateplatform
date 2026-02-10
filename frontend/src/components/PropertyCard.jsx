import { Link } from 'react-router-dom'
import { Heart, MapPin, BedDouble, Bath, Maximize } from 'lucide-react'

export default function PropertyCard({ property, onToggleFavorite, isFavorite }) {
  const coverImage = property.images?.find(img => img.is_cover) || property.images?.[0]
  const imageUrl = coverImage?.image || 'https://placehold.co/400x300/e2e8f0/64748b?text=Aucune+image'

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: property.currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const typeLabels = {
    apartment: 'Appartement', villa: 'Villa', hotel: 'Hôtel',
    land: 'Terrain', commercial: 'Commercial', house: 'Maison',
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <Link to={`/properties/${property.id}`} className="block relative aspect-[4/3] overflow-hidden">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-full">
            {property.transaction_type === 'rent' ? 'Location' : 'Vente'}
          </span>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(property.id) }}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full whitespace-nowrap">
            {typeLabels[property.property_type] || property.property_type}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="line-clamp-1">{property.city}, {property.country}</span>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {property.bathrooms}
            </span>
          )}
          {property.surface_area && (
            <span className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" /> {property.surface_area}m²
            </span>
          )}
        </div>

        <div className="flex items-baseline justify-between border-t pt-3">
          <span className="text-lg font-bold text-primary-600">
            {formatPrice(property.price)}
          </span>
          {property.transaction_type === 'rent' && (
            <span className="text-sm text-gray-500">/mois</span>
          )}
        </div>
      </div>
    </div>
  )
}
