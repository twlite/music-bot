import { Progress } from '../ui/progress';

export function TrackProgress({
  duration,
  progress,
}: {
  duration: {
    current: string;
    total: string;
  };
  progress: number;
}) {
  return (
    <div className="flex items-center gap-5 w-[70%]">
      <span>{duration.current}</span>
      <Progress value={progress} className="w-full" />
      <span>{duration.total}</span>
    </div>
  );
}
