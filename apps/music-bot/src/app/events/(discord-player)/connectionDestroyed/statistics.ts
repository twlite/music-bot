import type { QueueEventHandler } from "@/types/events";
import { syncStatistics } from "@/web/statistics";

const handler: QueueEventHandler<"connectionDestroyed"> = syncStatistics;

export default handler;
