import { cn } from '@/lib/utils'

function Progress({
  value = 0,
  indeterminate = false,
  className,
  indicatorClassName,
  ...props
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-gray-700/80',
        className
      )}
      {...props}
    >
      {indeterminate ? (
        <div
          className={cn(
            'animate-progress-indeterminate h-full w-2/5 rounded-full bg-emerald-500',
            indicatorClassName
          )}
        />
      ) : (
        <div
          className={cn(
            'relative h-full overflow-hidden rounded-full bg-emerald-500 transition-[width] duration-300 ease-out',
            indicatorClassName
          )}
          style={{ width: `${clamped}%` }}
        >
          <div className="animate-progress-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </div>
      )}
    </div>
  )
}

export { Progress }
