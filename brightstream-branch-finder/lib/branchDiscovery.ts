import { graphQL } from "./graph";

type IntrospectionTypeRef = {
	kind: string;
	name?: string | null;
	ofType?: IntrospectionTypeRef | null;
};

type IntrospectionField = {
	name: string;
	type: IntrospectionTypeRef;
	args?: { name: string; type: IntrospectionTypeRef }[];
};

function unwrap(t: IntrospectionTypeRef): IntrospectionTypeRef {
	let cur: IntrospectionTypeRef = t;
	while (cur.ofType) cur = cur.ofType;
	return cur;
}

async function getQueryRootFields(): Promise<IntrospectionField[]> {
	const q = `
		query QueryRootIntrospection {
			__schema {
				queryType {
					fields {
						name
						args { name type { kind name ofType { kind name ofType { kind name } } } }
						type { kind name ofType { kind name ofType { kind name } } }
					}
				}
			}
		}
	`;
	const data = await graphQL<any>(q);
	return data.__schema.queryType.fields as IntrospectionField[];
}

async function getTypeFields(typeName: string): Promise<IntrospectionField[]> {
	const q = `
		query TypeFields($name: String!) {
			__type(name: $name) {
				fields {
					name
					args { name type { kind name ofType { kind name ofType { kind name } } } }
					type { kind name ofType { kind name ofType { kind name } } }
				}
			}
		}
	`;
	const data = await graphQL<any>(q, { name: typeName });
	return (data.__type?.fields ?? []) as IntrospectionField[];
}

function pickFirstExisting(fields: string[], candidates: string[]) {
	const set = new Set(fields.map((f) => f.toLowerCase()));
	return candidates.find((c) => set.has(c.toLowerCase())) ?? null;
}

function findGeoField(itemFields: IntrospectionField[]) {
	// Find object fields that have subfields like lat/lon or latitude/longitude
	// We'll return: { fieldName, latName, lonName, typeName }
	const objectFields = itemFields
		.map((f) => ({ f, unwrapped: unwrap(f.type) }))
		.filter((x) => x.unwrapped.kind === "OBJECT" && x.unwrapped.name);

	return objectFields;
}

export type BranchQueryPlan = {
	rootField: string;
	supportsPaging: boolean;
	limitArg?: string;
	skipArg?: string;
	// selected fields on item:
	nameField?: string | null;
	phoneField?: string | null;
	emailField?: string | null;
	address1Field?: string | null;
	address2Field?: string | null;
	cityField?: string | null;
	regionField?: string | null;
	postalField?: string | null;
	countryField?: string | null;
	countryCodeField?: string | null;
	coordinatesField?: string | null;
	servicesField?: string | null;
	openingHoursField?: string | null;
	branchTypeField?: string | null;
	isActiveField?: string | null;
	// geo
	geoField?: string | null;
	geoLat?: string | null;
	geoLon?: string | null;

	// final query string
	query: string;
};

