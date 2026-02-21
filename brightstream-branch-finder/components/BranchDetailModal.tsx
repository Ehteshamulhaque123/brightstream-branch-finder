"use client";

import type { NormalizedBranch } from "../lib/normalize";
import { directionsUrl } from "../lib/directions";

export default function BranchDetailModal({
	open,
	onClose,
	branch,
}: {
	open: boolean;
	onClose: () => void;
	branch: NormalizedBranch | null;
}) {
	if (!open || !branch) return null;

	const dir = directionsUrl({
		name: branch.name,
		addressText: branch.addressText,
		location: branch.location ?? null,
	});

	return (
		<div
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,.45)",
				zIndex: 100,
				display: "grid",
				placeItems: "center",
				padding: 16,
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					width: "min(720px, 100%)",
					background: "#fff",
					borderRadius: 20,
					border: "1px solid rgba(0,0,0,.10)",
					boxShadow: "0 20px 60px rgba(0,0,0,.25)",
					padding: 18,
				}}
			>
				<div className="bs-split">
					<div>
						<div style={{ fontFamily: "var(--bs-serif)", fontSize: 24, fontWeight: 800 }}>
							{branch.name}
						</div>
						<div className="bs-muted" style={{ marginTop: 6 }}>
							{branch.addressText ?? "Address not available"}
						</div>
					</div>

					<button className="bs-btn bs-btn--primary" onClick={onClose}>
						Close
					</button>
				</div>

				{/* Detail grid */}
				<div className="bs-modal__body">

					{/* Contact & Location section: show all API fields */}
					<div className="bs-detail-grid">
						{branch.phone && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">📞</span>
								<div>
									<div className="bs-detail-item__label">Phone</div>
									<div className="bs-detail-item__value">
										<a href={`tel:${branch.phone}`} style={{color: 'inherit', textDecoration: 'none'}}>
											{branch.phone}
										</a>
									</div>
								</div>
							</div>
						)}
						{branch.email && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">✉️</span>
								<div>
									<div className="bs-detail-item__label">Email</div>
									<div className="bs-detail-item__value">
										<a href={`mailto:${branch.email}`} style={{color: 'inherit', textDecoration: 'none', wordBreak: 'break-all'}}>
											{branch.email}
										</a>
									</div>
								</div>
							</div>
						)}
						{branch.street && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🏠</span>
								<div>
									<div className="bs-detail-item__label">Street</div>
									<div className="bs-detail-item__value">{branch.street}</div>
								</div>
							</div>
						)}
						{branch.city && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🏙️</span>
								<div>
									<div className="bs-detail-item__label">City</div>
									<div className="bs-detail-item__value">{branch.city}</div>
								</div>
							</div>
						)}
						{branch.country && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🌍</span>
								<div>
									<div className="bs-detail-item__label">Country</div>
									<div className="bs-detail-item__value">{branch.country}</div>
								</div>
							</div>
						)}
						{branch.countryCode && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🌐</span>
								<div>
									<div className="bs-detail-item__label">Country Code</div>
									<div className="bs-detail-item__value">{branch.countryCode}</div>
								</div>
							</div>
						)}
						{branch.zipCode && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🏷️</span>
								<div>
									<div className="bs-detail-item__label">Zip Code</div>
									<div className="bs-detail-item__value">{branch.zipCode}</div>
								</div>
							</div>
						)}
						{/* legacy/extra fields */}
						{branch.region && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🗺️</span>
								<div>
									<div className="bs-detail-item__label">Region</div>
									<div className="bs-detail-item__value">{branch.region}</div>
								</div>
							</div>
						)}
						{branch.postal && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🏷️</span>
								<div>
									<div className="bs-detail-item__label">Postal / Zip</div>
									<div className="bs-detail-item__value">{branch.postal}</div>
								</div>
							</div>
						)}
						{branch.branchType && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🏢</span>
								<div>
									<div className="bs-detail-item__label">Branch Type</div>
									<div className="bs-detail-item__value">{branch.branchType}</div>
								</div>
							</div>
						)}

						{branch.isActive != null && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">{branch.isActive ? "✅" : "⛔"}</span>
								<div>
									<div className="bs-detail-item__label">Status</div>
									<div className="bs-detail-item__value">{branch.isActive ? "Active" : "Inactive"}</div>
								</div>
							</div>
						)}

						{branch.openingHours && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🕐</span>
								<div>
									<div className="bs-detail-item__label">Opening Hours</div>
									<div className="bs-detail-item__value">{branch.openingHours}</div>
								</div>
							</div>
						)}

						{branch.services && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">🛠️</span>
								<div>
									<div className="bs-detail-item__label">Services</div>
									<div className="bs-detail-item__value">{branch.services}</div>
								</div>
							</div>
						)}

						{branch.distanceKm != null && Number.isFinite(branch.distanceKm) && (
							<div className="bs-detail-item">
								<span className="bs-detail-item__icon">📏</span>
								<div>
									<div className="bs-detail-item__label">Distance</div>
									<div className="bs-detail-item__value">{branch.distanceKm.toFixed(1)} km away</div>
								</div>
							</div>
						)}
					</div>

					{/* Services */}
					{branch.services?.length ? (
						<div className="bs-modal__section">
							<div className="bs-modal__section-title">Services</div>
							<div className="bs-card__chips">
								{branch.services.map((s: string) => (
									<span key={s} className="bs-chip">{s}</span>
								))}
							</div>
						</div>
					) : null}

					{/* Directions CTA */}
					<div style={{ marginTop: 16 }}>
						<a className="bs-btn bs-btn--primary" href={dir} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
							🧭 Get Directions
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
