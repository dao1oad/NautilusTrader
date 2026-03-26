import { useEffect, useState } from "react";


type Props = {
  open: boolean;
  commandLabel: string;
  targetLabel: string;
  confirmationValue: string;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};


export function ConfirmCommandDialog({
  open,
  commandLabel,
  targetLabel,
  confirmationValue,
  isSubmitting,
  onClose,
  onConfirm
}: Props) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (open) {
      setTypedValue("");
    }
  }, [open, confirmationValue]);

  if (!open) {
    return null;
  }

  const confirmationLabel = `Type ${confirmationValue} to confirm`;
  const isConfirmed = typedValue.trim() === confirmationValue;

  return (
    <div className="confirm-dialog-backdrop">
      <section aria-label={commandLabel} aria-modal="true" className="confirm-dialog" role="dialog">
        <p className="page-state-kicker">Confirm command</p>
        <h2>{commandLabel}</h2>
        <p className="page-state-copy">{targetLabel}</p>
        <label className="confirm-dialog-field">
          <span>{confirmationLabel}</span>
          <input
            aria-label={confirmationLabel}
            className="confirm-dialog-input"
            onChange={(event) => setTypedValue(event.target.value)}
            type="text"
            value={typedValue}
          />
        </label>
        <div className="confirm-dialog-actions">
          <button className="command-button command-button-secondary" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            className="command-button"
            disabled={!isConfirmed || isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            {isSubmitting ? "Executing..." : "Execute command"}
          </button>
        </div>
      </section>
    </div>
  );
}
