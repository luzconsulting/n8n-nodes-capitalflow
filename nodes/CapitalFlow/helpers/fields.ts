import type { IDataObject } from "n8n-workflow";

export const GERMAN_STATE_OPTIONS = [
	{ name: "Bund (Federal)", value: "bund" },
	{ name: "Baden-Württemberg", value: "baden_wuerttemberg" },
	{ name: "Bayern", value: "bayern" },
	{ name: "Berlin", value: "berlin" },
	{ name: "Brandenburg", value: "brandenburg" },
	{ name: "Bremen", value: "bremen" },
	{ name: "Hamburg", value: "hamburg" },
	{ name: "Hessen", value: "hessen" },
	{ name: "Mecklenburg-Vorpommern", value: "mecklenburg_vorpommern" },
	{ name: "Niedersachsen", value: "niedersachsen" },
	{ name: "Nordrhein-Westfalen", value: "nordrhein_westfalen" },
	{ name: "Rheinland-Pfalz", value: "rheinland_pfalz" },
	{ name: "Saarland", value: "saarland" },
	{ name: "Sachsen", value: "sachsen" },
	{ name: "Sachsen-Anhalt", value: "sachsen_anhalt" },
	{ name: "Schleswig-Holstein", value: "schleswig_holstein" },
	{ name: "Thüringen", value: "thueringen" },
];

export const PAYMENT_CYCLE_OPTIONS = [
	{ name: "Weekly", value: "weekly" },
	{ name: "Bi-Weekly", value: "bi_weekly" },
	{ name: "Monthly", value: "monthly" },
	{ name: "Bi-Monthly", value: "bi_monthly" },
	{ name: "Quarterly", value: "quarterly" },
	{ name: "Half-Yearly", value: "half_yearly" },
	{ name: "Yearly", value: "yearly" },
];

export const DURATION_OPTIONS = [
	{ name: "Short", value: "short" },
	{ name: "Middle", value: "middle" },
	{ name: "Long", value: "long" },
];

/** Strips undefined/null/empty-string values from a shallow object. */
export function cleanBody(input: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [key, value] of Object.entries(input)) {
		if (value === undefined || value === null || value === "") continue;
		out[key] = value;
	}
	return out;
}

/** Converts an n8n dateTime picker value ("2024-01-01T00:00:00.000Z" or "2024-01-01") to a date-only string. */
export function toDateOnly(value: unknown): string | undefined {
	if (value === undefined || value === null || value === "") return undefined;
	const str = String(value);
	return str.split("T")[0];
}
