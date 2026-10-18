import { Skeleton } from '@/components/ui/skeleton'
import { TIME_BLOCKS } from '@/types/task'

/** First-load placeholder while local data is read (design S2 loading state). */
export function CanvasSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading tasks" className="grid gap-4 md:grid-cols-3 lg:gap-6">
      {TIME_BLOCKS.map((block, index) => (
        <div key={block} className={index > 0 ? 'hidden flex-col gap-3 md:flex' : 'flex flex-col gap-3'}>
          <Skeleton className="h-5 w-24" />
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}
