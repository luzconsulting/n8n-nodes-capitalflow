import { ApplicationError, IDataObject, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import {
	cashflowBatchCreate,
	cashflowCreate,
	cashflowDelete,
	cashflowGet,
	cashflowList,
	cashflowListAndGetFields,
	cashflowUpdate,
} from "../../helpers/cashflowCrud";
import { cleanBody, PAYMENT_CYCLE_OPTIONS } from "../../helpers/fields";

const RESOURCE = "cashflowHedge";

const HEDGE_TYPE_OPTIONS = [
	{ name: "Accident Insurance", value: "accident_insurance" },
	{ name: "Car Insurance", value: "car_insurance" },
	{ name: "Deferred Health Insurance", value: "deferred_health_insurance" },
	{ name: "Dental Supplementary Insurance", value: "dental_supplementary_insurance" },
	{ name: "Household Contents Insurance", value: "household_contents_insurance" },
	{ name: "Income Protection Insurance", value: "income_protection_insurance" },
	{ name: "Legal Protection Insurance", value: "legal_protection_insurance" },
	{ name: "Liability Insurance", value: "liability_insurance" },
	{ name: "Nursing Care Insurance", value: "nursing_care_insurance" },
	{ name: "Optional Health Services", value: "optional_health_services" },
	{ name: "Other", value: "other" },
	{ name: "Private Health Insurance", value: "private_health_insurance" },
	{ name: "Residential Building Insurance", value: "residential_building_insurance" },
	{ name: "Term Life Insurance", value: "term_life_insurance" },
	{ name: "Travel Health Insurance", value: "travel_health_insurance" },
];

export const cashflowHedgeOperations: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		displayOptions: { show: { resource: [RESOURCE] } },
		options: [
			{
				name: "Batch Create",
				value: "batchCreate",
				description: "Create multiple hedge entries in one transactional request",
				action: "Batch create hedge entries",
			},
			{
				name: "Create",
				value: "create",
				description: "Create a single plain hedge entry",
				action: "Create a hedge entry",
			},
			{
				name: "Delete",
				value: "delete",
				description: "Delete a hedge entry",
				action: "Delete a hedge entry",
			},
			{
				name: "Get",
				value: "get",
				description: "Get a single hedge entry by ID",
				action: "Get a hedge entry",
			},
			{
				name: "List",
				value: "list",
				description: "List hedge entries of a customer's active cashflow",
				action: "List hedge entries",
			},
			{
				name: "Update",
				value: "update",
				description: "Update a hedge entry",
				action: "Update a hedge entry",
			},
		],
		default: "list",
	},
];

const itemFields: INodeProperties[] = [
	{ displayName: "Description", name: "description", type: "string", default: "" },
	{
		displayName: "Hedge Type",
		name: "hedge_type",
		type: "options",
		options: HEDGE_TYPE_OPTIONS,
		default: "liability_insurance",
	},
	{ displayName: "Corporation", name: "corporation", type: "string", default: "" },
	{ displayName: "Value", name: "value", type: "number", default: 0 },
	{
		displayName: "Payment Cycle",
		name: "payment_cycle",
		type: "options",
		options: PAYMENT_CYCLE_OPTIONS,
		default: "monthly",
	},
	{ displayName: "Notes", name: "notes", type: "string", default: "" },
];

export const cashflowHedgeFields: INodeProperties[] = [
	...cashflowListAndGetFields(RESOURCE),

	// ===== CREATE =====
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: {
			show: { resource: [RESOURCE], operation: ["create", "batchCreate"] },
		},
		description:
			'Customer whose active cashflow to add the entry to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "Description",
		name: "description",
		type: "string",
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["create"] } },
	},
	{
		displayName: "Additional Fields",
		name: "additionalFields",
		type: "collection",
		placeholder: "Add Field",
		default: {},
		displayOptions: {
			show: { resource: [RESOURCE], operation: ["create", "update"] },
		},
		options: [
			{
				displayName: "Corporation",
				name: "corporation",
				type: "string",
				default: "",
			},
			{
				displayName: "Description",
				name: "description",
				type: "string",
				default: "",
				displayOptions: { show: { "/operation": ["update"] } },
			},
			{
				displayName: "Hedge Type",
				name: "hedge_type",
				type: "options",
				options: HEDGE_TYPE_OPTIONS,
				default: "liability_insurance",
			},
			{ displayName: "Notes", name: "notes", type: "string", default: "" },
			{
				displayName: "Payment Cycle",
				name: "payment_cycle",
				type: "options",
				options: PAYMENT_CYCLE_OPTIONS,
				default: "monthly",
			},
			{ displayName: "Value", name: "value", type: "number", default: 0 },
		],
	},

	// ===== BATCH CREATE =====
	{
		displayName: "Items",
		name: "items",
		type: "fixedCollection",
		placeholder: "Add Item",
		default: {},
		required: true,
		typeOptions: { multipleValues: true },
		displayOptions: { show: { resource: [RESOURCE], operation: ["batchCreate"] } },
		options: [
			{
				displayName: "Item",
				name: "item",
				values: itemFields,
			},
		],
	},
];

export async function handleCashflowHedge(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "list":
			return cashflowList(this, i, "hedges");

		case "get":
			return cashflowGet(this, i, "hedges");

		case "delete":
			return cashflowDelete(this, i, "hedges");

		case "create": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const description = this.getNodeParameter("description", i) as string;
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;

			const body = cleanBody({
				customer_id: customerId,
				description,
				...additionalFields,
			});
			return cashflowCreate(this, "hedges", body);
		}

		case "update": {
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;
			const body = cleanBody(additionalFields);
			return cashflowUpdate(this, i, "hedges", body);
		}

		case "batchCreate": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const itemsParam = this.getNodeParameter("items", i, {}) as IDataObject;
			const rows = ((itemsParam.item as IDataObject[]) ?? []).map((row) =>
				cleanBody(row),
			);

			if (!rows.length) {
				throw new ApplicationError(
					"At least one item is required for a batch create.",
				);
			}

			const body = { customer_id: customerId, items: rows };
			return cashflowBatchCreate(this, "hedges", body);
		}

		default:
			throw new ApplicationError(
				`Unsupported cashflow hedge operation: ${operation}`,
			);
	}
}
