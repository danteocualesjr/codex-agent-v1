const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const projectMultipliers = {
  brand: 1,
  web: 1.2,
  app: 1.5,
  retainer: 1.35,
};

const deliverableMultipliers = {
  strategy: 0.12,
  design: 0.18,
  copy: 0.1,
  dev: 0.22,
  analytics: 0.06,
  handoff: 0.05,
};

const timelineMultipliers = {
  calm: 1,
  normal: 1.08,
  rush: 1.28,
};

const revisionMultipliers = {
  1: 1,
  2: 1.08,
  3: 1.16,
  4: 1.26,
};

const stakeholderMultipliers = {
  solo: 1,
  small: 1.07,
  large: 1.18,
};

const budgetRiskAdjustments = {
  low: 2.3,
  medium: 1.1,
  high: 0.4,
};

const scopeForm = document.querySelector("#scope-form");
const proposalText = document.querySelector("#proposalText");
const copyProposalButton = document.querySelector("#copyProposal");
const storageKey = "scopemint-mvp-state";
const pricingStorageKey = "scopemint-pricing-state";
const billingButtons = [...document.querySelectorAll("[data-billing]")];
const planCards = [...document.querySelectorAll("[data-plan]")];
const planButtons = [...document.querySelectorAll("[data-plan-select]")];
const checkoutEmail = document.querySelector("#checkoutEmail");
const teamSize = document.querySelector("#teamSize");
const checkoutMessage = document.querySelector("#checkoutMessage");
const checkoutButton = document.querySelector("#checkoutButton");
const copyCheckoutLinkButton = document.querySelector("#copyCheckoutLink");

const pricingCatalog = {
  starter: {
    name: "Starter",
    monthly: 19,
    yearly: 15,
  },
  pro: {
    name: "Pro",
    monthly: 49,
    yearly: 39,
  },
  agency: {
    name: "Agency",
    monthly: 149,
    yearly: 119,
  },
};

function getSelectedDeliverables() {
  return [...document.querySelectorAll('input[type="checkbox"]:checked')].map(
    (input) => input.value
  );
}

function titleize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function buildGuardrails(input, riskScore) {
  const items = [
    `This quote includes ${input.revisions} revision round${input.revisions === "1" ? "" : "s"}; extra revisions are billed separately.`,
    `Feedback is expected from ${input.stakeholders === "solo" ? "one decision-maker" : "a consolidated client team contact"} to avoid timeline drift.`,
  ];

  if (input.timeline === "rush") {
    items.push("Rush delivery requires pre-scheduled feedback windows and a higher upfront payment.");
  }

  if (riskScore >= 6) {
    items.push("Discovery findings that materially expand scope should trigger a paid change order.");
  }

  if (input.deliverables.includes("dev")) {
    items.push("Development estimates assume no major architecture pivots after approval.");
  }

  return items;
}

function buildUpsells(input) {
  const upsells = [
    "Add a paid strategy workshop before execution begins.",
    "Offer ongoing support or optimization as a monthly retainer.",
  ];

  if (!input.deliverables.includes("copy")) {
    upsells.push("Upsell messaging and conversion copy as a separate line item.");
  }

  if (!input.deliverables.includes("analytics")) {
    upsells.push("Add analytics setup and reporting to extend project value.");
  }

  if (input.projectType === "web" || input.projectType === "app") {
    upsells.push("Bundle launch QA and post-launch support into a premium package.");
  }

  return upsells;
}

function buildProposal(input, prices, riskScore) {
  const deliverableList = input.deliverables.map(titleize).join(", ");
  const rushLine =
    input.timeline === "rush"
      ? "A rush delivery premium is included to protect focus and availability."
      : "The proposed timeline assumes standard turnaround and consolidated feedback.";

  return `Project: ${titleize(input.projectType)} engagement
Recommended investment: ${currency.format(prices.recommended)}
Payment schedule: ${prices.paymentPlan}

Scope
- Estimated effort: ${input.hours} hours at a target internal rate of ${currency.format(input.rate)}/hr
- Included deliverables: ${deliverableList}
- Revision rounds included: ${input.revisions}
- Stakeholder profile: ${input.stakeholders}

Commercial terms
- ${rushLine}
- Any work outside the approved deliverables will be quoted as a change request.
- Delays caused by missing client feedback may shift delivery dates.

Risk notes
- Current pricing risk score: ${riskScore}/10
- Budget clarity: ${input.budgetConfidence}
- Source notes: ${input.notes.trim() || "No additional client notes provided."}`;
}

