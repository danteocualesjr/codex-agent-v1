# ScopeMint

ScopeMint is a small SaaS MVP for freelancers and agencies who need help pricing projects without undercharging. It turns project inputs into:

- A pricing floor, recommended quote, and stretch number
- A risk score based on timeline, revisions, stakeholder load, and budget clarity
- Scope guardrails to reduce margin-killing ambiguity
- Proposal-ready summary text that can be copied into email, Notion, or a PDF

## Why this idea can make money

- It targets buyers who already pay for tools if they help protect margin.
- The pain is expensive and frequent: one bad quote can cost more than a monthly subscription.
- The product can start simple and expand into templates, CRM exports, Stripe quote links, AI rewrite, client portals, and team workflows.

## Suggested pricing

- Starter: $19/month
- Pro: $49/month
- Agency: $149/month

## Run locally

Because this repo is greenfield and dependency-free, the MVP runs as static files.

1. Open `index.html` directly in a browser, or
2. Serve the directory with a small static server, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Fastest next steps to monetize

1. Add Stripe payment links or Checkout.
2. Gate advanced features behind a login.
3. Save quotes per user in a database.
4. Add downloadable branded PDF proposals.
5. Launch to freelancer and small agency communities with live demos.
# codex-agent-v1
