import { ApplicationError, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";

const RESOURCE = "form";

export const formOperations: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		displayOptions: { show: { resource: [RESOURCE] } },
		options: [
			{
				name: "Share Cashflow Form",
				value: "shareCashflowForm",
				description:
					"Generate a shareable link and password for the cashflow analysis data collection form",
				action: "Share a cashflow form",
			},
			{
				name: "Share Customer Form",
				value: "shareCustomerForm",
				description:
					"Generate a shareable link and password for the customer data collection form",
				action: "Share a customer form",
			},
		],
		default: "shareCustomerForm",
	},
];

export const formFields: INodeProperties[] = [
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: {
			show: {
				resource: [RESOURCE],
				operation: ["shareCustomerForm", "shareCashflowForm"],
			},
		},
		description:
			'Customer to generate the share link for. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "No Email Is Sent Automatically — Use the Returned URL and Password to Implement Your Own Delivery Logic.",
		name: "shareFormNotice",
		type: "notice",
		default: "",
		displayOptions: {
			show: {
				resource: [RESOURCE],
				operation: ["shareCustomerForm", "shareCashflowForm"],
			},
		},
	},
];

export async function handleForm(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	const customerId = this.getNodeParameter("customerId", i) as string;
	if (!customerId) {
		throw new ApplicationError("Customer is required.");
	}

	switch (operation) {
		case "shareCustomerForm":
			return cfRequest(
				this,
				"PUT",
				`/v1/forms/customer/${customerId}/share-form`,
			);

		case "shareCashflowForm":
			return cfRequest(
				this,
				"PUT",
				`/v1/forms/cashflow/customer/${customerId}/share-form`,
			);

		default:
			throw new ApplicationError(`Unsupported form operation: ${operation}`);
	}
}
