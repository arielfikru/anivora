import type { ReactNode } from "react"
import { useSpatialNav } from "#/libs/spatial-nav/use-spatial-nav.ts"
import { IconRail } from "./icon-rail.tsx"

interface IStreamShellProps {
	children: ReactNode
}

/** Public streaming shell: fixed icon rail + scrolling main area. */
export function StreamShell({ children }: IStreamShellProps) {
	useSpatialNav()

	return (
		<div className="min-h-screen bg-anv-bg text-anv-text">
			<IconRail />
			<main className="ml-[72px] min-h-screen pb-16">{children}</main>
		</div>
	)
}
