import { ApplicationError, IDataObject, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";
import { cleanBody, toDateOnly } from "../../helpers/fields";
import {
	ASSET_CONTRACT_TYPE_OPTIONS,
	CONTRACT_CATEGORY_OPTIONS,
	CONTRACT_FIELD_GROUPS,
	HEDGE_CONTRACT_TYPE_OPTIONS,
} from "./contractTypes";

const RESOURCE = "contract";
const CREATE_UPDATE = ["create", "update"];

// Field keys whose values are date(-time) pickers that the API expects as plain date strings.
const DATE_LIKE_KEY = /(_date$|_until$|_from$)/;

export const contractOperations: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		displayOptions: { show: { resource: [RESOURCE] } },
		options: [
			{
				name: "Create",
				value: "create",
				description: "Create a contract",
				action: "Create a contract",
			},
			{
				name: "Delete",
				value: "delete",
				description: "Delete a contract and its contract details",
				action: "Delete a contract",
			},
			{
				name: "Get",
				value: "get",
				description: "Get a single contract by ID",
				action: "Get a contract",
			},
			{
				name: "List",
				value: "list",
				description: "List contracts of a given type",
				action: "List contracts",
			},
			{
				name: "Update",
				value: "update",
				description: "Update a contract (partial)",
				action: "Update a contract",
			},
		],
		default: "list",
	},
];

export const contractFields: INodeProperties[] = [
	// ===== Category + Type (path params) - needed by every operation =====
	{
		displayName: "Category",
		name: "contractCategory",
		type: "options",
		options: CONTRACT_CATEGORY_OPTIONS,
		default: "asset",
		required: true,
		noDataExpression: true,
		description:
			"Disambiguates contract types whose names overlap between asset and hedge (e.g. Other)",
		displayOptions: { show: { resource: [RESOURCE] } },
	},
	{
		displayName: "Contract Type",
		name: "assetContractType",
		type: "options",
		options: ASSET_CONTRACT_TYPE_OPTIONS,
		default: "checking_account",
		required: true,
		noDataExpression: true,
		description: "Picks the request body schema for this contract",
		displayOptions: { show: { resource: [RESOURCE], contractCategory: ["asset"] } },
	},
	{
		displayName: "Contract Type",
		name: "hedgeContractType",
		type: "options",
		options: HEDGE_CONTRACT_TYPE_OPTIONS,
		default: "liability_insurance",
		required: true,
		noDataExpression: true,
		description: "Picks the request body schema for this contract",
		displayOptions: { show: { resource: [RESOURCE], contractCategory: ["hedge"] } },
	},

	// ===== LIST =====
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["list"] } },
		description:
			'Customer whose active cashflow to list contracts from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "Page",
		name: "page",
		type: "number",
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: [RESOURCE], operation: ["list"] } },
	},
	{
		displayName: "Limit",
		name: "limit",
		type: "number",
		default: 50,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: "Max number of results to return",
		displayOptions: { show: { resource: [RESOURCE], operation: ["list"] } },
	},

	// ===== GET / UPDATE / DELETE =====
	{
		displayName: "Contract ID",
		name: "contractId",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: { resource: [RESOURCE], operation: ["get", "update", "delete"] },
		},
	},

	// ===== CREATE: required top fields =====
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["create"] } },
		description:
			'Customer to attach the contract to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "Description",
		name: "description",
		type: "string",
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["create"] } },
	},

	// ===== CREATE + UPDATE: reassign customer on update =====
	{
		displayName: "Customer ID",
		name: "reassignCustomerId",
		type: "string",
		default: "",
		description: "Reassign the contract to a different customer",
		displayOptions: { show: { resource: [RESOURCE], operation: ["update"] } },
	},

	// ===== CREATE + UPDATE: one field group per (category, type) combination =====
	...CONTRACT_FIELD_GROUPS.map((group) => ({
		displayName: `${
			(group.category === "asset" ? ASSET_CONTRACT_TYPE_OPTIONS : HEDGE_CONTRACT_TYPE_OPTIONS).find(
				(o) => o.value === group.type,
			)?.name ?? group.type
		} Fields`,
		name: group.paramName,
		type: "collection" as const,
		placeholder: "Add Field",
		default: {},
		displayOptions: {
			show: {
				resource: [RESOURCE],
				operation: CREATE_UPDATE,
				contractCategory: [group.category],
				...(group.category === "asset"
					? { assetContractType: [group.type] }
					: { hedgeContractType: [group.type] }),
			},
		},
		options: group.fields,
	})),
];

function collectContractBody(ctx: IExecuteFunctions, i: number, paramName: string): IDataObject {
	const raw = ctx.getNodeParameter(paramName, i, {}) as IDataObject;
	const converted: IDataObject = {};
	for (const [key, value] of Object.entries(raw)) {
		converted[key] = DATE_LIKE_KEY.test(key) ? toDateOnly(value) : value;
	}
	return cleanBody(converted);
}

function getContractTypeAndParam(ctx: IExecuteFunctions, i: number) {
	const category = ctx.getNodeParameter("contractCategory", i) as "asset" | "hedge";
	const type = ctx.getNodeParameter(
		category === "asset" ? "assetContractType" : "hedgeContractType",
		i,
	) as string;
	const group = CONTRACT_FIELD_GROUPS.find((g) => g.category === category && g.type === type);
	if (!group) {
		throw new ApplicationError(`Unsupported contract category/type: ${category}/${type}`);
	}
	return { category, type, paramName: group.paramName };
}

export async function handleContract(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	const { category, type, paramName } = getContractTypeAndParam(this, i);

	switch (operation) {
		case "list": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const page = this.getNodeParameter("page", i, 1) as number;
			const limit = this.getNodeParameter("limit", i, 50) as number;

			return cfRequest(this, "GET", `/v1/contract-details/${category}/${type}`, {
				qs: { customer_id: customerId, page, limit },
			});
		}

		case "get": {
			const contractId = this.getNodeParameter("contractId", i) as string;
			if (!contractId) throw new ApplicationError("Contract ID is required.");
			return cfRequest(
				this,
				"GET",
				`/v1/contract-details/${category}/${type}/${contractId}`,
			);
		}

		case "delete": {
			const contractId = this.getNodeParameter("contractId", i) as string;
			if (!contractId) throw new ApplicationError("Contract ID is required.");
			return cfRequest(
				this,
				"DELETE",
				`/v1/contract-details/${category}/${type}/${contractId}`,
			);
		}

		case "create": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const description = this.getNodeParameter("description", i) as string;
			const body = cleanBody({
				customer_id: customerId,
				description,
				...collectContractBody(this, i, paramName),
			});

			return cfRequest(this, "POST", `/v1/contract-details/${category}/${type}`, {
				body,
			});
		}

		case "update": {
			const contractId = this.getNodeParameter("contractId", i) as string;
			if (!contractId) throw new ApplicationError("Contract ID is required.");
			const reassignCustomerId = this.getNodeParameter("reassignCustomerId", i, "") as string;

			const body = cleanBody({
				customer_id: reassignCustomerId,
				...collectContractBody(this, i, paramName),
			});

			return cfRequest(
				this,
				"PUT",
				`/v1/contract-details/${category}/${type}/${contractId}`,
				{ body },
			);
		}

		default:
			throw new ApplicationError(`Unsupported contract operation: ${operation}`);
	}
}
