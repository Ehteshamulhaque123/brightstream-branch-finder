"use client";

import dynamic from "next/dynamic";
import type { NormalizedBranch } from "../lib/normalize";

const BranchMapInner = dynamic(() => import("./BranchMapInner"), { ssr: false });

export default function BranchMap({
	branches,
	selected,
	onSelect,
	userLocation,
}: {
	branches: NormalizedBranch[];
	selected: NormalizedBranch | null;
	onSelect: (b: NormalizedBranch) => void;
	userLocation: { lat: number; lon: number } | null;
}) {
	return (
		<BranchMapInner
			branches={branches}
			selected={selected}
			onSelect={onSelect}
			userLocation={userLocation}
		/>
	);
}
