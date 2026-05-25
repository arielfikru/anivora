import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Separator } from "#/components/ui/separator"
import { FieldError } from "#/libs/tanstack-form"
import { useSettingsSecurity } from "./hook"

export function SettingsSecurity() {
	const { form, submitError } = useSettingsSecurity()

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h2 className="text-lg font-semibold">Security</h2>
				<p className="text-muted-foreground text-sm">
					Manage your password and account security.
				</p>
			</div>

			<Separator />

			<div>
				<h3 className="mb-4 text-sm font-medium">Change Password</h3>

				<form
					className="flex max-w-sm flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault()
						form.handleSubmit()
					}}
				>
					<form.Field name="currentPassword">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="current-password">Current Password</Label>
								<Input
									id="current-password"
									type="password"
									placeholder="Your current password"
									autoComplete="current-password"
									maxLength={72}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					<form.Field name="newPassword">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="new-password">New Password</Label>
								<Input
									id="new-password"
									type="password"
									placeholder="Min. 8 characters"
									autoComplete="new-password"
									maxLength={72}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					<form.Field name="confirmPassword">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="confirm-password">Confirm New Password</Label>
								<Input
									id="confirm-password"
									type="password"
									placeholder="Repeat your new password"
									autoComplete="new-password"
									maxLength={72}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

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
									{isSubmitting ? "Updating…" : "Update Password"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</div>
		</div>
	)
}
