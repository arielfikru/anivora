import { Badge } from "#/components/ui/badge"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Separator } from "#/components/ui/separator"
import { FieldError } from "#/libs/tanstack-form"
import { useSettingsProfile } from "./hook"
import type { SettingsProfileProps } from "./schema"

export function SettingsProfile({
	name,
	email,
	role,
	createdAt,
}: SettingsProfileProps) {
	const { form, submitError } = useSettingsProfile({ name })

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-lg font-semibold">Profile</h2>
				<p className="text-muted-foreground text-sm">
					Update your personal information.
				</p>
			</div>

			<Separator />

			<form
				className="flex flex-col gap-5"
				onSubmit={(e) => {
					e.preventDefault()
					form.handleSubmit()
				}}
			>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<form.Field name="name">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="settings-name">Full Name</Label>
								<Input
									id="settings-name"
									placeholder="Your full name"
									autoComplete="name"
									maxLength={100}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					<div className="flex flex-col gap-1.5">
						<Label>Email</Label>
						<Input
							value={email}
							disabled
							autoComplete="off"
							placeholder="your@email.com"
						/>
						<p className="text-muted-foreground text-xs">
							Email cannot be changed here.
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					<div className="flex flex-col gap-1.5">
						<Label>Role</Label>
						<div className="flex items-center gap-2 py-1">
							<Badge variant="secondary">{role}</Badge>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Member Since</Label>
						<p className="text-muted-foreground py-1 text-sm">
							{createdAt.toLocaleDateString(undefined, {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</p>
					</div>
				</div>

				{submitError && (
					<p className="text-destructive text-sm" role="alert">
						{submitError}
					</p>
				)}

				<div>
					<form.Subscribe
						selector={(s) => ({
							canSubmit: s.canSubmit,
							isSubmitting: s.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Button type="submit" disabled={!canSubmit || isSubmitting}>
								{isSubmitting ? "Saving…" : "Save Changes"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</div>
	)
}
