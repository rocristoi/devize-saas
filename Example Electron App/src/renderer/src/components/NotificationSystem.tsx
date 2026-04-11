import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  isExiting?: boolean;
  showProgress?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  showConfirm: (title: string, message?: string) => Promise<boolean>;
  showAlert: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const duration = notification.duration || (notification.type === 'error' ? 5000 : 3000);
    const showProgress = notification.duration !== 0 && !notification.actions;
    
    const newNotification = { 
      ...notification, 
      id,
      showProgress
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after duration (default 5 seconds for errors, 3 seconds for others)
    if (notification.duration !== 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    // First mark as exiting for animation
    setNotifications(prev => prev.map(notification => 
      notification.id === id 
        ? { ...notification, isExiting: true }
        : notification
    ));
    
    // Then actually remove after animation duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300); // Match animation duration
  }, []);

  const showConfirm = useCallback((title: string, message?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = generateId();
      const notification: Notification = {
        id,
        type: 'warning',
        title,
        message,
        duration: 0, // Don't auto-remove
        actions: [
          {
            label: 'Anulează',
            onClick: () => {
              removeNotification(id);
              resolve(false);
            },
            variant: 'secondary'
          },
          {
            label: 'Confirmă',
            onClick: () => {
              removeNotification(id);
              resolve(true);
            },
            variant: 'primary'
          }
        ]
      };
      
      setNotifications(prev => [...prev, notification]);
    });
  }, []);

  const showAlert = useCallback((message: string, type: NotificationType = 'info') => {
    showNotification({
      type,
      title: message,
      duration: type === 'error' ? 5000 : 3000
    });
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      removeNotification,
      showConfirm,
      showAlert
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  const getIcon = (type: NotificationType) => {
    const baseClasses = "notification-icon flex-shrink-0";
    switch (type) {
      case 'success':
        return <CheckCircle className={`${baseClasses} text-green-500`} size={20} />;
      case 'error':
        return <AlertCircle className={`${baseClasses} text-red-500`} size={20} />;
      case 'warning':
        return <AlertTriangle className={`${baseClasses} text-yellow-500`} size={20} />;
      case 'info':
      default:
        return <Info className={`${baseClasses} text-blue-500`} size={20} />;
    }
  };

  const getBackgroundColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
            max-height: 200px;
            margin-bottom: 12px;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
            max-height: 0;
            margin-bottom: 0;
          }
        }
        
        @keyframes iconBounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-3px);
          }
          60% {
            transform: translateY(-1px);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        .notification-enter {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .notification-exit {
          animation: slideOutRight 0.3s cubic-bezier(0.4, 0, 1, 1);
        }
        
        .notification-icon {
          animation: iconBounce 0.6s ease-in-out;
        }
        
        .notification-content {
          animation: fadeInUp 0.5s ease-out 0.2s both;
        }
        
        .notification-item {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .notification-item:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .notification-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .notification-button:hover {
          transform: translateY(-1px);
        }
        
        .notification-button:active {
          transform: translateY(0) scale(0.98);
        }
        
        .notification-close {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .notification-close:hover {
          transform: scale(1.1);
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .notification-close:active {
          transform: scale(0.95);
        }
        
        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: linear-gradient(90deg, currentColor 0%, currentColor 100%);
          border-radius: 0 0 0.75rem 0.75rem;
          opacity: 0.6;
        }
        
        .notification-progress.success {
          color: #10b981;
        }
        
        .notification-progress.error {
          color: #ef4444;
        }
        
        .notification-progress.warning {
          color: #f59e0b;
        }
        
        .notification-progress.info {
          color: #3b82f6;
        }
      `}</style>
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              notification-item border rounded-none shadow-xl p-4 backdrop-blur-sm relative overflow-hidden
              ${getBackgroundColor(notification.type)}
              ${notification.isExiting ? 'notification-exit' : 'notification-enter'}
            `}
          >
            {notification.showProgress && (
              <div 
                className={`notification-progress ${notification.type}`}
                style={{
                  width: '100%',
                  animation: `shrinkWidth ${notification.duration || (notification.type === 'error' ? 5000 : 3000)}ms linear`
                }}
              />
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getIcon(notification.type)}
                <div className="flex-1 notification-content">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                    {notification.title}
                  </h4>
                  {notification.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                  )}
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex space-x-2 mt-3">
                      {notification.actions.map((action, index) => (
                        <button
                          key={index}
                          onClick={action.onClick}
                          className={`notification-button text-sm px-4 py-2 rounded-none font-medium ${
                            action.variant === 'primary'
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                              : 'bg-white/80 text-gray-800 hover:bg-white border border-gray-200 dark:bg-gray-700/80 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600'
                          }`}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {!notification.actions && (
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="notification-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2 p-1 rounded-none"
                  aria-label="Închide notificarea"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};