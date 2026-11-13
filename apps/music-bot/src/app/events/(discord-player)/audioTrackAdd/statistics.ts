import type { QueueEventHandler } from "@/types/events";
import { syncStatistics } from "@/web/statistics";

const handler: QueueEventHandler<"audioTrackAdd"> = syncStatistics;

export default handler;
