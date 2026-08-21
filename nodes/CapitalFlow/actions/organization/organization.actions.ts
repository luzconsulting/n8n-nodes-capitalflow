import { ApplicationError, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";

const RESOURCE = "organization";

export const organizationOperations: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		displayOptions: { show: { resource: [RESOURCE] } },
		options: [
			{
				name: "Assign Household",
				value: "assignHousehold",
				description: "Reassign a customer's household to another member of your organization",
				action: "Assign a household to an organization member",
			},
			{
				name: "List Members",
				value: "listMembers",
				description: "List members of your organization",
				action: "List organization members",
			},
		],
		default: "listMembers",
	},
];

export const organizationFields: INodeProperties[] = [
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["assignHousehold"] } },
		description:
			'Customer whose household to reassign. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "Assigned User ID",
		name: "assignedUserId",
		type: "string",
		default: "",
		required: true,
		displayOptions: { show: { resource: [RESOURCE], operation: ["assignHousehold"] } },
		description:
			"ID of the organization member to assign the household to. Must be a member of the same organization as the caller — use the List Members operation first to find the member's ID.",
	},
];

export async function handleOrganization(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "listMembers":
			return cfRequest(this, "GET", "/v1/organizations/organization-members");

		case "assignHousehold": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			if (!customerId) {
				throw new ApplicationError("Customer is required.");
			}
			const assignedUserId = this.getNodeParameter("assignedUserId", i) as string;
			return cfRequest(
				this,
				"POST",
				`/v1/organizations/delegations/household/customer/${customerId}`,
				{ body: { assigned_user_id: assignedUserId } },
			);
		}

		default:
			throw new ApplicationError(`Unsupported organization operation: ${operation}`);
	}
}
