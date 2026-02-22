"use client";

import { useEffect } from "react";
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
	// Prevent background scroll when modal is open and preserve scroll position
	useEffect(() => {
		if (open) {
			// Save current scroll position
			const scrollY = window.scrollY;
			document.body.style.top = `-${scrollY}px`;
			document.body.classList.add("modal-open");
		} else {
			// Restore scroll position
			const scrollY = document.body.style.top;
			document.body.classList.remove("modal-open");
			document.body.style.top = '';
			if (scrollY) {
				window.scrollTo(0, parseInt(scrollY || '0') * -1);
			}
		}
		return () => {
			const scrollY = document.body.style.top;
			document.body.classList.remove("modal-open");
			document.body.style.top = '';
			if (scrollY) {
				window.scrollTo(0, parseInt(scrollY || '0') * -1);
			}
		};
	}, [open]);

	if (!open || !branch) return null;

	const dir = directionsUrl({
		name: branch.name,
		addressText: branch.addressText,
		location: branch.location ?? null,
	});

	// Prevent scroll events on backdrop
	const preventScroll = (e: React.TouchEvent | React.WheelEvent) => {
		e.preventDefault();
	};

	return (
		<div
			onClick={onClose}
			onTouchMove={preventScroll}
			onWheel={preventScroll}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0,0,0,.45)",
				zIndex: 100,
				display: "grid",
				placeItems: "center",
				padding: 16,
				overscrollBehavior: "contain",
			}}
		>
			<div
				onClick={(e) => e.stopPropagation()}
				style={{
					width: "min(720px, 100%)",
					maxHeight: "90vh",
					overflowY: "auto",
					overscrollBehavior: "contain",
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
					<div className="bs-modal-directions-wrapper" style={{ marginTop: 16, width: '100%' }}>
						<a className="bs-btn bs-btn--primary" href={dir} target="_blank" rel="noreferrer">
							🧭 Get Directions
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
