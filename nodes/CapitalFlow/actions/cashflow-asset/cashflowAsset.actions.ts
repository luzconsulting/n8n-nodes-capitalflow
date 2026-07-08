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
import { cleanBody, DURATION_OPTIONS } from "../../helpers/fields";

const RESOURCE = "cashflowAsset";

const ASSET_TYPE_OPTIONS = [
	{ name: "Building Savings Contract", value: "building_savings_contract" },
	{ name: "Call Money Account", value: "call_money_account" },
	{ name: "Checking Account", value: "checking_account" },
	{ name: "Employer Pension Scheme", value: "employer_pension_scheme" },
	{ name: "Investment Account", value: "investment_account" },
	{ name: "Other", value: "other" },
	{ name: "Private Pension", value: "private_pension" },
	{ name: "Property", value: "property" },
	{ name: "Riester", value: "riester" },
	{ name: "Ruerup", value: "ruerup" },
	{ name: "Savings Book", value: "savings_book" },
];

export const cashflowAssetOperations: INodeProperties[] = [
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
				description: "Create multiple asset entries in one transactional request",
				action: "Batch create asset entries",
			},
			{
				name: "Create",
				value: "create",
				description: "Create a single plain asset entry",
				action: "Create an asset entry",
			},
			{
				name: "Delete",
				value: "delete",
				description: "Delete an asset entry",
				action: "Delete an asset entry",
			},
			{
				name: "Get",
				value: "get",
				description: "Get a single asset entry by ID",
				action: "Get an asset entry",
			},
			{
				name: "List",
				value: "list",
				description: "List asset entries of a customer's active cashflow",
				action: "List asset entries",
			},
			{
				name: "Update",
				value: "update",
				description: "Update an asset entry",
				action: "Update an asset entry",
			},
		],
		default: "list",
	},
];

const itemFields: INodeProperties[] = [
	{ displayName: "Description", name: "description", type: "string", default: "" },
	{
		displayName: "Asset Type",
		name: "asset_type",
		type: "options",
		options: ASSET_TYPE_OPTIONS,
		default: "checking_account",
	},
	{ displayName: "Corporation", name: "corporation", type: "string", default: "" },
	{
		displayName: "Monthly Payment",
		name: "monthly_payment",
		type: "number",
		default: 0,
	},
	{ displayName: "Value", name: "value", type: "number", default: 0 },
	{
		displayName: "Duration",
		name: "duration",
		type: "options",
		options: DURATION_OPTIONS,
		default: "middle",
	},
	{ displayName: "Notes", name: "notes", type: "string", default: "" },
];

export const cashflowAssetFields: INodeProperties[] = [
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
				displayName: "Asset Type",
				name: "asset_type",
				type: "options",
				options: ASSET_TYPE_OPTIONS,
				default: "checking_account",
			},
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
				displayName: "Duration",
				name: "duration",
				type: "options",
				options: DURATION_OPTIONS,
				default: "middle",
			},
			{
				displayName: "Monthly Payment",
				name: "monthly_payment",
				type: "number",
				default: 0,
			},
			{ displayName: "Notes", name: "notes", type: "string", default: "" },
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

export async function handleCashflowAsset(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "list":
			return cashflowList(this, i, "assets");

		case "get":
			return cashflowGet(this, i, "assets");

		case "delete":
			return cashflowDelete(this, i, "assets");

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
			return cashflowCreate(this, "assets", body);
		}

		case "update": {
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;
			const body = cleanBody(additionalFields);
			return cashflowUpdate(this, i, "assets", body);
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
			return cashflowBatchCreate(this, "assets", body);
		}

		default:
			throw new ApplicationError(
				`Unsupported cashflow asset operation: ${operation}`,
			);
	}
}
