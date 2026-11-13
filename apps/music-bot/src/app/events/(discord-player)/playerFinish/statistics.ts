import type { QueueEventHandler } from "@/types/events";
import { syncStatistics } from "@/web/statistics";

const handler: QueueEventHandler<"playerFinish"> = syncStatistics;

export default handler;
