import { PlusIcon } from 'lucide-react'

/** Phones only: floating "Add task" button (design spec Section 4). */
export function AddTaskFab({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Add task"
      className="fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none focus-visible:ring-4 focus-visible:ring-ring md:hidden"
    >
      <PlusIcon aria-hidden="true" className="size-6" />
    </button>
  )
}
