import type { QueueEventHandler } from "@/types/events";
import { syncStatistics } from "@/web/statistics";

const handler: QueueEventHandler<"playerResume"> = syncStatistics;

export default handler;
