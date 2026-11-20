import { WidgetGenerator } from '@/components/generator/WidgetGenerator';
import { Hero } from '@/components/landing/Hero';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4">
      <WidgetGenerator intro={<Hero />} />
    </main>
  );
}
