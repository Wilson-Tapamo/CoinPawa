// app/notifications/page.tsx
"use client";

import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/hooks/useNotifications'

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications()

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">Retour</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-white mb-1">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-text-secondary">
                  {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-bold rounded-xl hover:bg-primary-hover transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                Tout marquer comme lu
              </button>
            )}
          </div>
        </div>

        {/* Liste */}
        {notifications.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-white/5 p-12 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-text-tertiary opacity-50" />
            <p className="text-text-secondary text-lg mb-2">Aucune notification</p>
            <p className="text-text-tertiary text-sm">
              Vous serez notifié ici pour les dépôts, retraits et gains importants
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <NotificationCard key={notif.id} notification={notif} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Carte de notification
interface NotificationCardProps {
  notification: any
}

function NotificationCard({ notification }: NotificationCardProps) {
  const timeAgo = getTimeAgo(notification.createdAt)
  const date = new Date(notification.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div
      className={cn(
        "bg-surface rounded-xl border-l-4 p-6 transition-all",
        notification.read
          ? "border-white/5 opacity-60"
          : "border-primary bg-primary/5"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        {notification.icon && (
          <div className="flex-shrink-0">
            <span className="text-4xl">{notification.icon}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="font-bold text-white text-lg">
              {notification.title}
            </h3>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2" />
            )}
          </div>

          {/* Message */}
          <p className="text-text-secondary mb-3">
            {notification.message}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <span>{timeAgo}</span>
            <span>•</span>
            <span>{date}</span>
          </div>

          {/* Action URL */}
          {notification.actionUrl && (
            <div className="mt-3">
              <Link
                href={notification.actionUrl}
                className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary-hover"
              >
                Voir les détails →
              </Link>
            </div>
          )}
        </div>
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
  if (diffDays < 7) return `Il y a ${diffDays}j`
  
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`
  
  const diffMonths = Math.floor(diffDays / 30)
  return `Il y a ${diffMonths} mois`
}