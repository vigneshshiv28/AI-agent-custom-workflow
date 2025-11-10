-- CreateEnum
CREATE TYPE "NodeExecutionStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "WorkflowExecution" ALTER COLUMN "output" DROP NOT NULL;

-- CreateTable
CREATE TABLE "WorkflowExecutionNodeLog" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "nodeType" TEXT NOT NULL,
    "input" JSONB,
    "output" JSONB,
    "status" "NodeExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WorkflowExecutionNodeLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkflowExecutionNodeLog_executionId_idx" ON "WorkflowExecutionNodeLog"("executionId");

-- CreateIndex
CREATE INDEX "WorkflowExecutionNodeLog_nodeId_idx" ON "WorkflowExecutionNodeLog"("nodeId");

-- CreateIndex
CREATE INDEX "WorkflowExecutionNodeLog_status_idx" ON "WorkflowExecutionNodeLog"("status");

-- AddForeignKey
ALTER TABLE "WorkflowExecutionNodeLog" ADD CONSTRAINT "WorkflowExecutionNodeLog_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "WorkflowExecution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
