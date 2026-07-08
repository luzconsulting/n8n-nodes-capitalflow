import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
} from "n8n-workflow";

import {
	cashflowAssetFields,
	cashflowAssetOperations,
} from "./actions/cashflow-asset";
import {
	cashflowExpenditureFields,
	cashflowExpenditureOperations,
} from "./actions/cashflow-expenditure";
import { cashflowHedgeFields, cashflowHedgeOperations } from "./actions/cashflow-hedge";
import {
	cashflowIncomeFields,
	cashflowIncomeOperations,
} from "./actions/cashflow-income";
import { contractFields, contractOperations } from "./actions/contract";
import { customerFields, customerOperations } from "./actions/customer";
import { formFields, formOperations } from "./actions/form";
import { householdFields, householdOperations } from "./actions/household";
import { organizationFields, organizationOperations } from "./actions/organization";
import { resourceSelector } from "./actions/resource.selector";
import { route } from "./actions/router";
import * as Loaders from "./methods/loadOptions";

export class CapitalFlow implements INodeType {
	description: INodeTypeDescription = {
		displayName: "CapitalFlow",
		name: "capitalFlow",
		icon: {
			light: "file:capitalflow-light-icon.svg",
			dark: "file:capitalflow-dark-icon.svg",
		},
		group: ["transform"],
		version: 1,
		description: "Interact with the CapitalFlow API",
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: "CapitalFlow",
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: "capitalFlowApi",
				required: true,
			},
		],
		usableAsTool: true,
		properties: [
			resourceSelector,

			// Customer
			...customerOperations,
			...customerFields,

			// Cashflow Income
			...cashflowIncomeOperations,
			...cashflowIncomeFields,

			// Cashflow Expenditure
			...cashflowExpenditureOperations,
			...cashflowExpenditureFields,

			// Cashflow Asset
			...cashflowAssetOperations,
			...cashflowAssetFields,

			// Cashflow Hedge
			...cashflowHedgeOperations,
			...cashflowHedgeFields,

			// Contract
			...contractOperations,
			...contractFields,

			// Form
			...formOperations,
			...formFields,

			// Household
			...householdOperations,
			...householdFields,

			// Organization
			...organizationOperations,
			...organizationFields,
		],
	};

	methods = {
		loadOptions: {
			...Loaders.customerLoaders,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter("resource", i) as string;
				const operation = this.getNodeParameter("operation", i) as string;
				const result = (await route.call(
					this,
					i,
					resource,
					operation,
				)) as unknown;

				if (Array.isArray(result)) {
					for (const entry of result) {
						returnData.push({
							json: entry as IDataObject,
							pairedItem: { item: i },
						});
					}
				} else if (result && typeof result === "object") {
					returnData.push({
						json: result as IDataObject,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: items[i].json,
						error:
							error instanceof NodeApiError ||
							error instanceof NodeOperationError
								? error
								: new NodeOperationError(this.getNode(), error as Error, {
										itemIndex: i,
									}),
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
