import type { AnyFieldApi } from "@tanstack/react-form"

interface FieldErrorProps {
	field: AnyFieldApi
	className?: string
	requireTouched?: boolean
}

export function FieldError({
	field,
	className,
	requireTouched = true,
}: FieldErrorProps) {
	const { isTouched, errors } = field.state.meta
	if (requireTouched && !isTouched) return null
	if (errors.length === 0) return null

	const first = errors[0]
	const message =
		typeof first === "string"
			? first
			: ((first as { message?: string } | null | undefined)?.message ??
				"Invalid value")

	return (
		<p role="alert" className={className ?? "text-destructive text-sm"}>
			{message}
		</p>
	)
}
