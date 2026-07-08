import { ApplicationError, IDataObject, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";
import { cleanBody, GERMAN_STATE_OPTIONS, toDateOnly } from "../../helpers/fields";

export const customerOperations: INodeProperties[] = [
	{
		displayName: "Operation",
		name: "operation",
		type: "options",
		noDataExpression: true,
		displayOptions: { show: { resource: ["customer"] } },
		options: [
			{
				name: "Create",
				value: "createCustomer",
				description: "Create a new customer",
				action: "Create a customer",
			},
			{
				name: "Get",
				value: "getCustomer",
				description: "Get a single customer with all related information by ID",
				action: "Get a customer",
			},
			{
				name: "Search",
				value: "searchCustomers",
				description: "Search customers by name, contact, or address fields",
				action: "Search customers",
			},
			{
				name: "Update",
				value: "updateCustomer",
				description: "Update an existing customer",
				action: "Update a customer",
			},
		],
		default: "searchCustomers",
	},
];

export const customerFields: INodeProperties[] = [
	// ===== GET =====
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: {
			show: { resource: ["customer"], operation: ["getCustomer"] },
		},
		description:
			'Customer to retrieve. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},

	// ===== CREATE =====
	{
		displayName: "Firstname",
		name: "firstname",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: { resource: ["customer"], operation: ["createCustomer"] },
		},
	},
	{
		displayName: "Lastname",
		name: "lastname",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: { resource: ["customer"], operation: ["createCustomer"] },
		},
	},

	// ===== UPDATE =====
	{
		displayName: "Customer Name or ID",
		name: "customerId",
		type: "options",
		typeOptions: { loadOptionsMethod: "getCustomers" },
		default: "",
		required: true,
		displayOptions: {
			show: { resource: ["customer"], operation: ["updateCustomer"] },
		},
		description:
			'Customer to update. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: "Firstname",
		name: "firstname",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: { resource: ["customer"], operation: ["updateCustomer"] },
		},
	},
	{
		displayName: "Lastname",
		name: "lastname",
		type: "string",
		default: "",
		required: true,
		displayOptions: {
			show: { resource: ["customer"], operation: ["updateCustomer"] },
		},
	},

	// ===== CREATE + UPDATE: shared "Additional Fields" =====
	{
		displayName: "Additional Fields",
		name: "additionalFields",
		type: "collection",
		placeholder: "Add Field",
		default: {},
		displayOptions: {
			show: {
				resource: ["customer"],
				operation: ["createCustomer", "updateCustomer"],
			},
		},
		options: [
			{
				displayName: "Address City",
				name: "address_city",
				type: "string",
				default: "",
			},
			{
				displayName: "Address State",
				name: "address_state",
				type: "options",
				options: GERMAN_STATE_OPTIONS,
				default: "baden_wuerttemberg",
				description:
					"Required by the API whenever address information is provided",
			},
			{
				displayName: "Address Street",
				name: "address_street",
				type: "string",
				default: "",
				placeholder: "Königstraße 1",
			},
			{
				displayName: "Address Zipcode",
				name: "address_zipcode",
				type: "string",
				default: "",
			},
			{
				displayName: "Contact Email",
				name: "contact_email",
				type: "string",
				placeholder: "name@email.com",
				default: "",
			},
			{
				displayName: "Contact Phone",
				name: "contact_phone",
				type: "string",
				default: "",
			},
			{
				displayName: "Customer Role",
				name: "customer_role",
				type: "options",
				options: [
					{ name: "Main Customer", value: "main_customer" },
					{ name: "Partner", value: "partner" },
					{ name: "Child", value: "child" },
				],
				default: "main_customer",
				description:
					"Role within the household. Must be Partner or Child when a Household ID is provided.",
				displayOptions: { show: { "/operation": ["createCustomer"] } },
			},
			{
				displayName: "Date of Birth",
				name: "date_of_birth",
				type: "dateTime",
				default: "",
			},
			{
				displayName: "Family Living Situation",
				name: "family_living_situation",
				type: "options",
				options: [
					{ name: "Family With Children", value: "family_with_children" },
					{ name: "Family Without Children", value: "family_without_children" },
					{ name: "Single", value: "single" },
					{ name: "Single Parent", value: "single_parent" },
				],
				default: "single",
			},
			{
				displayName: "Household ID",
				name: "household_id",
				type: "string",
				default: "",
				description:
					"Existing household to join. Required when creating a partner or child. Must be omitted for a main customer (a new household is created automatically).",
				displayOptions: { show: { "/operation": ["createCustomer"] } },
			},
			{
				displayName: "Marital Status",
				name: "marital_status",
				type: "options",
				options: [
					{ name: "Cohabitation", value: "cohabitation" },
					{ name: "Divorced", value: "divorced" },
					{ name: "Married", value: "married" },
					{ name: "Separated", value: "seperated" },
					{ name: "Single", value: "single" },
					{ name: "Widowed", value: "widowed" },
				],
				default: "single",
			},
			{
				displayName: "Nationality",
				name: "nationality",
				type: "string",
				default: "",
				placeholder: "DE",
			},
			{
				displayName: "Place of Birth",
				name: "place_of_birth",
				type: "string",
				default: "",
			},
		],
	},

	// ===== SEARCH =====
	{
		displayName: "Limit",
		name: "take",
		type: "number",
		default: 20,
		typeOptions: { minValue: 1, maxValue: 100 },
		description: "Max number of results to return",
		displayOptions: {
			show: { resource: ["customer"], operation: ["searchCustomers"] },
		},
	},
	{
		displayName: "Skip",
		name: "skip",
		type: "number",
		default: 0,
		typeOptions: { minValue: 0 },
		description: "Number of results to skip",
		displayOptions: {
			show: { resource: ["customer"], operation: ["searchCustomers"] },
		},
	},
	{
		displayName: "Filters",
		name: "searchFilters",
		type: "collection",
		placeholder: "Add Filter",
		default: {},
		displayOptions: {
			show: { resource: ["customer"], operation: ["searchCustomers"] },
		},
		options: [
			{ displayName: "Address", name: "address", type: "string", default: "" },
			{ displayName: "City", name: "city", type: "string", default: "" },
			{
				displayName: "Date of Birth",
				name: "date_of_birth",
				type: "dateTime",
				default: "",
			},
			{
				displayName: "Email",
				name: "email",
				type: "string",
				placeholder: "name@email.com",
				default: "",
			},
			{ displayName: "Firstname", name: "firstname", type: "string", default: "" },
			{ displayName: "Lastname", name: "lastname", type: "string", default: "" },
			{ displayName: "Phone", name: "phone", type: "string", default: "" },
			{
				displayName: "Place of Birth",
				name: "place_of_birth",
				type: "string",
				default: "",
			},
			{
				displayName: "State",
				name: "state",
				type: "options",
				options: GERMAN_STATE_OPTIONS,
				default: "baden_wuerttemberg",
			},
			{ displayName: "Zipcode", name: "zipcode", type: "string", default: "" },
		],
	},
];

