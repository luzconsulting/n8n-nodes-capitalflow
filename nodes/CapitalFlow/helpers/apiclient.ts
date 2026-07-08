import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from "n8n-workflow";

export type ApiContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IHookFunctions
	| IWebhookFunctions;

type RequestWithAuthentication = (
	credentialType: string,
	requestOptions: IHttpRequestOptions,
) => Promise<unknown>;

function hasRequestWithAuthentication(ctx: ApiContext): ctx is ApiContext & {
	helpers: {
		httpRequestWithAuthentication: RequestWithAuthentication;
	};
} {
	return typeof ctx.helpers?.httpRequestWithAuthentication === "function";
}

function normalizeBaseUrl(baseUrl: string): string {
	return baseUrl.trim().replace(/\/+$/, "");
}

function normalizePath(path: string): string {
	const normalizedPath = path.trim();
	if (!normalizedPath.startsWith("/")) {
		throw new Error(
			`CapitalFlow API path must start with a slash, for example /integrations/v1/customers. Received: ${path}`,
		);
	}
	if (!/^\/integrations(\/|$)/i.test(normalizedPath)) {
		return `/integrations${normalizedPath}`;
	}

	return normalizedPath;
}

export async function cfRequest(
	ctx: ApiContext,
	method: IHttpRequestOptions["method"],
	path: string,
	opts?: {
		qs?: IDataObject;
		body?: IDataObject | string;
		json?: boolean;
		headers?: Record<string, string>;
	},
): Promise<unknown>;
export async function cfRequest<T>(
	ctx: ApiContext,
	method: IHttpRequestOptions["method"],
	path: string,
	opts?: {
		qs?: IDataObject;
		body?: IDataObject | string;
		json?: boolean;
		headers?: Record<string, string>;
	},
): Promise<T>;
export async function cfRequest<T = unknown>(
	ctx: ApiContext,
	method: IHttpRequestOptions["method"],
	path: string,
	opts: {
		qs?: IDataObject;
		body?: IDataObject | string;
		json?: boolean;
		headers?: Record<string, string>;
	} = {},
): Promise<T> {
	const credentials = await ctx.getCredentials("capitalFlowApi");
	const baseUrl = normalizeBaseUrl(String(credentials.baseUrl || ""));
	const requestPath = normalizePath(path);

	const json = opts.json ?? typeof opts.body !== "string";

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${requestPath}`,
		json,
		headers: {
			...opts.headers,
		} as IDataObject,
	};

	if (opts.qs) {
		const filteredQs: IDataObject = {};
		for (const [key, val] of Object.entries(opts.qs)) {
			if (val !== undefined && val !== null && val !== "") {
				filteredQs[key] = val;
			}
		}
		if (Object.keys(filteredQs).length) {
			options.qs = filteredQs;
		}
	}

	if (opts.body !== undefined) {
		options.body = opts.body;
	}

	if (!hasRequestWithAuthentication(ctx)) {
		throw new Error("No HTTP helper available");
	}

	return (await ctx.helpers.httpRequestWithAuthentication.call(
		ctx,
		"capitalFlowApi",
		options,
	)) as T;
}
