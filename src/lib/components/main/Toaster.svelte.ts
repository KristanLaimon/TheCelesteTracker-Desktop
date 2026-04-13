export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

class ToastState {
  toasts = $state<Toast[]>([]);

  add(toast: Omit<Toast, "id">) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    this.toasts.push(newToast);

    if (toast.duration !== 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration || 4000);
    }
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  success(message: string, description?: string) {
    this.add({ message, description, type: "success" });
  }

  error(message: string, description?: string) {
    this.add({ message, description, type: "error" });
  }

  info(message: string, description?: string) {
    this.add({ message, description, type: "info" });
  }

  warning(message: string, description?: string) {
    this.add({ message, description, type: "warning" });
  }
}

export const toast = new ToastState();
