import React, { createContext } from 'react';
import { useDispenserDiscovery } from '../hooks/useDispenserDiscovery';

export const DispenserDiscoveryContext = createContext(null);

export function DispenserDiscoveryProvider({ children }) {
  const discovery = useDispenserDiscovery();
  // Exponer en window y globalThis para acceso desde hooks externos
  if (typeof window !== 'undefined') {
    window.DispenserDiscoveryContextValue = discovery;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.DispenserDiscoveryContextValue = discovery;
  }
  return (
    <DispenserDiscoveryContext.Provider value={discovery}>
      {children}
    </DispenserDiscoveryContext.Provider>
  );
}
