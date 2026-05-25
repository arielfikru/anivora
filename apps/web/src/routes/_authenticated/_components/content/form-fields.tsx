import * as React from "react"
import { toast } from "sonner"

import { Button } from "#/components/ui/button"
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
import { useImageUpload } from "./use-image-upload.ts"

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

export function ImageField({
	form,
	name,
	label,
	hint,
}: BaseProps & { hint?: string }) {
	const inputRef = React.useRef<HTMLInputElement>(null)
	const { state, upload } = useImageUpload()
	return (
		<form.Field name={name}>
			{(field: AnyForm) => {
				const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
					const file = e.target.files?.[0]
					if (!file) return
					try {
						field.handleChange(await upload(file))
						toast.success(`${label} uploaded`)
					} catch (err) {
						toast.error((err as Error).message)
					}
				}
				return (
					<div className="flex flex-col gap-1.5">
						<Label>{label}</Label>
						{hint ? (
							<p className="text-xs text-muted-foreground">{hint}</p>
						) : null}
						<ImagePreview value={field.state.value} />
						<input
							ref={inputRef}
							type="file"
							accept="image/*"
							className="hidden"
							onChange={onPick}
						/>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="secondary"
								size="sm"
								disabled={state.uploading}
								onClick={() => inputRef.current?.click()}
							>
								{state.uploading
									? `Uploading ${state.progress}%`
									: field.state.value
										? "Replace image"
										: "Upload image"}
							</Button>
							{field.state.value ? (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => field.handleChange("")}
								>
									Remove
								</Button>
							) : null}
						</div>
					</div>
				)
			}}
		</form.Field>
	)
}

function ImagePreview({ value }: { value: string }) {
	if (!value) return null
	return (
		<img
			src={value}
			alt="preview"
			className="h-28 w-auto max-w-full rounded-md border border-border object-cover"
		/>
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
