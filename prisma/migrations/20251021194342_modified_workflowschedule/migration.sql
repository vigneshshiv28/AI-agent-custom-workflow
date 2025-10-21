-- AlterTable
ALTER TABLE "WorkflowSchedule" ADD COLUMN     "intervalConfig" JSONB,
ALTER COLUMN "timezone" SET DEFAULT 'UTC';

-- CreateIndex
CREATE INDEX "WorkflowSchedule_status_nextRunAt_idx" ON "WorkflowSchedule"("status", "nextRunAt");
