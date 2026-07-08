import { ILoadOptionsFunctions, INodePropertyOptions } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";

type CustomerSearchResult = {
	items?: Array<{
		id?: string;
		firstname?: string;
		lastname?: string;
		contact_info?: { email?: string };
	}>;
};

export async function getCustomers(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const data = await cfRequest<CustomerSearchResult>(
		this,
		"POST",
		"/v1/customers/search",
		{ body: { take: 100, skip: 0 } },
	);

	const customers = data?.items ?? [];
	if (!customers.length) {
		return [{ name: "No Customers Found", value: "" }];
	}

	return customers.map((customer) => {
		const name = `${customer.firstname ?? ""} ${customer.lastname ?? ""}`.trim();
		return {
			name: name || customer.id || "Unknown",
			value: String(customer.id ?? ""),
			description: customer.contact_info?.email
				? String(customer.contact_info.email)
				: undefined,
		};
	});
}
