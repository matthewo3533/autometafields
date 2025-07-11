-- CreateTable
CREATE TABLE "MetafieldRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "collectionTitle" TEXT NOT NULL,
    "namespace" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "ownerResource" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MetafieldLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ruleId" INTEGER NOT NULL,
    "productId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetafieldLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "MetafieldRule" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
