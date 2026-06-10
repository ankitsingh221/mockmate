

import { toast as sonnerToast } from "sonner";

export const toast = {
  /** Green success — e.g. "Interview saved" */
  success: (message) =>
    sonnerToast.success(message),

  /** Red error — e.g. "Failed to load interviews" */
  error: (message) =>
    sonnerToast.error(message),

  /** Neutral info — e.g. "Generating your question…" */
  info: (message) =>
    sonnerToast(message),

  /** Promise toast — shows loading → success/error automatically */
  promise: (promise, { loading, success, error }) =>
    sonnerToast.promise(promise, { loading, success, error }),
};

