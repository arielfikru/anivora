import { Button } from "#/components/ui/button"
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "#/components/ui/sheet"

interface Props {
	open: boolean
	onOpenChange: (open: boolean) => void
	label: string
	pending: boolean
	onConfirm: () => void
}

export function ConfirmDelete({
	open,
	onOpenChange,
	label,
	pending,
	onConfirm,
}: Props) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right">
				<SheetHeader>
					<SheetTitle>Delete</SheetTitle>
					<SheetDescription>This action cannot be undone.</SheetDescription>
				</SheetHeader>
				<div className="px-4 py-4 text-sm">
					Are you sure you want to delete{" "}
					<span className="font-medium">{label}</span>?
				</div>
				<SheetFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button variant="destructive" disabled={pending} onClick={onConfirm}>
						{pending ? "Deleting…" : "Delete"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	)
}
