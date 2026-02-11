import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Calendar, MapPin, CheckCircle, XCircle, Clock, CreditCard, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import reservationService from '../services/reservationService'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50', label: 'En attente' },
  confirmed: { icon: CheckCircle, color: 'text-blue-600 bg-blue-50', label: 'Confirmée' },
  paid: { icon: CreditCard, color: 'text-green-600 bg-green-50', label: 'Payée' },
  cancelled: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Annulée' },
  completed: { icon: CheckCircle, color: 'text-gray-600 bg-gray-50', label: 'Terminée' },
  refunded: { icon: AlertCircle, color: 'text-orange-600 bg-orange-50', label: 'Remboursée' },
}

function ReservationCard({ reservation, isHost, onAction }) {
  const config = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pending
  const Icon = config.icon

  const handlePay = async () => {
    try {
      const { checkout_url } = await reservationService.createCheckout(
        reservation.id,
        `${window.location.origin}/reservations?status=success`,
        `${window.location.origin}/reservations?status=cancelled`,
      )
      window.location.href = checkout_url
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur Stripe')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <Link to={`/properties/${reservation.linked_property}`} className="font-semibold text-gray-900 hover:text-primary-600">
            {reservation.property_title}
          </Link>
          {reservation.property_city && (
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <MapPin size={13} /> {reservation.property_city}
            </p>
          )}
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
          <Icon size={13} />
          {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Arrivée</p>
          <p className="font-medium">{format(new Date(reservation.check_in), 'd MMM yyyy', { locale: fr })}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Départ</p>
          <p className="font-medium">{format(new Date(reservation.check_out), 'd MMM yyyy', { locale: fr })}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Nuits</p>
          <p className="font-medium">{reservation.nights}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Total</p>
          <p className="font-medium text-primary-600">{reservation.total_price}€</p>
        </div>
      </div>

      {isHost && (
        <p className="text-sm text-gray-500 mb-3">
          Voyageur: <span className="font-medium text-gray-700">{reservation.guest_username}</span>
        </p>
      )}
      {!isHost && (
        <p className="text-sm text-gray-500 mb-3">
          Hôte: <span className="font-medium text-gray-700">{reservation.host_username}</span>
        </p>
      )}

      {reservation.message && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mb-3">"{reservation.message}"</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {isHost && reservation.status === 'pending' && (
          <>
            <button onClick={() => onAction('confirm', reservation.id)} className="btn-primary text-sm flex-1">
              Confirmer
            </button>
            <button onClick={() => onAction('cancel', reservation.id)} className="btn-secondary text-sm flex-1">
              Refuser
            </button>
          </>
        )}
        {!isHost && reservation.status === 'confirmed' && (
          <button onClick={handlePay} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2">
            <CreditCard size={16} /> Payer
          </button>
        )}
        {reservation.status === 'pending' && !isHost && (
          <button onClick={() => onAction('cancel', reservation.id)} className="btn-secondary text-sm">
            Annuler
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyReservations() {
  const { user } = useAuth()
  const [tab, setTab] = useState('guest')
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [tab])

  const loadReservations = async () => {
    setLoading(true)
    try {
      const data = tab === 'guest'
        ? await reservationService.getMine()
        : await reservationService.getHosting()
      setReservations(data.results || data)
    } catch (err) {
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action, id) => {
    try {
      if (action === 'confirm') {
        await reservationService.confirm(id)
      } else if (action === 'cancel') {
        if (!window.confirm('Annuler cette réservation ?')) return
        await reservationService.cancel(id)
      }
      loadReservations()
    } catch (err) {
      console.error('Erreur:', err)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-gray-500">Connectez-vous pour voir vos réservations</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Calendar size={28} className="text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Mes réservations</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-6">
          <button
            onClick={() => setTab('guest')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'guest' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mes voyages
          </button>
          <button
            onClick={() => setTab('host')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'host' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Demandes reçues
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-600" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {tab === 'guest' ? "Vous n'avez pas encore de réservation" : "Aucune demande reçue"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                isHost={tab === 'host'}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
