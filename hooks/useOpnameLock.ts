import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface OpnameLockInfo {
    id: string;
    opnameNumber: string;
    currentStep: number;
    startedAt: string;
}

export interface OpnameLockState {
    isLocked: boolean;
    opname: OpnameLockInfo | null;
    isLoading: boolean;
}

export function useOpnameLock() {
    const [lockState, setLockState] = useState<OpnameLockState>({
        isLocked: false,
        opname: null,
        isLoading: true
    });

    useEffect(() => {
        const checkLock = async () => {
            try {
                const result = await api.getActiveOpnameLock();
                setLockState({ ...result, isLoading: false });
            } catch (error) {
                console.error('Failed to check opname lock:', error);
                setLockState({ isLocked: false, opname: null, isLoading: false });
            }
        };

        // Initial check
        checkLock();

        // Poll every 30 seconds
        const interval = setInterval(checkLock, 30000);

        return () => clearInterval(interval);
    }, []);

    const refetch = async () => {
        try {
            const result = await api.getActiveOpnameLock();
            setLockState({ ...result, isLoading: false });
        } catch (error) {
            console.error('Failed to check opname lock:', error);
        }
    };

    return { ...lockState, refetch };
}
