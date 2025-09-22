import { useState, useEffect, useCallback } from 'react';
import { BackgroundAuditService } from '../services/backgroundAuditService';

export interface AuditTimerStatus {
    isRunning: boolean;
    nextRunIn: number; // segundos até próxima execução
    lastRun?: string;
    totalRuns: number;
    interval: number; // intervalo em segundos
}

export const useAuditTimer = () => {
    const [status, setStatus] = useState<AuditTimerStatus>({
        isRunning: false,
        nextRunIn: 0,
        totalRuns: 0,
        interval: 90 // 1 minuto e 30 segundos
    });

    const [countdown, setCountdown] = useState(0);

    // Função para atualizar o status
    const updateStatus = useCallback(() => {
        const serviceStatus = BackgroundAuditService.getServiceStatus();
        
        setStatus(prev => ({
            ...prev,
            isRunning: serviceStatus.isRunning,
            lastRun: serviceStatus.lastRun,
            interval: 90 // 1 minuto e 30 segundos
        }));
    }, []);

    // Função para calcular próximo run
    const calculateNextRun = useCallback(() => {
        if (!status.isRunning) {
            setCountdown(0);
            return;
        }

        // Se não temos lastRun, assume que vai rodar no próximo intervalo
        if (!status.lastRun) {
            setCountdown(status.interval);
            return;
        }

        const lastRunTime = new Date(status.lastRun).getTime();
        const now = new Date().getTime();
        const timeSinceLastRun = Math.floor((now - lastRunTime) / 1000);
        const timeUntilNextRun = status.interval - (timeSinceLastRun % status.interval);

        setCountdown(timeUntilNextRun);
    }, [status.isRunning, status.lastRun, status.interval]);

    // Atualizar countdown a cada segundo
    useEffect(() => {
        if (!status.isRunning) {
            setCountdown(0);
            return;
        }

        calculateNextRun();

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    // Próxima execução chegou, recalcular
                    setTimeout(calculateNextRun, 100);
                    return status.interval;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [status.isRunning, calculateNextRun, status.interval]);

    // Atualizar status a cada 10 segundos
    useEffect(() => {
        updateStatus();
        
        const interval = setInterval(updateStatus, 10000);
        return () => clearInterval(interval);
    }, [updateStatus]);

    // Formatar tempo para exibição
    const formatTime = useCallback((seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Formatar tempo relativo
    const formatTimeAgo = useCallback((timestamp?: string): string => {
        if (!timestamp) return 'Nunca';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
        
        if (diffInSeconds < 60) {
            return `${diffInSeconds}s atrás`;
        } else if (diffInSeconds < 3600) {
            const mins = Math.floor(diffInSeconds / 60);
            return `${mins}m atrás`;
        } else {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h atrás`;
        }
    }, []);

    return {
        status,
        countdown,
        formatTime,
        formatTimeAgo,
        updateStatus
    };
};
