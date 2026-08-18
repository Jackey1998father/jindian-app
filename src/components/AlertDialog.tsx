import { Modal } from "@/components/Modal"

export function AlertDialog({
  open,
  title,
  message,
  confirmText = "确定",
  onConfirm,
}: {
  open: boolean
  title: string
  message: string
  confirmText?: string
  onConfirm: () => void
}) {
  return (
    <Modal open={open} onClose={onConfirm}>
      <div>
        <h4 className="font-display text-lg font-bold text-ink mb-2 tracking-[0.02em]">
          {title}
        </h4>
        <p className="text-[13px] text-ink-muted leading-relaxed whitespace-pre-line">
          {message}
        </p>

        <div className="flex justify-end mt-6">
          <button
            onClick={onConfirm}
            className="px-5 py-2 text-[13px] font-semibold text-white bg-wasabi rounded-md hover:bg-sprout active:scale-95 transition-all"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
