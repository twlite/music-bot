import { Navbar } from '@/components/nav';
import { PlayerController } from '@/components/player/controller';

export default function Home() {
  return (
    <main>
      <Navbar />
      <PlayerController showArt />
    </main>
  );
}
