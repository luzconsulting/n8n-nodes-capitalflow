import type { INodeProperties } from "n8n-workflow";

export const resourceSelector: INodeProperties = {
	displayName: "Resource",
	name: "resource",
	type: "options",
	noDataExpression: true,
	options: [
		{
			name: "Cashflow Asset",
			value: "cashflowAsset",
			description: "Create, list, get, update, and delete asset entries on a cashflow",
		},
		{
			name: "Cashflow Expenditure",
			value: "cashflowExpenditure",
			description:
				"Create, list, get, update, and delete expenditure entries on a cashflow",
		},
		{
			name: "Cashflow Hedge",
			value: "cashflowHedge",
			description: "Create, list, get, update, and delete hedge entries on a cashflow",
		},
		{
			name: "Cashflow Income",
			value: "cashflowIncome",
			description: "Create, list, get, update, and delete income entries on a cashflow",
		},
		{
			name: "Contract",
			value: "contract",
			description:
				"Create, list, get, update, and delete contract details for any of the 25 contract types",
		},
		{
			name: "Customer",
			value: "customer",
			description: "Search, get, create, and update customers",
		},
		{
			name: "Form",
			value: "form",
			description: "Generate shareable customer and cashflow data collection forms",
		},
		{
			name: "Household",
			value: "household",
			description: "Get the household (with members) a customer belongs to",
		},
		{
			name: "Organization",
			value: "organization",
			description: "List members of your organization",
		},
	],
	default: "customer",
};
