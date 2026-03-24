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
    return notification
  } catch (error) {
    console.error('❌ Erreur création notification:', error)
    return null
  }
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
    actionUrl: `/wallet`,
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