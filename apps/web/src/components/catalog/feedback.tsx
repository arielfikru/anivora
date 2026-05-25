import { Skeleton } from "#/components/ui/skeleton"

/** Generic page skeleton for Suspense fallbacks. */
export function PageSkeleton() {
	return (
		<div className="space-y-6 p-6 lg:p-10">
			<Skeleton className="h-[40vh] w-full rounded-2xl" />
			<div className="flex gap-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className="aspect-video w-[220px] rounded-xl" />
				))}
			</div>
		</div>
	)
}

/** Grid skeleton for catalog/search/genre pages. */
export function GridSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4 lg:p-10 xl:grid-cols-5">
			{Array.from({ length: 10 }).map((_, i) => (
				<Skeleton key={i} className="aspect-video w-full rounded-xl" />
			))}
		</div>
	)
}

/** Inline error message used by route error boundaries. */
export function ErrorMessage({ message }: { message: string }) {
	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-10 text-center">
			<p className="display-title text-2xl font-bold text-anv-text">
				Terjadi kesalahan
			</p>
			<p className="text-sm text-anv-muted">{message}</p>
		</div>
	)
}
