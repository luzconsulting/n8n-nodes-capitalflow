# CapitalFlow API Key Setup

To use the **CapitalFlow Node in n8n**, you need a **CapitalFlow API Key**.

## 🔑 Create an API Key

1. Log in to the CapitalFlow dashboard.
2. Go to **Settings → API Keys**.
3. Copy an existing API key or create a new one.

## ⚙️ Use in n8n

1. Open n8n and go to **Credentials → New → CapitalFlow API**.
2. Enter the following:
   - **API Key**: your generated secret key (sent as the `cf-api-key` header)
   - **API Base URL**: Default: `https://api.capital-flow.de`
3. Click **Test** → if everything is correct, you'll get a confirmation.

## 📌 Notes

- API keys are limited to **200 requests per minute**; the API returns HTTP `429` (`RATE_LIMITED`) once exceeded.
- API keys have broad access to customer and financial data — keep them safe and private.
