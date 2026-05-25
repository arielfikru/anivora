import { useSession } from "./use-session"

export const useIsAdmin = (): boolean => {
	const { data: session } = useSession()
	return session?.user?.role === "admin"
}
