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
				name: "List Members",
				value: "listMembers",
				description: "List members of your organization",
				action: "List organization members",
			},
		],
		default: "listMembers",
	},
];

export const organizationFields: INodeProperties[] = [];

export async function handleOrganization(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "listMembers":
			return cfRequest(this, "GET", "/v1/organizations/organization-members");

		default:
			throw new ApplicationError(`Unsupported organization operation: ${operation}`);
	}
}
