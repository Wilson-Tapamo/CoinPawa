// lib/notifications.ts
import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: any
  icon?: string
  actionUrl?: string
}

// Import de la fonction SSE (sera enregistrée au démarrage)
let sendNotificationToUserFn: ((userId: string, notification: any) => void) | null = null

// Fonction pour enregistrer le callback SSE
export function setSendNotificationCallback(fn: (userId: string, notification: any) => void) {
  sendNotificationToUserFn = fn
  console.log('✅ SSE callback enregistré')
}

/**
 * Crée une notification pour un utilisateur
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  data,
  icon,
  actionUrl
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.parse(JSON.stringify(data)) : null,
        icon,
        actionUrl
      }
    })

    console.log(`🔔 Notification créée: ${type} pour user ${userId}`)
    
    // 🆕 Déclencher l'événement SSE si disponible
    if (sendNotificationToUserFn) {
      try {
        sendNotificationToUserFn(userId, notification)
        console.log(`📡 SSE push envoyé pour user ${userId}`)
      } catch (sseError) {
        console.error('❌ Erreur SSE push:', sseError)
      }
    } else {
      console.warn('⚠️ SSE callback non enregistré - notification visible après refresh')
    }
    
    return notification
  } catch (error) {
    console.error('❌ Erreur création notification:', error)
    return null
  }
}

/**
 * Marque des notifications comme lues
 */
export async function markNotificationsAsRead(userId: string, notificationIds: string[]) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })
    
    return true
  } catch (error) {
    console.error('❌ Erreur mark as read:', error)
    return false
  }
}

/**
 * Marque TOUTES les notifications d'un user comme lues
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })
    
    return true
  } catch (error) {
    console.error('❌ Erreur mark all as read:', error)
    return false
  }
}

/**
 * Récupère les notifications d'un user
 */
export async function getUserNotifications(userId: string, limit = 50) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
    
    return notifications
  } catch (error) {
    console.error('❌ Erreur get notifications:', error)
    return []
  }
}

/**
 * Compte les notifications non lues
 */
export async function getUnreadCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })
    
    return count
  } catch (error) {
    console.error('❌ Erreur count unread:', error)
    return 0
  }
}

// =====================================
// HELPERS SPÉCIFIQUES PAR TYPE
// =====================================

/**
 * Notifier un dépôt confirmé
 */
export async function notifyDepositConfirmed(userId: string, amount: number, currency: string) {
  return createNotification({
    userId,
    type: 'DEPOSIT_CONFIRMED',
    title: 'Dépôt confirmé !',
    message: `Votre dépôt de $${amount.toFixed(2)} en ${currency} a été confirmé.`,
    icon: '💰',
    actionUrl: '/wallet',
    data: { amount, currency }
  })
}

/**
 * Notifier un retrait approuvé
 */
export async function notifyWithdrawalApproved(userId: string, amount: number, txId: string) {
  return createNotification({
    userId,
    type: 'WITHDRAWAL_APPROVED',
    title: 'Retrait approuvé !',
    message: `Votre retrait de $${amount.toFixed(2)} a été approuvé et sera traité sous peu.`,
    icon: '✅',
    actionUrl: `/transaction/${txId}`,
    data: { amount, txId }
  })
}

/**
 * Notifier un retrait rejeté
 */
export async function notifyWithdrawalRejected(userId: string, amount: number, reason: string) {
  return createNotification({
    userId,
    type: 'WITHDRAWAL_REJECTED',
    title: 'Retrait rejeté',
    message: `Votre retrait de $${amount.toFixed(2)} a été rejeté. Raison: ${reason}`,
    icon: '❌',
    actionUrl: '/wallet',
    data: { amount, reason }
  })
}

/**
 * Notifier un gain au Lotto
 */
export async function notifyLotteryWin(userId: string, amount: number, gameId: string) {
  return createNotification({
    userId,
    type: 'LOTTERY_WIN',
    title: '🎉 Vous avez gagné !',
    message: `Félicitations ! Vous avez gagné $${amount.toFixed(2)} au Lotto !`,
    icon: '🎰',
    actionUrl: `/game/${gameId}`,
    data: { amount, gameId }
  })
}

/**
 * Notifier un gros gain (>$100)
 */
export async function notifyBigWin(userId: string, amount: number, gameName: string) {
  return createNotification({
    userId,
    type: 'GAME_WIN_BIG',
    title: '💎 Gros gain !',
    message: `Incroyable ! Vous avez gagné $${amount.toFixed(2)} sur ${gameName} !`,
    icon: '🔥',
    actionUrl: '/wallet',
    data: { amount, gameName }
  })
}