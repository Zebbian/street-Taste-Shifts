import type { Position } from '../types/api'

export const POSITION_LABELS: Record<Position, string> = {
  HOST: 'Host',
  WAITRESS: 'Waitress',
  BARTENDER: 'Bartender',
  RUNNER: 'Runner',
  MANAGER: 'Manager',
}

export const STAFF_POSITIONS: Position[] = ['HOST', 'WAITRESS', 'BARTENDER', 'RUNNER']
