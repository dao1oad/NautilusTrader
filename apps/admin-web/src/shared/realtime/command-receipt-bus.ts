import type { CommandEvent } from "../types/admin";


type CommandReceiptListener = (event: CommandEvent) => void;

const listeners = new Set<CommandReceiptListener>();


export function publishCommandReceipt(event: CommandEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}


export function subscribeToCommandReceipts(listener: CommandReceiptListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