function renderList(selector, items) {
  const target = document.querySelector(selector);
  target.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function formatPlanPrice(amount, billing) {
  return `${currency.format(amount)}/${billing === "monthly" ? "month" : "month billed yearly"}`;
}

function computeQuote(input) {
  const base = input.hours * input.rate;
  const deliverableBoost =
    1 +
    input.deliverables.reduce(
      (sum, item) => sum + (deliverableMultipliers[item] || 0),
      0
    );

  const multiplier =
    projectMultipliers[input.projectType] *
    deliverableBoost *
    timelineMultipliers[input.timeline] *
    revisionMultipliers[input.revisions] *
    stakeholderMultipliers[input.stakeholders];

  const recommended = Math.round(base * multiplier);
  const floor = Math.round(recommended * 0.82);
  const stretch = Math.round(recommended * 1.22);

  let riskScore =
    budgetRiskAdjustments[input.budgetConfidence] +
    (input.timeline === "rush" ? 2.1 : input.timeline === "normal" ? 0.8 : 0.2) +
    (input.stakeholders === "large" ? 2.2 : input.stakeholders === "small" ? 1.2 : 0.4) +
    (Number(input.revisions) >= 3 ? 1.7 : 0.5);

  if (input.notes.toLowerCase().includes("asap")) riskScore += 1;
  if (input.notes.toLowerCase().includes("cheap")) riskScore += 1.4;
  if (input.notes.toLowerCase().includes("urgent")) riskScore += 0.8;

  riskScore = Math.min(10, Math.max(1, Number(riskScore.toFixed(1))));

  const paymentPlan =
    riskScore >= 7
      ? "60% upfront / 30% midpoint / 10% final"
      : input.projectType === "retainer"
        ? "Monthly prepay"
        : "50% upfront / 30% midpoint / 20% final";

  return {
    floor,
    recommended,
    stretch,
    riskScore,
    paymentPlan,
  };
}

function updateOutput(input) {
  const prices = computeQuote(input);
  document.querySelector("#floorPrice").textContent = currency.format(prices.floor);
  document.querySelector("#recommendedPrice").textContent = currency.format(prices.recommended);
  document.querySelector("#stretchPrice").textContent = currency.format(prices.stretch);
  document.querySelector("#riskScore").textContent = `${prices.riskScore}/10`;
  document.querySelector("#riskSummary").textContent =
    prices.riskScore >= 7
      ? "High-friction deal. Protect margin and tighten scope."
      : prices.riskScore >= 4
        ? "Healthy but needs clear guardrails."
        : "Low-friction opportunity with solid close potential.";
  document.querySelector("#paymentPlan").textContent = prices.paymentPlan;
  document.querySelector("#paymentSummary").textContent =
    prices.paymentPlan === "Monthly prepay"
      ? "Best for ongoing retainers with continuous scope."
      : "Front-load cash flow so the project starts safely.";

  renderList("#guardrails", buildGuardrails(input, prices.riskScore));
  renderList("#upsells", buildUpsells(input));

  proposalText.textContent = buildProposal(input, prices, prices.riskScore);
  updatePricingRecommendation(input, prices);
}

function readForm() {
  return {
    projectType: document.querySelector("#projectType").value,
    budgetConfidence: document.querySelector("#budgetConfidence").value,
    hours: Number(document.querySelector("#hours").value || 0),
    rate: Number(document.querySelector("#rate").value || 0),
    timeline: document.querySelector("#timeline").value,
    revisions: document.querySelector("#revisions").value,
    stakeholders: document.querySelector("#stakeholders").value,
    deliverables: getSelectedDeliverables(),
    notes: document.querySelector("#notes").value,
  };
}

function writeForm(input) {
  document.querySelector("#projectType").value = input.projectType;
  document.querySelector("#budgetConfidence").value = input.budgetConfidence;
  document.querySelector("#hours").value = input.hours;
  document.querySelector("#rate").value = input.rate;
  document.querySelector("#timeline").value = input.timeline;
  document.querySelector("#revisions").value = input.revisions;
  document.querySelector("#stakeholders").value = input.stakeholders;
  document.querySelector("#notes").value = input.notes;

  for (const checkbox of document.querySelectorAll('input[type="checkbox"]')) {
    checkbox.checked = input.deliverables.includes(checkbox.value);
  }
}

function persistState(input) {
  localStorage.setItem(storageKey, JSON.stringify(input));
}

function persistPricingState(input) {
  localStorage.setItem(pricingStorageKey, JSON.stringify(input));
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadPricingState() {
  try {
    const raw = localStorage.getItem(pricingStorageKey);
    return raw ? JSON.parse(raw) : { billing: "monthly", plan: "pro" };
  } catch {
    return { billing: "monthly", plan: "pro" };
  }
}

function getPricingState() {
  return {
    billing: document.querySelector("[data-billing].is-active")?.dataset.billing || "monthly",
    plan: document.querySelector(".price-card.is-selected")?.dataset.plan || "pro",
  };
}

function setBilling(billing) {
  for (const button of billingButtons) {
    button.classList.toggle("is-active", button.dataset.billing === billing);
  }

  for (const priceNode of document.querySelectorAll("[data-price]")) {
    const plan = priceNode.dataset.price;
    priceNode.textContent = currency.format(pricingCatalog[plan][billing]);
  }

  updateCheckoutPanel();
}

function setPlan(plan) {
  for (const card of planCards) {
    card.classList.toggle("is-selected", card.dataset.plan === plan);
  }

  for (const button of planButtons) {
    const isSelected = button.dataset.planSelect === plan;
    button.textContent = isSelected
      ? "Selected"
      : `Choose ${pricingCatalog[button.dataset.planSelect].name}`;
    button.classList.toggle("ghost-button", isSelected);
  }

  updateCheckoutPanel();
}

function updatePricingRecommendation(input, quote) {
  let recommendedPlan = "starter";
  let recommendation =
    "Starter fits light solo quoting if you mostly need fast pricing and proposal copy.";

  if (
    quote.recommended >= 5000 ||
    input.projectType === "app" ||
    input.deliverables.includes("dev") ||
    quote.riskScore >= 6
  ) {
    recommendedPlan = "pro";
    recommendation =
      "Pro is the best fit for this deal because the quote size and delivery complexity justify stronger pricing controls.";
  }

  if (
    input.projectType === "retainer" ||
    input.stakeholders === "large" ||
    teamSize.value === "agency" ||
    quote.recommended >= 12000
  ) {
    recommendedPlan = "agency";
    recommendation =
      "Agency is recommended here because multi-stakeholder quoting and repeatable workflows matter more than basic exports.";
  }

  document.querySelector("#planRecommendation").textContent = recommendation;

  if (!document.querySelector(".price-card.is-selected")) {
    setPlan(recommendedPlan);
  }
}

function updateCheckoutPanel() {
  const { billing, plan } = getPricingState();
  const selectedPlan = pricingCatalog[plan];
  const monthlyPrice = selectedPlan.monthly;
  const yearlyPrice = selectedPlan.yearly;
  const activePrice = selectedPlan[billing];
  const annualSavings = currency.format((monthlyPrice - yearlyPrice) * 12);

  document.querySelector("#selectedPlanLabel").textContent = `${selectedPlan.name} plan selected`;
  document.querySelector("#selectedBilling").textContent =
    billing === "monthly" ? "Monthly billing" : "Yearly billing";
  document.querySelector("#selectedPrice").textContent = formatPlanPrice(activePrice, billing);
  document.querySelector("#selectedSavings").textContent =
    billing === "yearly" ? `${annualSavings}/year` : "Switch to yearly";

  persistPricingState({ billing, plan, email: checkoutEmail.value, teamSize: teamSize.value });
}

function buildCheckoutLink() {
  const { billing, plan } = getPricingState();
  const email = encodeURIComponent(checkoutEmail.value.trim() || "founder@scopemint.app");
  const seats = encodeURIComponent(teamSize.value);
  return `https://buy.scopemint.app/checkout?plan=${plan}&billing=${billing}&email=${email}&team=${seats}`;
}

async function copyCheckoutLink() {
  const link = buildCheckoutLink();

  try {
    await navigator.clipboard.writeText(link);
    checkoutMessage.textContent = `Checkout link copied: ${link}`;
    checkoutMessage.classList.add("is-success");
  } catch {
    checkoutMessage.textContent = "Could not copy the checkout link in this browser.";
    checkoutMessage.classList.remove("is-success");
  }
}

function handleCheckout() {
  const { plan, billing } = getPricingState();
  const email = checkoutEmail.value.trim();

  if (!email) {
    checkoutMessage.textContent = "Add a work email so the trial can be created.";
    checkoutMessage.classList.remove("is-success");
    checkoutEmail.focus();
    return;
  }

  const selectedPlan = pricingCatalog[plan];
  checkoutMessage.textContent =
    `Trial ready for ${email}: ${selectedPlan.name} on ${billing} billing at ${formatPlanPrice(selectedPlan[billing], billing)}.`;
  checkoutMessage.classList.add("is-success");
  persistPricingState({ billing, plan, email, teamSize: teamSize.value });
}

scopeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readForm();
  persistState(input);
  updateOutput(input);
});

copyProposalButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(proposalText.textContent);
    copyProposalButton.textContent = "Copied";
    window.setTimeout(() => {
      copyProposalButton.textContent = "Copy text";
    }, 1200);
  } catch {
    copyProposalButton.textContent = "Copy failed";
    window.setTimeout(() => {
      copyProposalButton.textContent = "Copy text";
    }, 1200);
  }
});

for (const button of billingButtons) {
  button.addEventListener("click", () => {
    setBilling(button.dataset.billing);
  });
}

for (const button of planButtons) {
  button.addEventListener("click", () => {
    setPlan(button.dataset.planSelect);
  });
}

checkoutButton.addEventListener("click", handleCheckout);
copyCheckoutLinkButton.addEventListener("click", copyCheckoutLink);
checkoutEmail.addEventListener("input", updateCheckoutPanel);
teamSize.addEventListener("change", () => {
  const teamChoiceToPlan = {
    solo: "starter",
    small: "pro",
    agency: "agency",
  };
  const suggestedPlan = teamChoiceToPlan[teamSize.value];
  if (suggestedPlan) {
    setPlan(suggestedPlan);
  }
  updateCheckoutPanel();
});

const savedState = loadState();
if (savedState) {
  writeForm(savedState);
}

const savedPricingState = loadPricingState();
if (savedPricingState.email) {
  checkoutEmail.value = savedPricingState.email;
}
if (savedPricingState.teamSize) {
  teamSize.value = savedPricingState.teamSize;
}

setBilling(savedPricingState.billing || "monthly");
setPlan(savedPricingState.plan || "pro");
updateOutput(readForm());
