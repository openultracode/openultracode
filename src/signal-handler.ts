type SignalName = "SIGINT" | "SIGTERM";

export type SignalEmitter = {
  once: (event: SignalName, listener: () => void) => unknown;
  off?: (event: SignalName, listener: () => void) => unknown;
  removeListener?: (event: SignalName, listener: () => void) => unknown;
};

export function installSignalHandlers(
  processLike: SignalEmitter,
  controller: AbortController
): () => void {
  const onSigint = () => abort("SIGINT");
  const onSigterm = () => abort("SIGTERM");

  const cleanup = () => {
    removeListener(processLike, "SIGINT", onSigint);
    removeListener(processLike, "SIGTERM", onSigterm);
  };
  const abort = (signal: SignalName) => {
    if (!controller.signal.aborted) {
      controller.abort(signal);
    }
    cleanup();
  };

  processLike.once("SIGINT", onSigint);
  processLike.once("SIGTERM", onSigterm);

  return cleanup;
}

function removeListener(
  processLike: SignalEmitter,
  signal: SignalName,
  listener: () => void
): void {
  if (processLike.off) {
    processLike.off(signal, listener);
    return;
  }
  processLike.removeListener?.(signal, listener);
}
