type ToastMethod = "success" | "error" | "info" | "warning" | "loading";

async function emitToast(method: ToastMethod, message?: string | null, data?: unknown) {
  if (typeof window === "undefined") return;

  const { toast } = await import("sonner");
  toast[method](message ?? "", data as never);
}

function createToastMethod(method: ToastMethod) {
  return (message?: string | null, data?: unknown) => {
    void emitToast(method, message, data);
  };
}

export const toast = {
  success: createToastMethod("success"),
  error: createToastMethod("error"),
  info: createToastMethod("info"),
  warning: createToastMethod("warning"),
  loading: createToastMethod("loading"),
};
