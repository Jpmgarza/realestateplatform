import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth,
  isSameDay, addMonths, subMonths, isAfter, isBefore, startOfDay,
} from 'date-fns'
import { fr } from 'date-fns/locale'

const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']

export default function BookingCalendar({
  calendarData,
  selectedCheckIn,
  selectedCheckOut,
  onSelectCheckIn,
  onSelectCheckOut,
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const today = startOfDay(new Date())

  const unavailableDates = useMemo(() => {
    if (!calendarData) return new Set()
    const dates = new Set()

    // Dates bloquées
    calendarData.blocked_dates?.forEach((d) => dates.add(d))

    // Dates réservées
    calendarData.reserved_dates?.forEach((r) => {
      const start = new Date(r.check_in)
      const end = new Date(r.check_out)
      const days = eachDayOfInterval({ start, end: new Date(end.getTime() - 86400000) })
      days.forEach((d) => dates.add(format(d, 'yyyy-MM-dd')))
    })

    return dates
  }, [calendarData])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Padding pour aligner au lundi
  const startDay = monthStart.getDay()
  const padding = startDay === 0 ? 6 : startDay - 1

  const isUnavailable = (day) => {
    return unavailableDates.has(format(day, 'yyyy-MM-dd'))
  }

  const isPast = (day) => isBefore(day, today)

  const isInRange = (day) => {
    if (!selectedCheckIn || !selectedCheckOut) return false
    return isAfter(day, selectedCheckIn) && isBefore(day, selectedCheckOut)
  }

  const handleDayClick = (day) => {
    if (isPast(day) || isUnavailable(day)) return

    if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
      onSelectCheckIn(day)
      onSelectCheckOut(null)
    } else {
      if (isBefore(day, selectedCheckIn)) {
        onSelectCheckIn(day)
        onSelectCheckOut(null)
      } else {
        // Vérifier qu'il n'y a pas de date indisponible dans la plage
        const rangeDays = eachDayOfInterval({ start: selectedCheckIn, end: day })
        const hasUnavailable = rangeDays.some((d) => isUnavailable(d))
        if (hasUnavailable) {
          onSelectCheckIn(day)
          onSelectCheckOut(null)
        } else {
          onSelectCheckOut(day)
        }
      }
    }
  }

  const getDayClass = (day) => {
    const base = 'w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors'

    if (isPast(day)) return `${base} text-gray-300 cursor-not-allowed`
    if (isUnavailable(day)) return `${base} text-gray-300 bg-gray-50 line-through cursor-not-allowed`
    if (selectedCheckIn && isSameDay(day, selectedCheckIn)) return `${base} bg-primary-600 text-white font-semibold cursor-pointer`
    if (selectedCheckOut && isSameDay(day, selectedCheckOut)) return `${base} bg-primary-600 text-white font-semibold cursor-pointer`
    if (isInRange(day)) return `${base} bg-primary-100 text-primary-700 cursor-pointer`
    return `${base} text-gray-700 hover:bg-gray-100 cursor-pointer`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-sm font-semibold text-gray-900 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: fr })}
        </h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => (
          <div key={day.toISOString()} className="flex justify-center">
            <button
              onClick={() => handleDayClick(day)}
              disabled={isPast(day) || isUnavailable(day)}
              className={getDayClass(day)}
            >
              {format(day, 'd')}
            </button>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-primary-600" /> Sélectionné
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-primary-100" /> Plage
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-gray-100 line-through" /> Indisponible
        </span>
      </div>
    </div>
  )
}
