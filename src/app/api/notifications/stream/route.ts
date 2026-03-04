// app/api/notifications/stream/route.ts
import { verifySession } from '@/lib/auth'
import { getUserNotifications, setSendNotificationCallback } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// Map pour stocker les connexions SSE actives
const connections = new Map<string, ReadableStreamDefaultController>()

// 🆕 Fonction pour envoyer une notification via SSE
export function sendNotificationToUser(userId: string, notification: any) {
  const controller = connections.get(userId)
  
  if (controller) {
    try {
      const data = `data: ${JSON.stringify({ 
        type: 'notification', 
        notification 
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(data))
      console.log(`📡 SSE envoyé à user ${userId}`)
    } catch (error) {
      console.error(`❌ Erreur envoi SSE à user ${userId}:`, error)
      connections.delete(userId)
    }
  } else {
    console.log(`⚠️ Aucune connexion SSE active pour user ${userId}`)
  }
}

// 🆕 Enregistrer le callback au chargement du module
setSendNotificationCallback(sendNotificationToUser)
console.log('✅ SSE callback enregistré dans notifications.ts')

export async function GET(request: Request) {
  try {
    const userId = await verifySession()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Créer un stream SSE
    const stream = new ReadableStream({
      start(controller) {
        // Stocker la connexion
        connections.set(userId, controller)
        console.log(`🔌 SSE connexion ouverte pour user ${userId}`)

        // Envoyer un message de connexion initial
        const data = `data: ${JSON.stringify({ type: 'connected', userId })}\n\n`
        controller.enqueue(new TextEncoder().encode(data))

        // Envoyer les notifications initiales
        getUserNotifications(userId, 10).then(notifications => {
          const data = `data: ${JSON.stringify({ 
            type: 'initial', 
            notifications 
          })}\n\n`
          controller.enqueue(new TextEncoder().encode(data))
        })

        // Keep-alive toutes les 30 secondes
        const keepAlive = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(':keep-alive\n\n'))
          } catch (error) {
            clearInterval(keepAlive)
          }
        }, 30000)

        // Cleanup au close
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAlive)
          connections.delete(userId)
          console.log(`🔌 SSE connexion fermée pour user ${userId}`)
          try {
            controller.close()
          } catch (e) {
            // Already closed
          }
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Pour Nginx
      }
    })

  } catch (error) {
    console.error('❌ SSE Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}