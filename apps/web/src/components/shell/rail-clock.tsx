import { useEffect, useState } from "react"

/** Small live HH:MM clock for the bottom of the icon rail. */
export function RailClock() {
	const [now, setNow] = useState(() => new Date())

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 30_000)
		return () => window.clearInterval(id)
	}, [])

	const time = now.toLocaleTimeString("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
	})

	return (
		<time
			className="text-[11px] font-semibold tabular-nums text-anv-muted"
			title="Waktu sekarang"
		>
			{time}
		</time>
	)
}
