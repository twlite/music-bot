import type { QueueEventHandler } from "@/types/events";
import { syncStatistics } from "@/web/statistics";

const handler: QueueEventHandler<"playerStop"> = syncStatistics;

export default handler;
