-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('CRON', 'INTERVAL', 'CALENDAR');

-- AlterTable
ALTER TABLE "WorkflowSchedule" ADD COLUMN     "calendarDate" TIMESTAMP(3),
ADD COLUMN     "intervalSeconds" INTEGER,
ADD COLUMN     "type" "ScheduleType" NOT NULL DEFAULT 'CRON',
ALTER COLUMN "cronExpression" DROP NOT NULL,
ALTER COLUMN "timezone" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
