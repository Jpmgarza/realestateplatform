import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Loader2, Calendar, Users, CreditCard } from 'lucide-react'
import reservationService from '../services/reservationService'
import { useAuth } from '../context/AuthContext'

export default function BookingForm({ propertyId, checkIn, checkOut, pricePerNight, onBooked }) {
  const { user } = useAuth()
  const [guestsCount, setGuestsCount] = useState(1)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!checkIn || !checkOut) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 text-center">
          Sélectionnez vos dates sur le calendrier
        </p>
      </div>
    )
  }

  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  const subtotal = pricePerNight * nights
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100
  const total = subtotal + serviceFee

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) {
      setError('Connectez-vous pour réserver')
      return
    }
    setLoading(true)
    setError('')
    try {
      const reservation = await reservationService.create({
        linked_property: propertyId,
        check_in: format(checkIn, 'yyyy-MM-dd'),
        check_out: format(checkOut, 'yyyy-MM-dd'),
        guests_count: guestsCount,
        message,
      })
      if (onBooked) onBooked(reservation)
    } catch (err) {
      const detail = err.response?.data
      if (typeof detail === 'object' && detail.non_field_errors) {
        setError(detail.non_field_errors[0])
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError('Erreur lors de la réservation')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Réserver</h3>

      {/* Dates summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Arrivée</p>
          <p className="text-sm font-medium text-gray-900">
            {format(checkIn, 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Départ</p>
          <p className="text-sm font-medium text-gray-900">
            {format(checkOut, 'd MMM yyyy', { locale: fr })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Guests */}
        <div className="mb-4">
          <label className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <Users size={14} /> Voyageurs
          </label>
          <select
            value={guestsCount}
            onChange={(e) => setGuestsCount(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>{n} voyageur{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="text-sm text-gray-600 mb-1 block">Message au propriétaire</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary-400"
            placeholder="Présentez-vous, motif du séjour..."
          />
        </div>

        {/* Price breakdown */}
        <div className="space-y-2 mb-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{pricePerNight}€ x {nights} nuit{nights > 1 ? 's' : ''}</span>
            <span className="text-gray-900">{subtotal}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Frais de service (5%)</span>
            <span className="text-gray-900">{serviceFee}€</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-100">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{total}€</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          disabled={loading || !user}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <CreditCard size={18} />
          )}
          {user ? 'Réserver' : 'Connectez-vous pour réserver'}
        </button>
      </form>
    </div>
  )
}
