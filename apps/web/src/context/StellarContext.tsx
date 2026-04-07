'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { isConnected, getPublicKey, getNetwork } from '@stellar/freighter-api';

interface StellarContextType {
  address: string | null;
  isConnected: boolean;
  network: string;
  loading: boolean;
  error: string | null;
  connect: () => Promise<string | undefined>;
  disconnect: () => void;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

// Helper to check if freighter is installed
const isFreighterInstalled = (): boolean => {
  return typeof window !== 'undefined';
};

// Helper to check if freighter is connected
const freighterIsConnected = async (): Promise<boolean> => {
  try {
    const result = await isConnected();
    return result;
  } catch {
    return false;
  }
};

// Helper to get public key from freighter
const freighterGetPublicKey = async (): Promise<string> => {
  try {
    const result = await getPublicKey();
    return result;
  } catch (err) {
    throw new Error('Failed to get public key. Please make sure Freighter is unlocked.');
  }
};

// Helper to get network from freighter
const freighterGetNetwork = async (): Promise<string> => {
  try {
    const result = await getNetwork();
    return result;
  } catch {
    return 'testnet';
  }
};

export function StellarProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState<string>('testnet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Storage keys
  const WALLET_ADDRESS_KEY = 'stellar_wallet_address';
  const WALLET_NETWORK_KEY = 'stellar_wallet_network';

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      // Skip if not in browser
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      // First check localStorage for persisted connection (from landing page)
      const storedAddress = localStorage.getItem(WALLET_ADDRESS_KEY);
      const storedNetwork = localStorage.getItem(WALLET_NETWORK_KEY);
      
      if (storedAddress && storedNetwork) {
        setAddress(storedAddress);
        setNetwork(storedNetwork);
        setIsConnected(true);
        setLoading(false);
        return;
      }
      
      // Otherwise check Freighter directly
      // Wait for Freighter to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        if (isFreighterInstalled()) {
          const connected = await freighterIsConnected();
          console.log('Freighter connection check:', connected);
          
          if (connected) {
            const pubKey = await freighterGetPublicKey();
            const net = await freighterGetNetwork();
            console.log('Restored connection:', pubKey, net);
            setAddress(pubKey);
            setNetwork(net);
            setIsConnected(true);
            setError(null);
          }
        } else {
          console.log('Freighter not installed');
        }
      } catch (err) {
        console.log('Connection check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkExistingConnection();
  }, []);

  const connect = async (): Promise<string | undefined> => {
    // Skip if not in browser
    if (typeof window === 'undefined') {
      setError('Cannot connect from server-side');
      return undefined;
    }

    setError(null);
    
    try {
      // Check if Freighter is installed
      if (!isFreighterInstalled()) {
        const installMsg = 'Freighter wallet not detected. Please install Freighter from freighter.app';
        setError(installMsg);
        throw new Error(installMsg);
      }

      // Wait a bit for Freighter to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if connected
      const connected = await freighterIsConnected();
      if (!connected) {
        const connectMsg = 'Please connect to Freighter wallet first. Open the Freighter extension and unlock it.';
        setError(connectMsg);
        throw new Error(connectMsg);
      }

      // Get public key
      const pubKey = await freighterGetPublicKey();
      console.log('Connected with address:', pubKey);

      // Get network
      const net = await freighterGetNetwork();
      setNetwork(net);

      // Persist to localStorage so other pages know we're connected
      localStorage.setItem(WALLET_ADDRESS_KEY, pubKey);
      localStorage.setItem(WALLET_NETWORK_KEY, net);

      setAddress(pubKey);
      setIsConnected(true);
      setError(null);
      
      return pubKey;
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      const errorMessage = err.message || 'Failed to connect wallet. Please try again.';
      setError(errorMessage);
      return undefined;
    }
  };

  const disconnect = () => {
    setAddress(null);
    setIsConnected(false);
    setNetwork('testnet');
    setError(null);
    
    // Clear localStorage
    localStorage.removeItem('stellar_wallet_address');
    localStorage.removeItem('stellar_wallet_network');
  };

  return (
    <StellarContext.Provider
      value={{
        address,
        isConnected,
        network,
        loading,
        error,
        connect,
        disconnect
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}

export function useStellar(): StellarContextType {
  const context = useContext(StellarContext);
  if (context === undefined) {
    // Return default context if not wrapped with provider
    return {
      address: null,
      isConnected: false,
      network: 'testnet',
      loading: false,
      error: null,
      connect: async () => undefined,
      disconnect: () => {}
    };
  }
  return context;
}

// Helper function to shorten address for display
export const shortenAddress = (addr: string): string => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};