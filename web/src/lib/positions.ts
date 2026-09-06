import type { Position } from '../types/api'

export const POSITION_LABELS: Record<Position, string> = {
  SERVER: 'Server',
  BARTENDER: 'Bartender',
  LINE_COOK: 'Line Cook',
  HOST: 'Host',
  DISHWASHER: 'Dishwasher',
  MANAGER: 'Manager',
}

export const STAFF_POSITIONS: Position[] = ['SERVER', 'BARTENDER', 'LINE_COOK', 'HOST', 'DISHWASHER']
