import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from "n8n-workflow";

export class CapitalFlowApi implements ICredentialType {
	name = "capitalFlowApi";
	displayName = "CapitalFlow API";
	documentationUrl =
		"https://github.com/luzconsulting/n8n-nodes-capitalflow/blob/main/CREDENTIALS.md";
	icon: Icon = {
		light: "file:capitalflow-light-icon.svg",
		dark: "file:capitalflow-dark-icon.svg",
	};

	authenticate: IAuthenticateGeneric = {
		type: "generic",
		properties: {
			headers: {
				"cf-api-key": "={{$credentials.apiKey}}",
			},
		},
	};

	properties: INodeProperties[] = [
		{
			displayName: "API Base URL",
			name: "baseUrl",
			type: "string",
			default: "https://api.capital-flow.de",
			placeholder: "https://api.capital-flow.de",
			description: "Base URL of the CapitalFlow Public API",
		},
		{
			displayName: "API Key",
			name: "apiKey",
			type: "string",
			typeOptions: { password: true },
			default: "",
			description:
				"Your CapitalFlow API key, sent as the cf-api-key header. Generate one in the CapitalFlow dashboard under Settings → API Keys.",
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				"={{String($credentials.baseUrl).replace(/\\/+$/, '')}}",
			url: "/integrations/v1/customers/search",
			method: "POST",
			body: {},
		},
	};
}
