import { ApplicationError, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";

const RESOURCE = "household";

export const householdOperations: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		displayOptions: { show: { resource: [RESOURCE] } },
		options: [
			{
				name: "Get by Customer",
				value: "getByCustomer",
				description: "Get the household record (with members) a customer belongs to",
				action: "Get a household by customer",
			},
		],
		default: "getByCustomer",
	},
];

export const householdFields: INodeProperties[] = [
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["getByCustomer"] } },
		description:
			'Customer whose household to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
];

export async function handleHousehold(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "getByCustomer": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			if (!customerId) {
				throw new ApplicationError("Customer is required.");
			}
			return cfRequest(this, "GET", `/v1/households/customer/${customerId}`);
		}

		default:
			throw new ApplicationError(`Unsupported household operation: ${operation}`);
	}
}
