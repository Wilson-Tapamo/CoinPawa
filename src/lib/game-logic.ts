// import { prisma } from '@/lib/prisma'

// // --- PHASE 1 : DÉBUT DU JEU (DÉBIT) ---
// export async function startGameSession(userId: string, gameType: string, betAmount: number, initialGameData: any = {}) {
//   return await prisma.$transaction(async (tx) => {
//     // 1. Vérifier le solde
//     const wallet = await tx.wallet.findUnique({ where: { userId } })
//     if (!wallet) throw new Error("Wallet introuvable")

//     if (wallet.balanceSats < BigInt(betAmount)) {
//       throw new Error("Fonds insuffisants")
//     }

//     // 2. DÉBITER IMMÉDIATEMENT LA MISE
//     await tx.wallet.update({
//       where: { id: wallet.id },
//       data: {
//         balanceSats: { decrement: betAmount },
//         totalWageredSats: { increment: betAmount } // On compte la mise pour le Wager Requirement
//       }
//     })

//     // 3. CRÉER LA SESSION DE JEU (Statut ACTIVE)
//     const newGame = await tx.game.create({
//       data: {
//         userId,
//         gameType,
//         status: 'ACTIVE', // La partie est en cours
//         betAmount: betAmount,
//         gameData: initialGameData // Ex: Position des mines (cachées)
//       }
//     })

//     // 4. Créer la trace de transaction (Optionnel ici, ou à la fin, mais c'est bien de tracer le débit)
//     await tx.transaction.create({
//       data: {
//         walletId: wallet.id,
//         type: 'GAME_BET',
//         amountSats: betAmount,
//         status: 'COMPLETED',
//         paymentRef: newGame.id
//       }
//     })

//     return newGame
//   })
// }

// // --- PHASE 2 : FIN DU JEU (CRÉDIT SI GAIN) ---
// export async function endGameSession(gameId: string, payoutAmount: number, finalGameData: any) {
//   return await prisma.$transaction(async (tx) => {
//     // 1. Récupérer le jeu
//     const game = await tx.game.findUnique({ where: { id: gameId } })
    
//     if (!game) throw new Error("Jeu introuvable")
//     if (game.status === 'ENDED') throw new Error("Ce jeu est déjà terminé !")

//     // 2. METTRE À JOUR LE JEU
//     await tx.game.update({
//       where: { id: gameId },
//       data: {
//         status: 'ENDED',
//         payout: payoutAmount,
//         gameData: finalGameData // Ex: Historique des clics
//       }
//     })

//     // 3. SI GAIN > 0, ON CRÉDITE LE WALLET
//     if (payoutAmount > 0) {
//       const wallet = await tx.wallet.findUnique({ where: { userId: game.userId } })
//       if (wallet) {
//         await tx.wallet.update({
//           where: { id: wallet.id },
//           data: { balanceSats: { increment: payoutAmount } }
//         })

//         // Trace du gain
//         await tx.transaction.create({
//           data: {
//             walletId: wallet.id,
//             type: 'GAME_WIN',
//             amountSats: payoutAmount,
//             status: 'COMPLETED',
//             paymentRef: gameId
//           }
//         })
//       }
//     }

//     return { success: true, payout: payoutAmount }
//   })
// }