import { create } from 'zustand';
import { ThemeId } from '../context/ThemeContext';

interface AppState {
    // Session / User Level State
    userId: string | null;
    userEmail: string | null;
    walletBalance: number;

    // UI / Global Toggles
    currentTheme: ThemeId;
    isNeuralInputVisible: boolean;
    isContributorHubVisible: boolean;

    // Actions
    setUserId: (id: string | null) => void;
    setUserEmail: (email: string | null) => void;
    setWalletBalance: (balance: number) => void;
    setTheme: (theme: ThemeId) => void;
    setNeuralInputVisible: (visible: boolean) => void;
    setContributorHubVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    // Initial State
    userId: null,
    userEmail: null,
    walletBalance: 0,
    currentTheme: 'midnight',
    isNeuralInputVisible: false,
    isContributorHubVisible: false,

    // Actions
    setUserId: (id) => set({ userId: id }),
    setUserEmail: (email) => set({ userEmail: email }),
    setWalletBalance: (balance) => set({ walletBalance: balance }),
    setTheme: (theme) => set({ currentTheme: theme }),
    setNeuralInputVisible: (visible) => set({ isNeuralInputVisible: visible }),
    setContributorHubVisible: (visible) => set({ isContributorHubVisible: visible }),
}));
