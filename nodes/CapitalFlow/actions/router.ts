import { ApplicationError, IExecuteFunctions } from "n8n-workflow";

import { handleCashflowAsset } from "./cashflow-asset/cashflowAsset.actions";
import { handleCashflowExpenditure } from "./cashflow-expenditure/cashflowExpenditure.actions";
import { handleCashflowHedge } from "./cashflow-hedge/cashflowHedge.actions";
import { handleCashflowIncome } from "./cashflow-income/cashflowIncome.actions";
import { handleContract } from "./contract/contract.actions";
import { handleCustomer } from "./customer/customer.actions";
import { handleForm } from "./form/form.actions";
import { handleHousehold } from "./household/household.actions";
import { handleOrganization } from "./organization/organization.actions";

export async function route(
	this: IExecuteFunctions,
	i: number,
	resource: string,
	operation: string,
): Promise<unknown> {
	switch (resource) {
		case "customer":
			return await handleCustomer.call(this, i, operation);

		case "cashflowIncome":
			return await handleCashflowIncome.call(this, i, operation);

		case "cashflowExpenditure":
			return await handleCashflowExpenditure.call(this, i, operation);

		case "cashflowAsset":
			return await handleCashflowAsset.call(this, i, operation);

		case "cashflowHedge":
			return await handleCashflowHedge.call(this, i, operation);

		case "contract":
			return await handleContract.call(this, i, operation);

		case "form":
			return await handleForm.call(this, i, operation);

		case "household":
			return await handleHousehold.call(this, i, operation);

		case "organization":
			return await handleOrganization.call(this, i, operation);

		default:
			throw new ApplicationError(`Unsupported resource: ${resource}`);
	}
}
