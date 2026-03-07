import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATEGORIES = [
  {
    name: "Health & Medicine",
    slug: "health-medicine",
    description: "Claims about health, medicine, treatments, and medical research",
  },
  {
    name: "Politics & Government",
    slug: "politics-government",
    description: "Claims about political figures, government policies, and elections",
  },
  {
    name: "Science & Technology",
    slug: "science-technology",
    description: "Claims about scientific discoveries, technology, and innovation",
  },
  {
    name: "Environment & Climate",
    slug: "environment-climate",
    description: "Claims about climate change, environmental policies, and natural disasters",
  },
  {
    name: "Finance & Economy",
    slug: "finance-economy",
    description: "Claims about financial markets, economic policies, and monetary issues",
  },
  {
    name: "Social Media & Viral",
    slug: "social-media-viral",
    description: "Viral claims, hoaxes, and misinformation spread through social media",
  },
  {
    name: "Education",
    slug: "education",
    description: "Claims about educational institutions, policies, and practices",
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    description: "Claims about celebrities, media, and the entertainment industry",
  },
  {
    name: "International Affairs",
    slug: "international-affairs",
    description: "Claims about international relations, conflicts, and global events",
  },
  {
    name: "Consumer & Product",
    slug: "consumer-product",
    description: "Claims about consumer products, safety recalls, and scams",
  },
];

async function main() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, description: category.description },
      create: category,
    });
  }
  console.log(`Seeded ${CATEGORIES.length} categories`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
