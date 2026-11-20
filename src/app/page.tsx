import { WidgetGenerator } from '@/components/generator/WidgetGenerator';
import { Hero } from '@/components/landing/Hero';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-10 px-4 py-16">
      <Hero />
      <WidgetGenerator />
    </main>
  );
}
