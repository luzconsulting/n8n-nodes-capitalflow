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

const RESOURCE = "cashflowIncome";

export const cashflowIncomeOperations: INodeProperties[] = [
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
				description: "Create multiple income entries in one transactional request",
				action: "Batch create income entries",
			},
			{
				name: "Create",
				value: "create",
				description: "Create a single income entry",
				action: "Create an income entry",
			},
			{
				name: "Delete",
				value: "delete",
				description: "Delete an income entry",
				action: "Delete an income entry",
			},
			{
				name: "Get",
				value: "get",
				description: "Get a single income entry by ID",
				action: "Get an income entry",
			},
			{
				name: "List",
				value: "list",
				description: "List income entries of a customer's active cashflow",
				action: "List income entries",
			},
			{
				name: "Update",
				value: "update",
				description: "Update an income entry",
				action: "Update an income entry",
			},
		],
		default: "list",
	},
];

const itemFields: INodeProperties[] = [
	{ displayName: "Description", name: "description", type: "string", default: "" },
	{ displayName: "Net Value", name: "net_value", type: "number", default: 0 },
	{ displayName: "Gross Value", name: "gross_value", type: "number", default: 0 },
	{
		displayName: "Payment Cycle",
		name: "payment_cycle",
		type: "options",
		options: PAYMENT_CYCLE_OPTIONS,
		default: "monthly",
	},
];

export const cashflowIncomeFields: INodeProperties[] = [
	...cashflowListAndGetFields(RESOURCE),

	// ===== CREATE =====
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["create", "batchCreate"] } },
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
		displayOptions: { show: { resource: [RESOURCE], operation: ["create", "update"] } },
		options: [
			{ displayName: "Net Value", name: "net_value", type: "number", default: 0 },
			{ displayName: "Gross Value", name: "gross_value", type: "number", default: 0 },
			{
				displayName: "Payment Cycle",
				name: "payment_cycle",
				type: "options",
				options: PAYMENT_CYCLE_OPTIONS,
				default: "monthly",
			},
			{
				displayName: "Description",
				name: "description",
				type: "string",
				default: "",
				displayOptions: { show: { "/operation": ["update"] } },
			},
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

export async function handleCashflowIncome(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "list":
			return cashflowList(this, i, "income");

		case "get":
			return cashflowGet(this, i, "income");

		case "delete":
			return cashflowDelete(this, i, "income");

		case "create": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const description = this.getNodeParameter("description", i) as string;
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;

			const body = cleanBody({ customer_id: customerId, description, ...additionalFields });
			return cashflowCreate(this, "income", body);
		}

		case "update": {
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;
			const body = cleanBody(additionalFields);
			return cashflowUpdate(this, i, "income", body);
		}

		case "batchCreate": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const itemsParam = this.getNodeParameter("items", i, {}) as IDataObject;
			const rows = ((itemsParam.item as IDataObject[]) ?? []).map((row) =>
				cleanBody(row),
			);

			if (!rows.length) {
				throw new ApplicationError("At least one item is required for a batch create.");
			}

			const body = { customer_id: customerId, items: rows };
			return cashflowBatchCreate(this, "income", body);
		}

		default:
			throw new ApplicationError(
				`Unsupported cashflow income operation: ${operation}`,
			);
	}
}
