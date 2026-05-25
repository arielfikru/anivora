import { forbidden } from "./errors.ts"

export function assertNotSelf(
	callerUserId: string,
	targetUserId: string,
	action: string,
) {
	if (targetUserId === callerUserId) {
		throw forbidden(`You cannot ${action} your own account`)
	}
}
