// hooks/useNotifications.tsx
"use client";

import { useEffect, useState, useCallback } from 'react'

export interface Notification {
  id: string
  type: string
  title: string
  message: string
  icon?: string
  actionUrl?: string
  read: boolean
  createdAt: string
  data?: any
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      
      if (data.success) {
        const newNotifs = data.notifications
        const newUnreadCount = data.unreadCount
        
        // Détecter nouvelle notification (pour toast)
        if (newNotifs.length > 0 && newNotifs[0].id !== lastNotificationId) {
          const latestNotif = newNotifs[0]
          
          // Déclencher un event custom pour le toast
          if (!latestNotif.read && lastNotificationId !== null) {
            window.dispatchEvent(new CustomEvent('new-notification', { 
              detail: latestNotif 
            }))
          }
          
          setLastNotificationId(latestNotif.id)
        }
        
        setNotifications(newNotifs)
        setUnreadCount(newUnreadCount)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }, [lastNotificationId])

  // Polling toutes les 5 secondes
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 5000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH'
      })
      
      if (res.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  // Mark specific notifications as read
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      // Optimistic update
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    isConnected: true, // Toujours true avec polling
    markAllAsRead,
    markAsRead,
    refetch: fetchNotifications
  }
}