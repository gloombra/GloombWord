import { useCallback, useRef, useState } from 'react';

export interface Toast {
  id: number;
  message: string;
  type: 'error' | 'info' | 'success';
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: Toast['type'] = 'info', duration = 2500) => {
      const id = ++counter.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}
