import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timeout)
  }, [onDismiss])

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-brand-500 bg-white px-4 py-3 text-sm text-ink-900 shadow-lg">
      <CheckCircle2 size={18} className="text-brand-600" />
      <span>{message}</span>
      <button onClick={onDismiss} aria-label="Dismiss" className="ml-2 text-neutral-400 hover:text-neutral-600">
        <X size={14} />
      </button>
    </div>
  )
}
