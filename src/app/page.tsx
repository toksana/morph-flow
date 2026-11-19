import { TaskListGenerator } from '@/components/widgets/taskList/TaskListGenerator';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
      <h1 className="font-heading text-2xl font-semibold">Morph Flow</h1>
      <TaskListGenerator />
    </main>
  );
}
