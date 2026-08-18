import { Modal } from "@/components/Modal"

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div>
        <h4 className="font-display text-lg font-bold text-ink mb-2 tracking-[0.02em]">
          {title}
        </h4>
        <p className="text-[13px] text-ink-muted leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-2.5 justify-end mt-6">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-[13px] font-semibold text-ink-soft bg-parchment border border-thread rounded-md hover:bg-white active:scale-95 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? "px-5 py-2 text-[13px] font-semibold text-white bg-persimmon rounded-md hover:bg-persimmon-hi active:scale-95 transition-all"
                : "px-5 py-2 text-[13px] font-semibold text-white bg-wasabi rounded-md hover:bg-sprout active:scale-95 transition-all"
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
