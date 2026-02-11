import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Building2 } from 'lucide-react'
import businessService from '../services/businessService'
import { useAuth } from '../context/AuthContext'

const TYPE_OPTIONS = [
  { value: 'agency', label: 'Agence immobilière' },
  { value: 'developer', label: 'Promoteur' },
  { value: 'notary', label: 'Notaire' },
  { value: 'architect', label: 'Architecte' },
  { value: 'contractor', label: 'Entrepreneur' },
  { value: 'other', label: 'Autre' },
]

export default function BusinessCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    business_type: 'agency',
    description: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: 'France',
    siret: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) {
      setError('Le nom est requis')
      return
    }
    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val)
      })
      const biz = await businessService.create(formData)
      navigate(`/business/${biz.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour créer une entreprise</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Building2 size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Créer mon entreprise</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'activité *</label>
              <select
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                className="input-field"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="input-field"
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="input-field"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SIRET</label>
              <input
                type="text"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                className="input-field"
                maxLength={14}
                placeholder="14 chiffres"
              />
            </div>

            <div className="pt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                Annuler
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Créer l'entreprise
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
