import { ApplicationError, IDataObject, IExecuteFunctions } from "n8n-workflow";
import type { INodeProperties } from "n8n-workflow";

import { cfRequest } from "../../helpers/apiclient";
import { cleanBody, GERMAN_STATE_OPTIONS, toDateOnly } from "../../helpers/fields";

const SALUTATION_OPTIONS = [
	{ name: "Formal (Sie)", value: "formal" },
	{ name: "Informal (Du)", value: "informal" },
];

const FORM_OF_ADDRESS_OPTIONS = [
	{ name: "Mr", value: "mr" },
	{ name: "Mrs", value: "mrs" },
];

const OCCUPATION_TYPE_OPTIONS = [
	{ name: "Board Member", value: "board_member" },
	{ name: "Employee", value: "employee" },
	{ name: "Farmer", value: "farmer" },
	{ name: "Freelancer", value: "freelancer" },
	{ name: "Housemaker", value: "housemaker" },
	{ name: "Job Seeking", value: "job_seeking" },
	{ name: "Managing Director (Social Insurance Exempt)", value: "managing_director_social_insurance_exempt" },
	{ name: "Official", value: "official" },
	{ name: "On Parental Leave", value: "on_parental_leave" },
	{ name: "Other", value: "other" },
	{ name: "Public Sector Employee", value: "public_sector_employee" },
	{ name: "Retiree", value: "retiree" },
	{ name: "School Student", value: "school_student" },
	{ name: "Self-Employed", value: "self_employed" },
	{ name: "Soldier", value: "soldier" },
	{ name: "Student", value: "student" },
	{ name: "Trainee", value: "trainee" },
	{ name: "Worker", value: "worker" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
	{ name: "Full-Time", value: "full_time" },
	{ name: "Mini Job", value: "mini_job" },
	{ name: "Part-Time", value: "part_time" },
	{ name: "Seasonal", value: "seasonal" },
];

const OFFICIAL_STATUS_OPTIONS = [
	{ name: "For Life", value: "for_life" },
	{ name: "On Revocation", value: "on_revocation" },
	{ name: "On Trial", value: "on_trial" },
];

const CAREER_OPTIONS = [
	{ name: "Medium Grade", value: "medium_grade" },
	{ name: "Higher Service", value: "higher_service" },
	{ name: "Highest Service", value: "highest_service" },
];

const PROVIDER_OPTIONS = [
	{ name: "Aid", value: "aid" },
	{ name: "Independent Medical Care", value: "independent_medical_care" },
	{ name: "Medical Care", value: "medical_care" },
];

const HEALTH_INSURANCE_TYPE_OPTIONS = [
	{ name: "Free Medical Care", value: "free_medical_care" },
	{ name: "Medical Care", value: "medical_care" },
	{ name: "Private Health Insurance", value: "private_health_insurance" },
	{ name: "Private Health Insurance With Aid", value: "private_health_insurance_with_aid" },
	{ name: "Statutory Health Insurance", value: "statutory_health_insurance" },
];

const NON_SMOKING_DURATION_OPTIONS = [
	{ name: "Less Than Ten Years", value: "less_than_ten_years" },
	{ name: "More Than Ten Years", value: "more_than_ten_years" },
];

const HIGHEST_DIPLOMA_OPTIONS = [
	{ name: "Advanced Technical Certificate", value: "advanced_technical_certificate" },
	{ name: "Basic School Certificate", value: "basic_school_certificate" },
	{ name: "Completed Degree", value: "completed_degree" },
	{ name: "High School Diploma", value: "high_school_diploma" },
	{ name: "No Degree", value: "no_degree" },
	{ name: "Secondary School Certificate", value: "secondary_school_certificate" },
];

const VOCATIONAL_TRAINING_OPTIONS = [
	{ name: "Business Specialist", value: "business_specialist" },
	{ name: "Certified Technician", value: "certified_technician" },
	{ name: "Completed Academic Degree", value: "completed_academic_degree" },
	{ name: "Completed Vocational Training", value: "completed_vocational_training" },
	{ name: "Master Craftsman", value: "master_craftsman" },
	{ name: "No or Incomplete Training", value: "no_or_incomplete_training" },
];

const DEFINITION_OF_VOCATIONAL_TRAINING_OPTIONS = [
	{ name: "Commercial Training", value: "commercial_training" },
	{ name: "Craft Training", value: "craft_training" },
	{ name: "Industrial Training", value: "industrial_training" },
	{ name: "Other Training", value: "other_training" },
	{ name: "Short-Term Training", value: "short_term_training" },
];

const DEFINITION_OF_UNIVERSITY_DEGREE_OPTIONS = [
	{ name: "Bachelor", value: "bachelor" },
	{ name: "Diploma", value: "diploma" },
	{ name: "Doctor", value: "doctor" },
	{ name: "Magister", value: "magister" },
	{ name: "Master", value: "master" },
	{ name: "Staatsexamen", value: "staatsexamen" },
];

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
				displayName: "Form of Address",
				name: "form_of_address",
				type: "options",
				options: FORM_OF_ADDRESS_OPTIONS,
				default: "mr",
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
			{
				displayName: "Salutation",
				name: "salutation",
				type: "options",
				options: SALUTATION_OPTIONS,
				default: "formal",
			},
		],
	},

	// ===== CREATE + UPDATE: Occupation Info =====
	{
		displayName: "Occupation Info",
		name: "occupationInfo",
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
				displayName: "Career",
				name: "career",
				type: "options",
				options: CAREER_OPTIONS,
				default: "medium_grade",
				description: "Laufbahn (for officials)",
			},
			{
				displayName: "Compensation Experience Level",
				name: "compensation_experience_level",
				type: "string",
				default: "",
			},
			{
				displayName: "Compensation Grade",
				name: "compensation_grade",
				type: "string",
				default: "",
			},
			{
				displayName: "Compensation Group",
				name: "compensation_group",
				type: "string",
				default: "",
			},
			{
				displayName: "Correctional Service",
				name: "correctional_service",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Date of Hiring",
				name: "date_of_hiring",
				type: "dateTime",
				default: "",
			},
			{
				displayName: "Date of Job Entry",
				name: "date_of_job_entry",
				type: "dateTime",
				default: "",
			},
			{
				displayName: "Employer (Federal State)",
				name: "employer",
				type: "options",
				options: GERMAN_STATE_OPTIONS,
				default: "baden_wuerttemberg",
				description: "Only relevant for officials employed by a federal state",
			},
			{
				displayName: "Employment Type",
				name: "employment_type",
				type: "options",
				options: EMPLOYMENT_TYPE_OPTIONS,
				default: "full_time",
			},
			{
				displayName: "Gross Income Previous Year",
				name: "gross_income_previous_year",
				type: "number",
				default: 0,
			},
			{
				displayName: "Job Title",
				name: "job_title",
				type: "string",
				default: "",
			},
			{
				displayName: "Labor Union",
				name: "labor_union",
				type: "string",
				default: "",
			},
			{
				displayName: "Net Income Previous Year",
				name: "net_income_previous_year",
				type: "number",
				default: 0,
			},
			{
				displayName: "Occupation Type",
				name: "occupation_type",
				type: "options",
				options: OCCUPATION_TYPE_OPTIONS,
				default: "employee",
			},
			{
				displayName: "Official Status",
				name: "official_status",
				type: "options",
				options: OFFICIAL_STATUS_OPTIONS,
				default: "on_trial",
			},
			{
				displayName: "Personnel Level",
				name: "personnel_level",
				type: "string",
				default: "",
			},
			{
				displayName: "Personnel Responsibility Amount",
				name: "personnel_responsibility_amount",
				type: "number",
				default: 0,
				description: "Number of employees supervised",
			},
			{
				displayName: "Provider",
				name: "provider",
				type: "options",
				options: PROVIDER_OPTIONS,
				default: "medical_care",
			},
			{
				displayName: "Public Service",
				name: "public_service",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Salary Position",
				name: "salary_position",
				type: "string",
				default: "",
			},
			{
				displayName: "Supervisory",
				name: "supervisory",
				type: "boolean",
				default: false,
			},
		],
	},

	// ===== CREATE + UPDATE: Health Info =====
	{
		displayName: "Health Info",
		name: "healthInfo",
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
				displayName: "Dangerous Hobbies",
				name: "dangerous_hobbies",
				type: "string",
				default: "",
			},
			{
				displayName: "Health Insurance",
				name: "health_insurance",
				type: "string",
				default: "",
				placeholder: "AOK Baden-Württemberg",
			},
			{
				displayName: "Health Insurance Type",
				name: "health_insurance_type",
				type: "options",
				options: HEALTH_INSURANCE_TYPE_OPTIONS,
				default: "statutory_health_insurance",
			},
			{
				displayName: "Height (Cm)",
				name: "height",
				type: "number",
				default: 0,
			},
			{
				displayName: "Non-Smoking Duration",
				name: "non_smoking_duration",
				type: "options",
				options: NON_SMOKING_DURATION_OPTIONS,
				default: "less_than_ten_years",
			},
			{
				displayName: "Office Activity at Work (%)",
				name: "office_activity_at_work_percentage",
				type: "number",
				default: 0,
			},
			{
				displayName: "Physical Activity at Work (%)",
				name: "physical_activity_at_work",
				type: "number",
				default: 0,
			},
			{
				displayName: "Smoker",
				name: "smoker",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Travel Activity (%)",
				name: "travel_activity_percentage",
				type: "number",
				default: 0,
			},
			{
				displayName: "Weight (Kg)",
				name: "weight",
				type: "number",
				default: 0,
			},
		],
	},

	// ===== CREATE + UPDATE: Tax Info =====
	{
		displayName: "Tax Info",
		name: "taxInfo",
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
				displayName: "Children Allowance",
				name: "children_allowance",
				type: "number",
				default: 0,
			},
			{
				displayName: "Children Count",
				name: "children_count",
				type: "number",
				default: 0,
			},
			{
				displayName: "Has Children",
				name: "has_children",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Has Church Tax",
				name: "has_church_tax",
				type: "boolean",
				default: false,
			},
			{
				displayName: "Social Security Number",
				name: "social_security_number",
				type: "string",
				default: "",
			},
			{
				displayName: "Spouse Factor",
				name: "spouse_factor",
				type: "number",
				default: 1,
			},
			{
				displayName: "Tax Class",
				name: "tax_class",
				type: "number",
				typeOptions: { minValue: 1, maxValue: 6 },
				default: 1,
				description: "German tax class (1-6)",
			},
			{
				displayName: "Tax ID",
				name: "tax_id",
				type: "string",
				default: "",
			},
		],
	},

	// ===== CREATE + UPDATE: Education Info =====
	{
		displayName: "Education Info",
		name: "educationInfo",
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
				displayName: "Definition of University Degree",
				name: "definition_of_university_degree",
				type: "options",
				options: DEFINITION_OF_UNIVERSITY_DEGREE_OPTIONS,
				default: "bachelor",
			},
			{
				displayName: "Definition of Vocational Training",
				name: "definition_of_vocational_training",
				type: "options",
				options: DEFINITION_OF_VOCATIONAL_TRAINING_OPTIONS,
				default: "commercial_training",
			},
			{
				displayName: "Field of Study",
				name: "field_of_study",
				type: "string",
				default: "",
				placeholder: "Wirtschaftsinformatik",
			},
			{
				displayName: "Highest Diploma",
				name: "highest_diploma",
				type: "options",
				options: HIGHEST_DIPLOMA_OPTIONS,
				default: "completed_degree",
			},
			{
				displayName: "Trained In",
				name: "trained_in",
				type: "string",
				default: "",
				placeholder: "Informatik",
			},
			{
				displayName: "Vocational Training",
				name: "vocational_training",
				type: "options",
				options: VOCATIONAL_TRAINING_OPTIONS,
				default: "completed_vocational_training",
			},
		],
	},

	// ===== CREATE + UPDATE: Bank Info =====
	{
		displayName: "Bank Info",
		name: "bankInfo",
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
				displayName: "Bank",
				name: "bank",
				type: "string",
				default: "",
				placeholder: "Commerzbank",
			},
			{
				displayName: "BIC",
				name: "bic",
				type: "string",
				default: "",
				placeholder: "COBADEFFXXX",
			},
			{
				displayName: "IBAN",
				name: "iban",
				type: "string",
				default: "",
				placeholder: "DE89370400440532013000",
			},
		],
	},

	// ===== CREATE + UPDATE: Identity Card Info =====
	{
		displayName: "Identity Card Info",
		name: "identityCardInfo",
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
				displayName: "Date of Issuing",
				name: "date_of_issuing",
				type: "dateTime",
				default: "",
			},
			{
				displayName: "Identity Card Number",
				name: "identity_card_number",
				type: "string",
				default: "",
			},
			{
				displayName: "Issuing Authority",
				name: "issuing_authority",
				type: "string",
				default: "",
				placeholder: "Stadt Stuttgart",
			},
			{
				displayName: "Valid Until",
				name: "valid_until",
				type: "dateTime",
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

const DATE_LIKE_KEY = /(_date$|_until$|date_of_)/;

/** Converts date-like values within a nested info collection to date-only strings, then strips empties. */
function buildInfoObject(raw: IDataObject): IDataObject | undefined {
	const converted: IDataObject = {};
	for (const [key, value] of Object.entries(raw)) {
		converted[key] = DATE_LIKE_KEY.test(key) ? toDateOnly(value) : value;
	}
	const cleaned = cleanBody(converted);
	return Object.keys(cleaned).length ? cleaned : undefined;
}

function buildNestedInfos(this: IExecuteFunctions, i: number): IDataObject {
	const occupation_info = buildInfoObject(
		this.getNodeParameter("occupationInfo", i, {}) as IDataObject,
	);
	const health_info = buildInfoObject(
		this.getNodeParameter("healthInfo", i, {}) as IDataObject,
	);
	const tax_info = buildInfoObject(this.getNodeParameter("taxInfo", i, {}) as IDataObject);
	const education_info = buildInfoObject(
		this.getNodeParameter("educationInfo", i, {}) as IDataObject,
	);
	const bank_info = buildInfoObject(this.getNodeParameter("bankInfo", i, {}) as IDataObject);
	const identity_card_info = buildInfoObject(
		this.getNodeParameter("identityCardInfo", i, {}) as IDataObject,
	);

	return cleanBody({
		occupation_info,
		health_info,
		tax_info,
		education_info,
		bank_info,
		identity_card_info,
	});
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
				salutation: additionalFields.salutation as string | undefined,
				form_of_address: additionalFields.form_of_address as string | undefined,
				...buildNestedInfos.call(this, i),
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
				salutation: additionalFields.salutation as string | undefined,
				form_of_address: additionalFields.form_of_address as string | undefined,
				...buildNestedInfos.call(this, i),
			});
			if (contact_info) body.contact_info = contact_info;
			if (address_info) body.address_info = address_info;

			return cfRequest(this, "PUT", "/v1/customers", { body });
		}

		default:
			throw new ApplicationError(`Unsupported customer operation: ${operation}`);
	}
}
