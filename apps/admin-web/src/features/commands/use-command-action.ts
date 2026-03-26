import { startTransition, useEffect, useRef, useState } from "react";

import { subscribeToCommandReceipts } from "../../shared/realtime/command-receipt-bus";
import type { CommandReceipt } from "../../shared/types/admin";


export type CommandIntent = {
  commandLabel: string;
  targetLabel: string;
  confirmationValue: string;
  submit: () => Promise<CommandReceipt>;
};


export function useCommandAction() {
  const [activeIntent, setActiveIntent] = useState<CommandIntent | null>(null);
  const [receipt, setReceipt] = useState<CommandReceipt | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const latestCommandIdRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribeToCommandReceipts((event) => {
      if (latestCommandIdRef.current !== event.receipt.command_id) {
        return;
      }

      startTransition(() => {
        setReceipt(event.receipt);
        setActionError(null);
      });
    });
  }, []);

  function openIntent(intent: CommandIntent) {
    startTransition(() => {
      setActiveIntent(intent);
      setActionError(null);
    });
  }

  function closeIntent() {
    if (isSubmitting) {
      return;
    }

    startTransition(() => {
      setActiveIntent(null);
    });
  }

  async function confirmIntent() {
    if (activeIntent == null) {
      return;
    }

    setIsSubmitting(true);

    try {
      const nextReceipt = await activeIntent.submit();
      latestCommandIdRef.current = nextReceipt.command_id;
      startTransition(() => {
        setReceipt(nextReceipt);
        setActiveIntent(null);
        setActionError(null);
      });
    } catch (error) {
      startTransition(() => {
        setActionError(error instanceof Error ? error.message : "Command execution failed.");
      });
    } finally {
      startTransition(() => {
        setIsSubmitting(false);
      });
    }
  }

  return {
    activeIntent,
    actionError,
    receipt,
    isSubmitting,
    openIntent,
    closeIntent,
    confirmIntent
  };
}
