// scripts/seed-events.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const event = await prisma.homepageEvent.create({
        data: {
            title: "Doublez Votre Premier Dépôt",
            description: "Obtenez un bonus de 100% sur votre premier dépôt jusqu'à 100$ ! Profitez-en maintenant pour maximiser vos chances.",
            imageUrl: "https://images.unsplash.com/photo-1634733988138-bf2c3a2a13fa?q=80&w=2070&auto=format&fit=crop",
            buttonText: "Déposer Maintenant",
            buttonLink: "/wallet",
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
            isActive: true,
        },
    });
    console.log('✅ Événement créé:', event);
}

main()
    .catch((e) => {
        console.error('❌ Erreur seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
