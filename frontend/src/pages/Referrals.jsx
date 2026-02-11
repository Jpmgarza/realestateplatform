import { useState, useEffect } from 'react'
import { Loader2, Send, Inbox, ArrowRight, DollarSign, Users, Clock, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import referralService from '../services/referralService'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  contacted: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

function NewReferralForm({ onCreated, onClose }) {
  const [form, setForm] = useState({
    referred_to: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    description: '',
    commission_rate: '5.00',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.client_name || !form.referred_to) {
      setError('Nom du client et destinataire requis')
      return
    }
    setLoading(true)
    try {
      await referralService.create(form)
      onCreated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveau referral</h3>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="ID du destinataire (professionnel)"
          value={form.referred_to}
          onChange={(e) => setForm({ ...form, referred_to: e.target.value })}
          className="input-field"
          required
        />
        <input
          type="text"
          placeholder="Nom du client"
          value={form.client_name}
          onChange={(e) => setForm({ ...form, client_name: e.target.value })}
          className="input-field"
          required
        />
        <input
          type="email"
          placeholder="Email du client"
          value={form.client_email}
          onChange={(e) => setForm({ ...form, client_email: e.target.value })}
          className="input-field"
        />
        <input
          type="tel"
          placeholder="Téléphone du client"
          value={form.client_phone}
          onChange={(e) => setForm({ ...form, client_phone: e.target.value })}
          className="input-field"
        />
        <input
          type="number"
          step="0.01"
          placeholder="Taux de commission (%)"
          value={form.commission_rate}
          onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
          className="input-field"
        />
        <textarea
          placeholder="Description du besoin..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="input-field md:col-span-2"
          rows={3}
        />
        <div className="md:col-span-2 flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary">
            Annuler
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Envoyer
          </button>
        </div>
      </form>
    </div>
  )
}

export default function Referrals() {
  const { user } = useAuth()
  const [referrals, setReferrals] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [tab])

  const loadData = async () => {
    setLoading(true)
    try {
      const [referralsData, statsData] = await Promise.all([
        referralService.getAll(tab),
        referralService.getStats(),
      ])
      setReferrals(referralsData.results || referralsData)
      setStats(statsData)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await referralService.updateStatus(id, newStatus)
      loadData()
    } catch (err) {
      console.error('Erreur mise à jour:', err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour accéder aux referrals</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Apporteurs d'affaires</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
            <Send size={16} />
            Nouveau referral
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Send} label="Envoyés" value={stats.total_sent} color="bg-blue-50 text-blue-600" />
            <StatCard icon={Inbox} label="Reçus" value={stats.total_received} color="bg-green-50 text-green-600" />
            <StatCard icon={Clock} label="En attente" value={stats.pending} color="bg-yellow-50 text-yellow-600" />
            <StatCard icon={DollarSign} label="Commissions gagnées" value={`${stats.total_commissions_earned}€`} color="bg-purple-50 text-purple-600" />
          </div>
        )}

        {/* New referral form */}
        {showForm && <NewReferralForm onCreated={loadData} onClose={() => setShowForm(false)} />}

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'sent', label: 'Envoyés' },
            { key: 'received', label: 'Reçus' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">Aucun referral pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div key={ref.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{ref.client_name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ref.status]}`}>
                        {ref.status_display}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>{ref.referrer_username}</span>
                      <ArrowRight size={14} />
                      <span>{ref.referred_to_username}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    {ref.created_at && formatDistanceToNow(new Date(ref.created_at), { addSuffix: true, locale: fr })}
                  </p>
                </div>

                {ref.description && <p className="text-sm text-gray-600 mb-3">{ref.description}</p>}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Commission: {ref.commission_rate}%</span>
                  {ref.referred_to === user.id && ref.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'contacted')}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Marquer contacté
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(ref.id, 'cancelled')}
                        className="text-red-500 hover:text-red-600 text-sm font-medium"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                  {ref.commission && (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle size={14} />
                      {ref.commission.amount}€
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
