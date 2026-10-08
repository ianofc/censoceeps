import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useUserSession } from '../hooks/useUserSession';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'alert' | 'success' | 'feed' | 'chat';
}

export interface AlertModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
  confirmText?: string;
  onConfirm?: () => void;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { timestamp?: string; read?: boolean }) => void;
  markAsRead: (id: string) => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  alertModal: AlertModalState | null;
  showAlert: (title: string, message: string, type?: 'warning' | 'error' | 'info' | 'success', confirmText?: string, onConfirm?: () => void) => void;
  closeAlert: () => void;
}

const STORAGE_KEY = 'ceep_notifications_v1';

// Notificação inicial padrão inspirada no sistema escolar e no exemplo de referência
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-default-1',
    title: 'Termo de Recebimento dos KDTs disponível',
    description: 'Baixe o Termo de Recebimento dos KDTs, assine via Gov.br e envie para conferência.',
    actionText: 'Ler notificação completa',
    actionUrl: '/sobre',
    timestamp: '24/09/2026, 16:30:43',
    read: false,
    type: 'info'
  },
  {
    id: 'notif-default-2',
    title: 'Coleta Censo CEEP 2026 Ativa',
    description: 'Lembre-se de registrar o nome completo dos entrevistados e evitar duplicidades de pessoas já entrevistadas.',
    actionText: 'Ir para Ficha de Coleta',
    actionUrl: '/coleta',
    timestamp: '05/10/2026, 09:00:00',
    read: false,
    type: 'warning'
  }
];

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useUserSession();

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Erro ao ler notificações do localStorage:', e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [alertModal, setAlertModal] = useState<AlertModalState | null>(null);

  // Salva no localStorage sempre que mudar
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      console.error('Erro ao salvar notificações no localStorage:', e);
    }
  }, [notifications]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & { timestamp?: string; read?: boolean }) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = notif.timestamp || new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newNotif: AppNotification = {
      id,
      title: notif.title,
      description: notif.description,
      actionText: notif.actionText,
      actionUrl: notif.actionUrl,
      timestamp: now,
      read: notif.read ?? false,
      type: notif.type
    };

    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const showAlert = useCallback((
    title: string, 
    message: string, 
    type: 'warning' | 'error' | 'info' | 'success' = 'warning',
    confirmText = 'Entendido',
    onConfirm?: () => void
  ) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      onConfirm
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlertModal(null);
  }, []);

  // Monitora Realtime para novos posts e mensagens para adicionar às notificações
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase.channel('notification-center-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lyka_posts' }, (payload) => {
        if (payload.new && payload.new.user_id !== profile.id) {
          addNotification({
            title: 'Novo Post no Feed',
            description: payload.new.content ? `"${payload.new.content.slice(0, 60)}..."` : 'Alguém acabou de publicar no Feed da turma!',
            actionText: 'Ver publicação',
            actionUrl: '/feed',
            type: 'feed'
          });
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lyka_messages' }, (payload) => {
        if (payload.new && payload.new.user_id !== profile.id) {
          addNotification({
            title: 'Nova Mensagem no LykaChat',
            description: payload.new.message ? `"${payload.new.message.slice(0, 60)}..."` : 'Você recebeu uma nova mensagem no chat.',
            actionText: 'Abrir LykaChat',
            actionUrl: '/chat',
            type: 'chat'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      removeNotification,
      clearAllNotifications,
      alertModal,
      showAlert,
      closeAlert
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser utilizado dentro de um NotificationProvider');
  }
  return context;
}
