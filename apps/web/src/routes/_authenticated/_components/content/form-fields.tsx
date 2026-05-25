import type * as React from "react"

import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select"
import { Switch } from "#/components/ui/switch"
import { Textarea } from "#/components/ui/textarea"

// biome-ignore lint/suspicious/noExplicitAny: tanstack form generics
export type AnyForm = any

interface BaseProps {
	form: AnyForm
	name: string
	label: string
}

export function TextField({ form, name, label }: BaseProps) {
	return (
		<form.Field name={name}>
			{(field: AnyForm) => (
				<div className="flex flex-col gap-1.5">
					<Label>{label}</Label>
					<Input
						value={field.state.value}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
							field.handleChange(e.target.value)
						}
						onBlur={field.handleBlur}
					/>
				</div>
			)}
		</form.Field>
	)
}

export function AreaField({ form, name, label }: BaseProps) {
	return (
		<form.Field name={name}>
			{(field: AnyForm) => (
				<div className="flex flex-col gap-1.5">
					<Label>{label}</Label>
					<Textarea
						value={field.state.value}
						onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
							field.handleChange(e.target.value)
						}
						onBlur={field.handleBlur}
					/>
				</div>
			)}
		</form.Field>
	)
}

export function SelectField({
	form,
	name,
	label,
	options,
}: BaseProps & { options: readonly string[] }) {
	return (
		<form.Field name={name}>
			{(field: AnyForm) => (
				<div className="flex flex-col gap-1.5">
					<Label>{label}</Label>
					<Select
						value={field.state.value}
						onValueChange={(v) => field.handleChange(v)}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{options.map((o) => (
								<SelectItem key={o} value={o}>
									{o}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			)}
		</form.Field>
	)
}

export function SwitchField({ form, name, label }: BaseProps) {
	return (
		<form.Field name={name}>
			{(field: AnyForm) => (
				<div className="flex items-center justify-between">
					<Label>{label}</Label>
					<Switch
						checked={field.state.value}
						onCheckedChange={(c) => field.handleChange(c)}
					/>
				</div>
			)}
		</form.Field>
	)
}
