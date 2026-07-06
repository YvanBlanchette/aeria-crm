import { ForfaitsCalculator } from "@/components/ForfaitsCalculator";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ForfaitsPage() {
	await requireUser();

	return (
		<div className="max-w-4xl">
			<ForfaitsCalculator />
		</div>
	);
}
