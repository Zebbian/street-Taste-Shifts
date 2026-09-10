interface ShiftLike {
  startsAt: Date
  endsAt: Date
  hourlyRateCentsSnapshot: number
}

export interface ShiftTotals {
  totalMinutes: number
  totalCents: number
  totalHours: number
  shiftCount: number
}

export function sumShifts(shifts: ShiftLike[]): ShiftTotals {
  let totalMinutes = 0
  let totalCents = 0

  for (const shift of shifts) {
    const minutes = Math.round((shift.endsAt.getTime() - shift.startsAt.getTime()) / 60_000)
    totalMinutes += minutes
    totalCents += Math.round((minutes / 60) * shift.hourlyRateCentsSnapshot)
  }

  return {
    totalMinutes,
    totalCents,
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
    shiftCount: shifts.length,
  }
}
