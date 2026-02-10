import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Building2, Home as HomeIcon, Hotel, TreePine, ArrowRight } from 'lucide-react'
import propertyService from '../services/propertyService'
import PropertyCard from '../components/PropertyCard'

const categories = [
  { label: 'Appartements', value: 'apartment', icon: Building2 },
  { label: 'Maisons', value: 'house', icon: HomeIcon },
  { label: 'Villas', value: 'villa', icon: Hotel },
  { label: 'Terrains', value: 'land', icon: TreePine },
]

export default function Home() {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data: featured } = useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => propertyService.getAll({ ordering: '-created_at', page_size: 6 }),
  })

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/properties?search=${search}`)
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 max-w-2xl">
            Trouvez le bien immobilier de vos rêves
          </h1>
          <p className="text-lg text-primary-100 mb-8 max-w-xl">
            Achetez, louez ou publiez vos biens sur la plateforme immobilière nouvelle génération.
          </p>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Ville, type de bien, mot-clé..."
                className="w-full pl-12 pr-4 py-3.5 rounded-xl text-gray-900 text-base focus:ring-2 focus:ring-primary-300 outline-none"
              />
            </div>
            <button type="submit" className="bg-white text-primary-600 font-semibold px-6 py-3.5 rounded-xl hover:bg-primary-50 transition-colors">
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Catégories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Explorer par catégorie</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(({ label, value, icon: Icon }) => (
            <Link
              key={value}
              to={`/properties?type=${value}`}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all"
            >
              <Icon className="w-8 h-8 text-primary-600" />
              <span className="font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Biens récents */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Biens récents</h2>
          <Link
            to="/properties"
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {featured?.results?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.results.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun bien publié pour le moment.</p>
            <Link to="/properties/new" className="btn-primary inline-block mt-4">
              Publier le premier bien
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
