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

const RESOURCE = "cashflowExpenditure";

const IMPORTANCE_OPTIONS = [
	{ name: "Important", value: "important" },
	{ name: "Non-Important", value: "non_important" },
];

export const cashflowExpenditureOperations: INodeProperties[] = [
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
				description:
					"Create multiple expenditure entries in one transactional request",
				action: "Batch create expenditure entries",
			},
			{
				name: "Create",
				value: "create",
				description: "Create a single expenditure entry",
				action: "Create an expenditure entry",
			},
			{
				name: "Delete",
				value: "delete",
				description: "Delete an expenditure entry",
				action: "Delete an expenditure entry",
			},
			{
				name: "Get",
				value: "get",
				description: "Get a single expenditure entry by ID",
				action: "Get an expenditure entry",
			},
			{
				name: "List",
				value: "list",
				description: "List expenditure entries of a customer's active cashflow",
				action: "List expenditure entries",
			},
			{
				name: "Update",
				value: "update",
				description: "Update an expenditure entry",
				action: "Update an expenditure entry",
			},
		],
		default: "list",
	},
];

const itemFields: INodeProperties[] = [
	{ displayName: "Description", name: "description", type: "string", default: "" },
	{
		displayName: "Individual Payment",
		name: "individual_payment",
		type: "number",
		default: 0,
	},
	{
		displayName: "Payment Cycle",
		name: "payment_cycle",
		type: "options",
		options: PAYMENT_CYCLE_OPTIONS,
		default: "monthly",
	},
	{
		displayName: "Importance",
		name: "importance",
		type: "options",
		options: IMPORTANCE_OPTIONS,
		default: "important",
	},
];

export const cashflowExpenditureFields: INodeProperties[] = [
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
				displayName: "Individual Payment",
				name: "individual_payment",
				type: "number",
				default: 0,
			},
			{
				displayName: "Payment Cycle",
				name: "payment_cycle",
				type: "options",
				options: PAYMENT_CYCLE_OPTIONS,
				default: "monthly",
			},
			{
				displayName: "Importance",
				name: "importance",
				type: "options",
				options: IMPORTANCE_OPTIONS,
				default: "important",
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

export async function handleCashflowExpenditure(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "list":
			return cashflowList(this, i, "expenditure");

		case "get":
			return cashflowGet(this, i, "expenditure");

		case "delete":
			return cashflowDelete(this, i, "expenditure");

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
			return cashflowCreate(this, "expenditure", body);
		}

		case "update": {
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;
			const body = cleanBody(additionalFields);
			return cashflowUpdate(this, i, "expenditure", body);
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
			return cashflowBatchCreate(this, "expenditure", body);
		}

		default:
			throw new ApplicationError(
				`Unsupported cashflow expenditure operation: ${operation}`,
			);
	}
}
