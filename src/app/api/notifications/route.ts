// app/api/notifications/route.ts
import { NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'
import { getUserNotifications, getUnreadCount, markAllNotificationsAsRead } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// GET - Récupérer les notifications
export async function GET(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const notifications = await getUserNotifications(userId, limit)
    const unreadCount = await getUnreadCount(userId)

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount
    })

  } catch (error) {
    console.error('❌ Error fetching notifications:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}

// PATCH - Marquer toutes comme lues
export async function PATCH(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    await markAllNotificationsAsRead(userId)

    return NextResponse.json({
      success: true,
      message: 'Toutes les notifications ont été marquées comme lues'
    })

  } catch (error) {
    console.error('❌ Error marking notifications as read:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}