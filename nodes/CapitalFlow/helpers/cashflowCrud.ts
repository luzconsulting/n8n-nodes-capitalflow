import { ApplicationError, IDataObject, IExecuteFunctions } from "n8n-workflow";

import { cfRequest } from "./apiclient";

export type CashflowSegment = "income" | "expenditure" | "assets" | "hedges";

export async function cashflowList(
	ctx: IExecuteFunctions,
	i: number,
	segment: CashflowSegment,
): Promise<unknown> {
	const customerId = ctx.getNodeParameter("customerId", i) as string;
	const page = ctx.getNodeParameter("page", i, 1) as number;
	const limit = ctx.getNodeParameter("limit", i, 50) as number;

	if (!customerId) {
		throw new ApplicationError("Customer is required.");
	}

	return cfRequest(ctx, "GET", `/v1/cashflow/${segment}`, {
		qs: { customer_id: customerId, page, limit },
	});
}

export async function cashflowGet(
	ctx: IExecuteFunctions,
	i: number,
	segment: CashflowSegment,
): Promise<unknown> {
	const id = ctx.getNodeParameter("entryId", i) as string;
	if (!id) {
		throw new ApplicationError("Entry ID is required.");
	}
	return cfRequest(ctx, "GET", `/v1/cashflow/${segment}/${id}`);
}

export async function cashflowDelete(
	ctx: IExecuteFunctions,
	i: number,
	segment: CashflowSegment,
): Promise<unknown> {
	const id = ctx.getNodeParameter("entryId", i) as string;
	if (!id) {
		throw new ApplicationError("Entry ID is required.");
	}
	return cfRequest(ctx, "DELETE", `/v1/cashflow/${segment}/${id}`);
}

export async function cashflowCreate(
	ctx: IExecuteFunctions,
	segment: CashflowSegment,
	body: IDataObject,
): Promise<unknown> {
	return cfRequest(ctx, "POST", `/v1/cashflow/${segment}`, { body });
}

export async function cashflowBatchCreate(
	ctx: IExecuteFunctions,
	segment: CashflowSegment,
	body: IDataObject,
): Promise<unknown> {
	return cfRequest(ctx, "POST", `/v1/cashflow/${segment}/batch`, { body });
}

export async function cashflowUpdate(
	ctx: IExecuteFunctions,
	i: number,
	segment: CashflowSegment,
	body: IDataObject,
): Promise<unknown> {
	const id = ctx.getNodeParameter("entryId", i) as string;
	if (!id) {
		throw new ApplicationError("Entry ID is required.");
	}
	return cfRequest(ctx, "PUT", `/v1/cashflow/${segment}/${id}`, { body });
}

export const cashflowListAndGetFields = (resource: string) => [
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options" as const,
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: { show: { resource: [resource], operation: ["list"] } },
		description:
			'Customer whose active cashflow to list from. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "Page",
		name: "page",
		type: "number" as const,
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: { show: { resource: [resource], operation: ["list"] } },
	},
	{
		displayName: "Limit",
		name: "limit",
		type: "number" as const,
		default: 50,
		typeOptions: { minValue: 1, maxValue: 200 },
		description: "Max number of results to return",
		displayOptions: { show: { resource: [resource], operation: ["list"] } },
	},
	{
		displayName: "Entry ID",
		name: "entryId",
		type: "string" as const,
		default: "",
		required: true,
		displayOptions: {
			show: { resource: [resource], operation: ["get", "update", "delete"] },
		},
	},
];
