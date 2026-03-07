// components/NotificationToast.tsx
"use client";

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Notification } from '@/hooks/useNotifications'

export function NotificationToast() {
  const [visibleToasts, setVisibleToasts] = useState<Notification[]>([])

  // Écouter l'event custom de nouvelle notification
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent<Notification>) => {
      const notif = event.detail
      
      // Ajouter au toast
      setVisibleToasts(prev => [notif, ...prev].slice(0, 3))
      
      // Auto-hide après 5 secondes
      setTimeout(() => {
        setVisibleToasts(prev => prev.filter(t => t.id !== notif.id))
      }, 5000)
      
      // Son de notification
      playNotificationSound()
    }

    window.addEventListener('new-notification', handleNewNotification as EventListener)
    
    return () => {
      window.removeEventListener('new-notification', handleNewNotification as EventListener)
    }
  }, [])

  const removeToast = (id: string) => {
    setVisibleToasts(prev => prev.filter(t => t.id !== id))
  }

  if (visibleToasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {visibleToasts.map((notif) => (
        <ToastItem
          key={notif.id}
          notification={notif}
          onClose={() => removeToast(notif.id)}
        />
      ))}
    </div>
  )
}

// Item de toast
interface ToastItemProps {
  notification: Notification
  onClose: () => void
}

function ToastItem({ notification, onClose }: ToastItemProps) {
  return (
    <div
      className={cn(
        "w-80 bg-surface border border-white/10 rounded-xl shadow-2xl p-4 pointer-events-auto",
        "animate-in slide-in-from-right duration-300"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {notification.icon && (
          <span className="text-3xl flex-shrink-0">
            {notification.icon}
          </span>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-bold text-white text-sm mb-1">
            {notification.title}
          </p>
          
          {/* Message */}
          <p className="text-xs text-text-secondary">
            {notification.message}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full"
          style={{ 
            animation: 'progress 5s linear forwards',
            width: '100%'
          }}
        />
      </div>
    </div>
  )
}

// Son de notification
function playNotificationSound() {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjiO0fTPhy4HKHzJ8N2URwoWZ7vo66hWGgtDnOHwuWkfCDaP0/TLeSsFJHnJ8N+UQw==')
    audio.volume = 0.3
    audio.play().catch(() => {})
  } catch (error) {
    // Ignore
  }
}