export async function buildBranchQueryPlan(): Promise<BranchQueryPlan> {
	const rootFields = await getQueryRootFields();

	// Choose the best branch list root field:
	// 1) Contains "branch"
	// 2) Return type has `items`
	const branchCandidates = rootFields
		.filter((f) => f.name.toLowerCase().includes("branch"))
		.map((f) => ({ f, returnType: unwrap(f.type) }))
		.filter((x) => x.returnType.name);

	// Try to find one whose return type has `items`
	let chosen = branchCandidates[0]?.f?.name ?? "Branch";
	for (const c of branchCandidates) {
		const returnName = unwrap(c.f.type).name!;
		const fields = await getTypeFields(returnName);
		if (fields.some((x) => x.name === "items")) {
			chosen = c.f.name;
			break;
		}
	}

	// Inspect chosen return type fields (items/total)
	const chosenRootField = rootFields.find((f) => f.name === chosen);
	if (!chosenRootField) {
		// Fallback to common
		chosen = "Branch";
	}

	const chosenReturnTypeName = unwrap(chosenRootField?.type ?? { kind: "OBJECT", name: "BranchResult" }).name!;
	const chosenReturnFields = await getTypeFields(chosenReturnTypeName);

	const itemsField = chosenReturnFields.find((f) => f.name === "items");
	const itemsTypeName = itemsField ? unwrap(itemsField.type).name : null;

	const itemFields = itemsTypeName ? await getTypeFields(itemsTypeName) : [];
	const itemFieldNames = itemFields.map((f) => f.name);

	// Pick display fields (best-effort, auto)
	const nameField = pickFirstExisting(itemFieldNames, ["Name", "Title", "BranchName", "name", "title"]);
	const phoneField = pickFirstExisting(itemFieldNames, ["Phone", "PhoneNumber", "phone", "phoneNumber"]);
	const emailField = pickFirstExisting(itemFieldNames, ["Email", "EmailAddress", "email", "emailAddress"]);
	const address1Field = pickFirstExisting(itemFieldNames, ["AddressLine1", "Street", "StreetAddress", "addressLine1", "street"]);
	const address2Field = pickFirstExisting(itemFieldNames, ["AddressLine2", "Unit", "Suite", "addressLine2"]);
	const cityField = pickFirstExisting(itemFieldNames, ["City", "Town", "Suburb", "city", "town", "suburb"]);
	const regionField = pickFirstExisting(itemFieldNames, ["State", "Region", "Province", "state", "region", "province"]);
	// Prioritize ZipCode, remove Postcode
	const postalField = pickFirstExisting(itemFieldNames, ["ZipCode", "PostalCode", "Zip", "postalCode", "zip"]);
	const countryField = pickFirstExisting(itemFieldNames, ["Country", "country"]);
	const countryCodeField = pickFirstExisting(itemFieldNames, ["CountryCode", "countryCode"]);
	const coordinatesField = pickFirstExisting(itemFieldNames, ["Coordinates", "coordinates"]);

	// These fields appear in introspection (inherited from interfaces) but cannot
	// actually be queried on the Branch type — the API rejects them with 400.
	// We still attempt to discover them, but they'll be validated below before
	// being added to the query.
	const servicesField = pickFirstExisting(itemFieldNames, ["Services", "services"]);
	const openingHoursField = pickFirstExisting(itemFieldNames, ["OpeningHours", "openingHours", "Hours", "hours"]);
	const branchTypeField = pickFirstExisting(itemFieldNames, ["BranchType", "branchType", "Type", "type"]);
	const isActiveField = pickFirstExisting(itemFieldNames, ["IsActive", "isActive", "Active", "active"]);

	// Find geo object field (lat/lon)
	let geoField: string | null = null;
	let geoLat: string | null = null;
	let geoLon: string | null = null;

	const geoObjects = findGeoField(itemFields);
	for (const obj of geoObjects) {
		const subTypeName = obj.unwrapped.name!;
		const subFields = await getTypeFields(subTypeName);
		const subNames = subFields.map((x) => x.name);
		const lat = pickFirstExisting(subNames, ["lat", "latitude", "Lat", "Latitude"]);
		const lon = pickFirstExisting(subNames, ["lon", "lng", "longitude", "Lon", "Lng", "Longitude"]);
		if (lat && lon) {
			geoField = obj.f.name;
			geoLat = lat;
			geoLon = lon;
			break;
		}
	}

	// Paging args on root field (common: limit, skip)
	const args = chosenRootField?.args ?? [];
	const argNames = args.map((a) => a.name);
	const limitArg = pickFirstExisting(argNames, ["limit", "first"]);
	const skipArg = pickFirstExisting(argNames, ["skip", "after"]); // after might be cursor; we handle only skip in this template
	const supportsPaging = Boolean(limitArg && skipArg && limitArg === "limit" && skipArg === "skip");

	// Build item selection set — only include fields we've positively identified.
	// Introspection on this API returns inherited interface fields that can't
	// actually be queried, so we must NOT blindly include all introspected names.
	const safeScalars = new Set(
		[nameField, phoneField, emailField, address1Field, address2Field, cityField, regionField, postalField, countryField, countryCodeField, coordinatesField]
			.filter((f): f is string => f != null)
	);

	// NOTE: servicesField, openingHoursField, branchTypeField, isActiveField are
	// detected by introspection but rejected by the API at query time (inherited
	// interface fields). They are NOT added to the query selection set.

	// Also include any field starting with "_score" (common in search APIs)
	for (const fn of itemFieldNames) {
		if (fn === "_score" || fn === "_fulltext" || fn === "_ranking") safeScalars.add(fn);
	}

	const sel = Array.from(safeScalars);

	// Add geo field with its specific lat/lon subfields
	if (geoField && geoLat && geoLon) {
		safeScalars.delete(geoField); // don't duplicate
		sel.push(`${geoField} { ${geoLat} ${geoLon} }`);
	}

	// Ensure we always request something safe
	if (sel.length === 0) sel.push("__typename");

	const query = supportsPaging
		? `
			query Branches($limit: Int! = 100, $skip: Int! = 0) {
				${chosen}(limit: $limit, skip: $skip) {
					total
					items {
						${sel.join("\n")}
					}
				}
			}
		`
		: `
			query Branches {
				${chosen} {
					total
					items {
						${sel.join("\n")}
					}
				}
			}
		`;

	return {
		rootField: chosen,
		supportsPaging,
		limitArg: supportsPaging ? "limit" : undefined,
		skipArg: supportsPaging ? "skip" : undefined,
		nameField,
		phoneField,
		emailField,
		address1Field,
		address2Field,
		cityField,
		regionField,
		postalField,
		countryField,
		countryCodeField,
		coordinatesField,
		servicesField,
		openingHoursField,
		branchTypeField,
		isActiveField,
		geoField,
		geoLat,
		geoLon,
		query,
	};
}
