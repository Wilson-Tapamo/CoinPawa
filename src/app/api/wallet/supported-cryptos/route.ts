// app/api/wallet/supported-cryptos/route.ts
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Liste des cryptos principales à afficher (dans l'ordre)
const FEATURED_CRYPTOS = [
  { symbol: 'usdttrc20', name: 'USDT (TRC20)', icon: '💵', network: 'TRON', recommended: true },
  { symbol: 'usdterc20', name: 'USDT (ERC20)', icon: '💵', network: 'Ethereum' },
  { symbol: 'usdcmatic', name: 'USDC (Polygon)', icon: '💵', network: 'Polygon' },
  { symbol: 'btc', name: 'Bitcoin', icon: '₿', network: 'Bitcoin' },
  { symbol: 'eth', name: 'Ethereum', icon: 'Ξ', network: 'Ethereum' },
  { symbol: 'bnbbsc', name: 'BNB', icon: '🔶', network: 'BSC' },
  { symbol: 'sol', name: 'Solana', icon: '◎', network: 'Solana' },
  { symbol: 'matic', name: 'Polygon', icon: '🟣', network: 'Polygon' },
  { symbol: 'trx', name: 'TRON', icon: '🔴', network: 'TRON' },
  { symbol: 'ltc', name: 'Litecoin', icon: 'Ł', network: 'Litecoin' },
]

export async function GET() {
  try {
    // Option 1 : Récupérer depuis la BDD (si vous avez peuplé SupportedCrypto)
    const dbCryptos = await prisma.supportedCrypto.findMany({
      where: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    })

    // Si la BDD a des cryptos, les utiliser
    if (dbCryptos.length > 0) {
      return NextResponse.json({
        success: true,
        cryptos: dbCryptos.map((crypto) => ({
          symbol: crypto.symbol.toLowerCase(),
          name: crypto.name,
          network: crypto.network,
          icon: crypto.icon,
          minDeposit: crypto.minDepositUsd,
          recommended: crypto.orderIndex === 1, // USDT TRC20 en premier
        })),
      })
    }

    // Option 2 : Utiliser la liste hardcodée (fallback)
    return NextResponse.json({
      success: true,
      cryptos: FEATURED_CRYPTOS,
    })
  } catch (error: any) {
    console.error('Error fetching supported cryptos:', error)

    // En cas d'erreur, retourner la liste hardcodée
    return NextResponse.json({
      success: true,
      cryptos: FEATURED_CRYPTOS,
    })
  }
}