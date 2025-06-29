-- AlterTable
ALTER TABLE "wbs_entries" ADD COLUMN "phaseId" TEXT;

-- AddForeignKey
ALTER TABLE "wbs_entries" ADD CONSTRAINT "wbs_entries_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE CASCADE;
