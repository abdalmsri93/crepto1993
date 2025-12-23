import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface AlertNotification {
  id: string;
  coin: string;
  changeValue: number;
  changePercent: number;
  initialValue: number;
  currentValue: number;
  timestamp: string;
}

interface AlertNotificationsProps {
  notifications: AlertNotification[];
  onDismiss: (id: string) => void;
}

export const AlertNotifications: React.FC<AlertNotificationsProps> = ({ 
  notifications, 
  onDismiss 
}) => {
  if (notifications.length === 0) return null;

  // استخدام Portal لعرض الإشعارات في body مباشرة
  return createPortal(
    <div 
      id="alert-notifications-container"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '0',
        right: '0',
        zIndex: 2147483647,
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        justifyContent: 'center',
        alignItems: 'flex-end',
        padding: '0 16px',
        pointerEvents: 'none',
        maxHeight: '40vh',
        overflowY: 'auto',
      }}
    >
      {notifications.map((notification) => {
        const isPositive = notification.changeValue >= 0;
        
        return (
          <div
            key={notification.id}
            style={{ pointerEvents: 'auto' }}
            className={`
              relative p-4 rounded-xl shadow-2xl border-2 backdrop-blur-md
              min-w-[180px] max-w-[220px]
              animate-fade-in
              ${isPositive 
                ? 'bg-green-500/20 border-green-500/50 shadow-green-500/20' 
                : 'bg-red-500/20 border-red-500/50 shadow-red-500/20'
              }
            `}
          >
            {/* زر الإغلاق */}
            <button
              onClick={() => onDismiss(notification.id)}
              title="إغلاق"
              aria-label="إغلاق التنبيه"
              className={`
                absolute -top-2 -right-2 w-6 h-6 rounded-full 
                flex items-center justify-center
                transition-all duration-200 hover:scale-110
                ${isPositive 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-red-500 hover:bg-red-600'
                }
              `}
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* اسم العملة */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-2xl ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {isPositive ? '🟢' : '🔴'}
              </span>
              <span className="font-orbitron font-bold text-lg text-foreground">
                {notification.coin}
              </span>
            </div>

            {/* التغير بالدولار */}
            <div className={`text-xl font-bold font-orbitron ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{notification.changeValue.toFixed(2)}$
            </div>

            {/* التغير بالنسبة */}
            <div className={`text-sm font-semibold ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
              ({isPositive ? '+' : ''}{notification.changePercent.toFixed(2)}%)
            </div>

            {/* القيم */}
            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>من:</span>
                <span>${notification.initialValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>إلى:</span>
                <span className="font-semibold text-foreground">${notification.currentValue.toFixed(2)}</span>
              </div>
            </div>

            {/* الوقت */}
            <div className="mt-2 text-[10px] text-muted-foreground/60 text-center">
              {new Date(notification.timestamp).toLocaleTimeString('ar-SA')}
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
};

export default AlertNotifications;
