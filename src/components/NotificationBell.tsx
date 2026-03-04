"use client";

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useNotifications, Notification } from '@/hooks/useNotifications'

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer au clic outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Animation shake quand nouvelle notif
  const [shake, setShake] = useState(false)
  
  useEffect(() => {
    if (unreadCount > 0) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }, [unreadCount])

  // Limiter à 5 notifications dans le dropdown
  const recentNotifications = notifications.slice(0, 5)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-full hover:bg-white/5 text-text-secondary hover:text-white transition-all relative",
          shake && "animate-bounce"
        )}
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge nombre non lues */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary-hover font-bold flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Tout marquer
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-text-tertiary">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  onClick={() => {
                    if (!notif.read) {
                      markAsRead([notif.id])
                    }
                    setIsOpen(false)
                  }}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="p-3 border-t border-white/5 text-center">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-xs text-primary hover:text-primary-hover font-bold flex items-center justify-center gap-1"
              >
                Voir tout ({notifications.length})
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Composant item de notification
interface NotificationItemProps {
  notification: Notification
  onClick: () => void
}

function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const timeAgo = getTimeAgo(notification.createdAt)

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 hover:bg-white/5 transition-colors cursor-pointer border-l-2",
        notification.read 
          ? "border-transparent opacity-60" 
          : "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {notification.icon && (
          <span className="text-2xl flex-shrink-0">
            {notification.icon}
          </span>
        )}
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="font-bold text-white text-sm mb-1 truncate">
            {notification.title}
          </p>
          
          {/* Message */}
          <p className="text-xs text-text-secondary line-clamp-2">
            {notification.message}
          </p>
          
          {/* Time */}
          <p className="text-[10px] text-text-tertiary mt-1">
            {timeAgo}
          </p>
        </div>
        
        {/* Dot non lu */}
        {!notification.read && (
          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  )
}

// Helper time ago
function getTimeAgo(timestamp: string): string {
  const now = new Date()
  const past = new Date(timestamp)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `Il y a ${diffHours}h`
  
  const diffDays = Math.floor(diffHours / 24)
  return `Il y a ${diffDays}j`
}