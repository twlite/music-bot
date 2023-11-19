import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="grid place-items-center h-screen">
      <div className="flex flex-col gap-5">
        <h1 className="text-lg text-accent-foreground">
          Current value is {count}
        </h1>
        <Button onClick={() => setCount(count + 1)}>Click me</Button>
      </div>
    </main>
  );
}
