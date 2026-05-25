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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet"
import type { UserRole } from "@anivora/api"
import { FieldError } from "#/libs/tanstack-form"
import {
	extractErrorMessage,
	type UserFormSheetProps,
} from "../user-form-helpers"
import { useUserFormCreate } from "./hook"

export function UserFormCreate({
	defaultRole = "user",
	open,
	onOpenChange,
}: Pick<UserFormSheetProps, "defaultRole" | "open" | "onOpenChange">) {
	const { createForm, createUser, canSetRole } = useUserFormCreate({
		defaultRole,
		onOpenChange,
	})

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>New User</SheetTitle>
					<SheetDescription>Create a new user account.</SheetDescription>
				</SheetHeader>
				<form
					className="flex flex-col gap-4 px-4 py-4"
					onSubmit={(e) => {
						e.preventDefault()
						createForm.handleSubmit()
					}}
				>
					<createForm.Field name="name">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="create-name">Name</Label>
								<Input
									id="create-name"
									placeholder="e.g. Jane Smith"
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
					</createForm.Field>

					<createForm.Field name="email">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="create-email">Email</Label>
								<Input
									id="create-email"
									type="email"
									placeholder="e.g. jane@example.com"
									autoComplete="email"
									maxLength={254}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<FieldError field={field} />
							</div>
						)}
					</createForm.Field>

					<createForm.Field name="password">
						{(field) => (
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="create-password">Password</Label>
								<Input
									id="create-password"
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
					</createForm.Field>

					{canSetRole && (
						<createForm.Field name="role">
							{(field) => (
								<div className="flex flex-col gap-1.5">
									<Label>Role</Label>
									<Select
										value={field.state.value}
										onValueChange={(v) => field.handleChange(v as UserRole)}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select a role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="user">User</SelectItem>
											<SelectItem value="admin">Admin</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</createForm.Field>
					)}

					{createUser.error && (
						<p className="text-destructive text-sm" role="alert">
							{extractErrorMessage(createUser.error)}
						</p>
					)}

					<SheetFooter className="px-0">
						<Button
							variant="outline"
							type="button"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<createForm.Subscribe
							selector={(s) => ({
								canSubmit: s.canSubmit,
								isSubmitting: s.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? "Creating…" : "Create"}
								</Button>
							)}
						</createForm.Subscribe>
					</SheetFooter>
				</form>
			</SheetContent>
		</Sheet>
	)
}
