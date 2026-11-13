import type { QueueEventHandler } from "@/types/events";
import { syncStatistics } from "@/web/statistics";

const handler: QueueEventHandler<"audioFiltersUpdate"> = syncStatistics;

export default handler;
