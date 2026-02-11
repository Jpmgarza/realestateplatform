import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { Home, Search, PlusCircle, User, LogOut, Heart, Newspaper, Building2, Handshake, BarChart3, ChevronDown, Calendar, MessageSquare } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Home className="w-6 h-6 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">ImmoPlace</span>
          </Link>

          {/* Search bar (desktop) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une ville, un type de bien..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/properties?search=${e.target.value}`)
                }}
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Links visibles par tous */}
            <Link to="/feed" className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors px-2">
              <Newspaper className="w-4 h-4" />
              Feed
            </Link>
            <Link to="/business" className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors px-2">
              <Building2 className="w-4 h-4" />
              Annuaire
            </Link>

            {user ? (
              <>
                {/* Menu Plus */}
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors px-2"
                  >
                    Plus
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                        <Link to="/referrals" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Handshake className="w-4 h-4" /> Referrals
                        </Link>
                        <Link to="/analytics" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <BarChart3 className="w-4 h-4" /> Statistiques
                        </Link>
                        <Link to="/reservations" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <Calendar className="w-4 h-4" /> Réservations
                        </Link>
                        <Link to="/properties/new" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                          <PlusCircle className="w-4 h-4" /> Publier un bien
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <Link to="/messages" className="p-2 text-gray-500 hover:text-primary-600 transition-colors" title="Messages">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                <Link to="/dashboard?tab=favorites" className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>
                <Link to="/dashboard" className="p-2 text-gray-500 hover:text-primary-600 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-primary-600">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary text-sm">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
