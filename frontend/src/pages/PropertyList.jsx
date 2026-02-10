import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X } from 'lucide-react'
import propertyService from '../services/propertyService'
import PropertyCard from '../components/PropertyCard'

const propertyTypes = [
  { label: 'Tous', value: '' },
  { label: 'Appartement', value: 'apartment' },
  { label: 'Maison', value: 'house' },
  { label: 'Villa', value: 'villa' },
  { label: 'Terrain', value: 'land' },
  { label: 'Hôtel', value: 'hotel' },
  { label: 'Commercial', value: 'commercial' },
]

export default function PropertyList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    property_type: searchParams.get('type') || '',
    transaction_type: searchParams.get('transaction') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    ordering: searchParams.get('ordering') || '-created_at',
  })

  const queryParams = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '')
  )

  const { data, isLoading } = useQuery({
    queryKey: ['properties', queryParams],
    queryFn: () => propertyService.getAll(queryParams),
  })

  const handleFilter = (key, value) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    const params = Object.fromEntries(
      Object.entries(updated).filter(([, v]) => v !== '')
    )
    setSearchParams(params)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biens immobiliers</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data?.count || 0} résultat{(data?.count || 0) > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 md:hidden"
        >
          <SlidersHorizontal className="w-4 h-4" /> Filtres
        </button>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 shrink-0`}>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5 sticky top-20">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Filtres</h3>
              <button onClick={() => setShowFilters(false)} className="md:hidden">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recherche */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Recherche</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilter('search', e.target.value)}
                placeholder="Ville, mot-clé..."
                className="input-field text-sm"
              />
            </div>

            {/* Type de transaction */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Transaction</label>
              <div className="flex gap-2">
                {['', 'sale', 'rent'].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleFilter('transaction_type', val)}
                    className={`px-3 py-1.5 text-xs rounded-full border ${filters.transaction_type === val ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {val === '' ? 'Tous' : val === 'sale' ? 'Vente' : 'Location'}
                  </button>
                ))}
              </div>
            </div>

            {/* Type de bien */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Type de bien</label>
              <div className="flex flex-wrap gap-2">
                {propertyTypes.map(({ label, value }) => (
                  <button
                    key={value}
                    onClick={() => handleFilter('property_type', value)}
                    className={`px-3 py-1.5 text-xs rounded-full border ${filters.property_type === value ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prix */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Budget</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.min_price}
                  onChange={(e) => handleFilter('min_price', e.target.value)}
                  placeholder="Min"
                  className="input-field text-sm w-full"
                />
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => handleFilter('max_price', e.target.value)}
                  placeholder="Max"
                  className="input-field text-sm w-full"
                />
              </div>
            </div>

            {/* Tri */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Trier par</label>
              <select
                value={filters.ordering}
                onChange={(e) => handleFilter('ordering', e.target.value)}
                className="input-field text-sm"
              >
                <option value="-created_at">Plus récents</option>
                <option value="price">Prix croissant</option>
                <option value="-price">Prix décroissant</option>
                <option value="-surface_area">Surface</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-80 animate-pulse" />
              ))}
            </div>
          ) : data?.results?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.results.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Aucun bien trouvé avec ces critères.</p>
              <button
                onClick={() => {
                  setFilters({ search: '', property_type: '', transaction_type: '', min_price: '', max_price: '', ordering: '-created_at' })
                  setSearchParams({})
                }}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
