import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Moves every stored image URL from the legacy CDN host to the Hafwear CDN.
// Run only after images.hafwear.com serves the same bucket.
const OLD_HOST = process.env.OLD_IMAGE_HOST || "https://images.ravora.co.uk/";
const NEW_HOST = process.env.NEW_IMAGE_HOST || "https://images.hafwear.com/";

async function main() {
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DIRECT_URL / DATABASE_URL not set");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  console.log(`Rewriting ${OLD_HOST} → ${NEW_HOST}`);

  const productImages = await prisma.$executeRawUnsafe(
    `UPDATE "ProductImage" SET "url" = REPLACE("url", $1, $2) WHERE "url" LIKE $3`,
    OLD_HOST,
    NEW_HOST,
    `${OLD_HOST}%`,
  );
  console.log(`ProductImage rows updated: ${productImages}`);

  const banners = await prisma.$executeRawUnsafe(
    `UPDATE "Banner" SET "imageUrl" = REPLACE("imageUrl", $1, $2) WHERE "imageUrl" LIKE $3`,
    OLD_HOST,
    NEW_HOST,
    `${OLD_HOST}%`,
  );
  console.log(`Banner rows updated: ${banners}`);

  const categories = await prisma.$executeRawUnsafe(
    `UPDATE "Category" SET "imageUrl" = REPLACE("imageUrl", $1, $2) WHERE "imageUrl" LIKE $3`,
    OLD_HOST,
    NEW_HOST,
    `${OLD_HOST}%`,
  );
  console.log(`Category rows updated: ${categories}`);

  const brands = await prisma.$executeRawUnsafe(
    `UPDATE "Brand" SET "logoUrl" = REPLACE("logoUrl", $1, $2) WHERE "logoUrl" LIKE $3`,
    OLD_HOST,
    NEW_HOST,
    `${OLD_HOST}%`,
  );
  console.log(`Brand rows updated: ${brands}`);

  const settings = await prisma.$executeRawUnsafe(
    `UPDATE "StoreSettings"
       SET "logoUrl" = REPLACE(COALESCE("logoUrl", ''), $1, $2),
           "faviconUrl" = REPLACE(COALESCE("faviconUrl", ''), $1, $2)
     WHERE "logoUrl" LIKE $3 OR "faviconUrl" LIKE $3`,
    OLD_HOST,
    NEW_HOST,
    `${OLD_HOST}%`,
  );
  console.log(`StoreSettings rows updated: ${settings}`);

  const sample = await prisma.productImage.findMany({
    take: 3,
    select: { url: true },
  });
  console.log("Sample after update:", sample);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
