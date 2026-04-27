type Listener = () => void;

const unauthorizedListeners = new Set<Listener>();

export const onUnauthorized = (listener: Listener) => {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
};

export const emitUnauthorized = () => {
  unauthorizedListeners.forEach(listener => listener());
};
