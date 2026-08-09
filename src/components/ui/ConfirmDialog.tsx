import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Hapus',
  danger = true,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button onClick={onCancel} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700' : 'rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700'}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-4.5 w-4.5 text-red-600" />
          </div>
        )}
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </Modal>
  )
}
