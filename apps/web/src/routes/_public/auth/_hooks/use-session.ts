import { authClient } from "#/libs/auth/client"

export const useSession = () => authClient.useSession()
