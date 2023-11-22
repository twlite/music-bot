import { Navbar } from '@/components/nav';
import { PlayerController } from '@/components/player/controller';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <main>
      <Navbar />
      <PlayerController showArt />
      <Toaster />
    </main>
  );
}
