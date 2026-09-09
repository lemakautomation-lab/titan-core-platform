-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShoppingList_tenantId_athleteId_idx" ON "ShoppingList"("tenantId", "athleteId");

-- CreateIndex
CREATE INDEX "ShoppingList_tenantId_mealPlanId_idx" ON "ShoppingList"("tenantId", "mealPlanId");

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_athleteId_tenantId_fkey" FOREIGN KEY ("athleteId", "tenantId") REFERENCES "Athlete"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_mealPlanId_tenantId_fkey" FOREIGN KEY ("mealPlanId", "tenantId") REFERENCES "MealPlan"("id", "tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;
