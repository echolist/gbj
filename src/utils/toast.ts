/** Minimal toast utility using custom events — no extra deps */

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

function emit(type: ToastType, message: string) {
  const event = new CustomEvent<ToastMessage>('app:toast', {
    detail: { id: Date.now().toString(), type, message },
  });
  window.dispatchEvent(event);
}

export const toast = {
  success: (msg: string) => emit('success', msg),
  error: (msg: string) => emit('error', msg),
  info: (msg: string) => emit('info', msg),
  warning: (msg: string) => emit('warning', msg),
};