function buildContactAndAddress(fields: IDataObject): {
	contact_info?: IDataObject;
	address_info?: IDataObject;
} {
	const contact_info = cleanBody({
		email: fields.contact_email as string | undefined,
		phone: fields.contact_phone as string | undefined,
	});
	const address_info = cleanBody({
		address: fields.address_street as string | undefined,
		zipcode: fields.address_zipcode as string | undefined,
		city: fields.address_city as string | undefined,
		state: fields.address_state as string | undefined,
	});

	const result: { contact_info?: IDataObject; address_info?: IDataObject } = {};
	if (Object.keys(contact_info).length) result.contact_info = contact_info;
	if (Object.keys(address_info).length) result.address_info = address_info;
	return result;
}

export async function handleCustomer(
	this: IExecuteFunctions,
	i: number,
	operation: string,
): Promise<unknown> {
	switch (operation) {
		case "searchCustomers": {
			const take = this.getNodeParameter("take", i, 20) as number;
			const skip = this.getNodeParameter("skip", i, 0) as number;
			const filters = this.getNodeParameter(
				"searchFilters",
				i,
				{},
			) as IDataObject;

			const body = cleanBody({ take, skip, ...filters });
			return cfRequest(this, "POST", "/v1/customers/search", { body });
		}

		case "getCustomer": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			if (!customerId) {
				throw new ApplicationError("Customer is required.");
			}
			return cfRequest(this, "GET", `/v1/customers/${customerId}`);
		}

		case "createCustomer": {
			const firstname = this.getNodeParameter("firstname", i) as string;
			const lastname = this.getNodeParameter("lastname", i) as string;
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;

			const { contact_info, address_info } =
				buildContactAndAddress(additionalFields);

			const body = cleanBody({
				firstname,
				lastname,
				household_id: additionalFields.household_id as string | undefined,
				customer_role: additionalFields.customer_role as string | undefined,
				marital_status: additionalFields.marital_status as string | undefined,
				family_living_situation: additionalFields.family_living_situation as
					| string
					| undefined,
				date_of_birth: toDateOnly(additionalFields.date_of_birth),
				place_of_birth: additionalFields.place_of_birth as string | undefined,
				nationality: additionalFields.nationality as string | undefined,
			});
			if (contact_info) body.contact_info = contact_info;
			if (address_info) body.address_info = address_info;

			return cfRequest(this, "POST", "/v1/customers", { body });
		}

		case "updateCustomer": {
			const customerId = this.getNodeParameter("customerId", i) as string;
			const firstname = this.getNodeParameter("firstname", i) as string;
			const lastname = this.getNodeParameter("lastname", i) as string;
			const additionalFields = this.getNodeParameter(
				"additionalFields",
				i,
				{},
			) as IDataObject;

			if (!customerId) {
				throw new ApplicationError("Customer is required.");
			}

			const { contact_info, address_info } =
				buildContactAndAddress(additionalFields);

			const body = cleanBody({
				id: customerId,
				firstname,
				lastname,
				marital_status: additionalFields.marital_status as string | undefined,
				family_living_situation: additionalFields.family_living_situation as
					| string
					| undefined,
				date_of_birth: toDateOnly(additionalFields.date_of_birth),
				place_of_birth: additionalFields.place_of_birth as string | undefined,
				nationality: additionalFields.nationality as string | undefined,
			});
			if (contact_info) body.contact_info = contact_info;
			if (address_info) body.address_info = address_info;

			return cfRequest(this, "PUT", "/v1/customers", { body });
		}

		default:
			throw new ApplicationError(`Unsupported customer operation: ${operation}`);
	}
}
