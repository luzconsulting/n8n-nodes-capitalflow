# @luzconsulting/n8n-nodes-capitalflow

![n8n Community Node](https://img.shields.io/badge/n8n-community--node-FF6D5A)
![Version](https://img.shields.io/badge/version-1.1.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/node-%3E%3D20.15-brightgreen)
![CapitalFlow API](https://img.shields.io/badge/CapitalFlow%20API-1.0.0-orange)

Verified against the CapitalFlow Public API **v1.0.0**.

An n8n community node for [CapitalFlow](https://app.capital-flow.de) — manage customers and households, cashflow entries (income, expenditure, assets, hedges), detailed financial contracts, and generate shareable data-collection forms.

## What it does

The **CapitalFlow** node covers every operation exposed by the CapitalFlow Public API:

| Resource | Operations |
|---|---|
| Customer | Search, get, create, update |
| Cashflow Income | Create, batch create, list, get, update, delete |
| Cashflow Expenditure | Create, batch create, list, get, update, delete |
| Cashflow Asset | Create, batch create, list, get, update, delete |
| Cashflow Hedge | Create, batch create, list, get, update, delete |
| Contract | Create, list, get, update, delete — across all 26 asset/hedge contract-detail combinations (accounts, pensions, property, and insurance) |
| Form | Share customer data form, share cashflow analysis form |
| Household | Get the household (with members) a customer belongs to |
| Organization | List members of your organization |

### Households

Customers now belong to a household. When creating a customer you can either leave **Household ID** empty (a new household is created automatically for a `main_customer`) or provide an existing household's ID to add a `partner` or `child` to it. The **Household** resource looks up the household record for a given customer.

### Contract types

The **Contract** resource covers all contract-detail types the API supports, split into a **Category** — asset (checking/savings/call-money accounts, investment accounts, building savings contracts, property, private pension, Rürup, Riester, employer pension schemes, other) or hedge (15 insurance types, e.g. liability, car, household contents, term life, income protection, private/nursing-care health insurance, other) — and a **Contract Type** within that category. The category disambiguates types whose names overlap between the two families (e.g. "Other"). The node exposes exactly the fields relevant to the selected category/type combination — no need to hand-craft JSON payloads for each schema.

## Setup

### Requirements

- n8n **1.0.0+**
- A CapitalFlow account with API access enabled

### Install

In n8n: **Settings → Community Nodes → Install**, then enter:

```
@luzconsulting/n8n-nodes-capitalflow
```

Restart n8n afterwards — the node appears as "CapitalFlow".

### Credentials

The node authenticates with an API key sent as a `cf-api-key` header against `https://api.capital-flow.de`. Generate a key in the CapitalFlow dashboard under **Settings → API Keys**, then add it as a new **CapitalFlow API** credential in n8n. See [CREDENTIALS.md](CREDENTIALS.md) for step-by-step setup.

Note: the API is rate-limited to 200 requests per minute per API key.

## Usage example

Create a new customer, then log a recurring income entry on their cashflow:

1. Add a **CapitalFlow** node, select your **CapitalFlow API** credential. Set **Resource** to `Customer` and **Operation** to `Create`. Fill in **Firstname**, **Lastname**, and the other required fields.
2. Add a second **CapitalFlow** node with **Resource** `Cashflow Income` and **Operation** `Create`. Set **Customer Name or ID** to the customer created in step 1, e.g.:
   ```
   {{ $node["CapitalFlow"].json.id }}
   ```
   Fill in **Description**, **Net Value** / **Gross Value**, and pick a **Payment Cycle**.

Running the workflow creates the customer, then attaches the income entry to their cashflow — the customer ID from step 1 is passed into step 2 via an expression.

## Disclaimer

This is an independent, community-maintained integration. It is not affiliated with, endorsed by, or sponsored by CapitalFlow. For account or API issues, contact CapitalFlow support directly; for issues with this node, use the [GitHub issue tracker](https://github.com/luzconsulting/n8n-nodes-capitalflow/issues).

## License

MIT — see [LICENSE.md](LICENSE.md). Contributions welcome.
