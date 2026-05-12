const currencyLocales = {
  USD: "en-US",
  EUR: "en-IE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
};

let activeCurrency = "USD";

function buildCurrencyFormatter(code) {
  return new Intl.NumberFormat(currencyLocales[code] || "en-US", {
    style: "currency",
    currency: code,
    maximumFractionDigits: 0,
  });
}

let currency = buildCurrencyFormatter(activeCurrency);
const planCurrency = buildCurrencyFormatter("USD");

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

const toastStack = document.querySelector("#toastStack");
const toastIcons = {
  success:
    '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  error:
    '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 17h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 7.5h.01" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};

function showToast({ title, message = "", type = "info", duration = 3200 } = {}) {
  if (!toastStack || !title) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${toastIcons[type] || toastIcons.info}</span>
    <div class="toast-body">
      <p class="toast-title">${title}</p>
      ${message ? `<p class="toast-message">${message}</p>` : ""}
    </div>
    <button type="button" class="toast-close" aria-label="Dismiss">
      <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6l-12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    </button>
  `;

  const dismiss = () => {
    toast.classList.add("is-leaving");
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 240);
  };

  toast.querySelector(".toast-close").addEventListener("click", dismiss);
  toastStack.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  if (duration > 0) {
    window.setTimeout(dismiss, duration);
  }
}

const themeStorageKey = "scopemint-theme";
const themeToggle = document.querySelector("#themeToggle");

function applyTheme(theme) {
  const next = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(next === "dark"));
    themeToggle.setAttribute(
      "aria-label",
      next === "dark" ? "Switch to light mode" : "Switch to dark mode"
    );
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", next === "dark" ? "#0f1417" : "#f4efe7");
  }
}

function loadTheme() {
  const saved = localStorage.getItem(themeStorageKey);
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

applyTheme(loadTheme());

const ua = navigator.userAgent || "";
const platformHint = navigator.userAgentData?.platform || "";
const isMacLike =
  platformHint === "macOS" ||
  /Macintosh|Mac OS X|iPhone|iPad|iPod/.test(ua);
document.documentElement.dataset.os = isMacLike ? "mac" : "other";

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(themeStorageKey, next);
    applyTheme(next);
  });
}

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
const riskMeterFill = document.querySelector("#riskMeterFill");
const footerYear = document.querySelector("#footerYear");

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

function buildMarkdownProposal(input, prices, riskScore) {
  const deliverableList = input.deliverables.length
    ? input.deliverables.map((item) => `- ${titleize(item)}`).join("\n")
    : "- (none specified)";
  const rushLine =
    input.timeline === "rush"
      ? "A rush delivery premium is included to protect focus and availability."
      : "The proposed timeline assumes standard turnaround and consolidated feedback.";
  const heading = input.projectName
    ? `# Proposal — ${input.projectName}`
    : `# Proposal — ${titleize(input.projectType)} Engagement`;
  const clientLine = input.clientName ? `**Prepared for:** ${input.clientName}` : "";

  return [
    heading,
    clientLine,
    "",
    `**Engagement type:** ${titleize(input.projectType)}  `,
    `**Recommended investment:** ${currency.format(prices.recommended)}  `,
    `**Floor / Stretch:** ${currency.format(prices.floor)} / ${currency.format(prices.stretch)}  `,
    `**Payment schedule:** ${prices.paymentPlan}  `,
    "",
    "## Scope",
    `- Estimated effort: ${input.hours} hours at ${currency.format(input.rate)}/hr`,
    `- Revision rounds included: ${input.revisions}`,
    `- Stakeholder profile: ${input.stakeholders}`,
    "",
    "### Included deliverables",
    deliverableList,
    "",
    "## Commercial terms",
    `- ${rushLine}`,
    "- Any work outside the approved deliverables will be quoted as a change request.",
    "- Delays caused by missing client feedback may shift delivery dates.",
    "",
    "## Risk notes",
    `- Pricing risk score: **${riskScore}/10**`,
    `- Budget clarity: ${input.budgetConfidence}`,
    `- Source notes: ${input.notes.trim() || "No additional client notes provided."}`,
    "",
    `_Generated with ScopeMint on ${new Date().toLocaleDateString()}_`,
  ]
    .filter((line) => line !== null && line !== undefined)
    .join("\n");
}

function buildProposal(input, prices, riskScore) {
  const deliverableList = input.deliverables.length
    ? input.deliverables.map(titleize).join(", ")
    : "(none specified)";
  const rushLine =
    input.timeline === "rush"
      ? "A rush delivery premium is included to protect focus and availability."
      : "The proposed timeline assumes standard turnaround and consolidated feedback.";

  const headerLines = [];
  if (input.clientName) headerLines.push(`Prepared for: ${input.clientName}`);
  if (input.projectName) {
    headerLines.push(`Project name: ${input.projectName}`);
  }
  headerLines.push(`Engagement type: ${titleize(input.projectType)}`);
  headerLines.push(`Recommended investment: ${currency.format(prices.recommended)}`);
  headerLines.push(`Payment schedule: ${prices.paymentPlan}`);

  return `${headerLines.join("\n")}

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
  if (!target) return;
  target.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function formatPlanPrice(amount, billing) {
  return `${planCurrency.format(amount)}/${billing === "monthly" ? "month" : "month billed yearly"}`;
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
  if (input.currency && input.currency !== activeCurrency) {
    activeCurrency = input.currency;
    currency = buildCurrencyFormatter(activeCurrency);
  }
  const prices = computeQuote(input);
  document.querySelector("#floorPrice").textContent = currency.format(prices.floor);
  document.querySelector("#recommendedPrice").textContent = currency.format(prices.recommended);
  document.querySelector("#stretchPrice").textContent = currency.format(prices.stretch);
  document.querySelector("#riskScore").textContent = `${prices.riskScore}/10`;
  if (riskMeterFill) {
    riskMeterFill.style.width = `${Math.min(100, (prices.riskScore / 10) * 100)}%`;
    riskMeterFill.dataset.level =
      prices.riskScore >= 7 ? "high" : prices.riskScore >= 4 ? "medium" : "low";
  }
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
    clientName: document.querySelector("#clientName")?.value.trim() || "",
    projectName: document.querySelector("#projectName")?.value.trim() || "",
    projectType: document.querySelector("#projectType").value,
    budgetConfidence: document.querySelector("#budgetConfidence").value,
    hours: Number(document.querySelector("#hours").value || 0),
    rate: Number(document.querySelector("#rate").value || 0),
    currency: document.querySelector("#currency")?.value || "USD",
    timeline: document.querySelector("#timeline").value,
    revisions: document.querySelector("#revisions").value,
    stakeholders: document.querySelector("#stakeholders").value,
    deliverables: getSelectedDeliverables(),
    notes: document.querySelector("#notes").value,
  };
}

function writeForm(input) {
  const clientNameField = document.querySelector("#clientName");
  if (clientNameField) clientNameField.value = input.clientName || "";
  const projectNameField = document.querySelector("#projectName");
  if (projectNameField) projectNameField.value = input.projectName || "";
  document.querySelector("#projectType").value = input.projectType;
  document.querySelector("#budgetConfidence").value = input.budgetConfidence;
  document.querySelector("#hours").value = input.hours;
  document.querySelector("#rate").value = input.rate;
  const currencySelect = document.querySelector("#currency");
  if (currencySelect && input.currency) {
    currencySelect.value = input.currency;
  }
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
    priceNode.textContent = planCurrency.format(pricingCatalog[plan][billing]);
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
  const annualSavings = planCurrency.format((monthlyPrice - yearlyPrice) * 12);

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
    showToast({
      type: "success",
      title: "Checkout link copied",
      message: "Share it with the buyer to start the trial.",
    });
  } catch {
    checkoutMessage.textContent = "Could not copy the checkout link in this browser.";
    checkoutMessage.classList.remove("is-success");
    showToast({
      type: "error",
      title: "Copy failed",
      message: "Your browser blocked clipboard access.",
    });
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

const defaultFormState = {
  clientName: "",
  projectName: "",
  projectType: "brand",
  budgetConfidence: "low",
  hours: 40,
  rate: 90,
  currency: "USD",
  timeline: "normal",
  revisions: "2",
  stakeholders: "small",
  deliverables: ["strategy", "design", "handoff"],
  notes: "",
};

scopeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readForm();
  persistState(input);
  updateOutput(input);
});

document.addEventListener("keydown", (event) => {
  const isSubmitCombo = (event.metaKey || event.ctrlKey) && event.key === "Enter";
  if (isSubmitCombo) {
    event.preventDefault();
    const submitButton = scopeForm.querySelector(".submit-button");
    if (submitButton) {
      submitButton.classList.add("is-flash");
      window.setTimeout(() => submitButton.classList.remove("is-flash"), 600);
    }
    if (typeof scopeForm.requestSubmit === "function") {
      scopeForm.requestSubmit();
    } else {
      scopeForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
    document.querySelector("#quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

const resetButton = document.querySelector("#resetForm");
if (resetButton) {
  resetButton.addEventListener("click", () => {
    writeForm(defaultFormState);
    localStorage.removeItem(storageKey);
    activeCurrency = defaultFormState.currency;
    currency = buildCurrencyFormatter(activeCurrency);
    updateOutput(readForm());
    resetButton.classList.add("is-flash");
    window.setTimeout(() => resetButton.classList.remove("is-flash"), 600);
    showToast({
      type: "info",
      title: "Form cleared",
      message: "Defaults restored. Build a new quote when you are ready.",
    });
  });
}

const currencySelect = document.querySelector("#currency");
if (currencySelect) {
  currencySelect.addEventListener("change", () => {
    const input = readForm();
    persistState(input);
    updateOutput(input);
  });
}

copyProposalButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(proposalText.textContent);
    copyProposalButton.textContent = "Copied";
    showToast({
      type: "success",
      title: "Proposal copied",
      message: "Paste it into email, Notion, or your CRM.",
    });
    window.setTimeout(() => {
      copyProposalButton.textContent = "Copy text";
    }, 1200);
  } catch {
    copyProposalButton.textContent = "Copy failed";
    showToast({
      type: "error",
      title: "Copy failed",
      message: "Your browser blocked clipboard access.",
    });
    window.setTimeout(() => {
      copyProposalButton.textContent = "Copy text";
    }, 1200);
  }
});

const downloadProposalButton = document.querySelector("#downloadProposal");
if (downloadProposalButton) {
  downloadProposalButton.addEventListener("click", () => {
    const input = readForm();
    const prices = computeQuote(input);
    const markdown = buildMarkdownProposal(input, prices, prices.riskScore);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const slugSource = input.projectName || input.clientName || `${input.projectType}-quote`;
    const slug = slugSource
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "scopemint-proposal";
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slug}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast({
      type: "success",
      title: "Markdown downloaded",
      message: `${slug}.md saved to your downloads.`,
    });
  });
}

const printProposalButton = document.querySelector("#printProposal");
if (printProposalButton) {
  printProposalButton.addEventListener("click", () => {
    document.body.classList.add("is-printing");
    const cleanup = () => {
      document.body.classList.remove("is-printing");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.setTimeout(() => {
      window.print();
    }, 50);
  });
}

function encodeQuoteToHash(input) {
  try {
    const json = JSON.stringify(input);
    const utf8 = new TextEncoder().encode(json);
    let binary = "";
    utf8.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return "";
  }
}

function decodeQuoteFromHash(hash) {
  if (!hash) return null;
  try {
    let normalized = hash.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) normalized += "=";
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function buildShareUrl(input) {
  const url = new URL(window.location.href);
  url.hash = `q=${encodeQuoteToHash(input)}`;
  return url.toString();
}

const shareQuoteButton = document.querySelector("#shareQuote");
if (shareQuoteButton) {
  shareQuoteButton.addEventListener("click", async () => {
    const input = readForm();
    const shareUrl = buildShareUrl(input);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast({
        type: "success",
        title: "Share link copied",
        message: "Anyone who opens it sees this quote pre-filled.",
      });
    } catch {
      window.prompt("Copy this shareable quote URL:", shareUrl);
      showToast({
        type: "info",
        title: "Share URL ready",
        message: "Copy it from the prompt to share.",
      });
    }
  });
}

const historyStorageKey = "scopemint-history";
const historyListEl = document.querySelector("#historyList");
const historyEmptyEl = document.querySelector("#historyEmpty");
const historyCountEl = document.querySelector("#historyCount");
const saveQuoteButton = document.querySelector("#saveQuote");
const clearHistoryButton = document.querySelector("#clearHistory");

function loadHistory() {
  try {
    const raw = localStorage.getItem(historyStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(historyStorageKey, JSON.stringify(entries.slice(0, 25)));
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function summarizeEntry(entry) {
  const projectLabel = entry.input.projectName
    || `${titleize(entry.input.projectType)} engagement`;
  const clientLabel = entry.input.clientName || "Untitled client";
  const formatter = buildCurrencyFormatter(entry.input.currency || "USD");
  return {
    title: `${clientLabel} · ${projectLabel}`,
    price: formatter.format(entry.prices.recommended),
    risk: `Risk ${entry.prices.riskScore}/10`,
    saved: new Date(entry.savedAt).toLocaleString(),
  };
}

function renderHistory() {
  if (!historyListEl) return;
  const entries = loadHistory();
  historyListEl.innerHTML = "";

  if (historyCountEl) {
    historyCountEl.textContent = `${entries.length} saved`;
  }

  if (entries.length === 0) {
    historyListEl.classList.add("is-hidden");
    historyEmptyEl?.classList.remove("is-hidden");
    clearHistoryButton?.classList.add("is-hidden");
    return;
  }

  historyListEl.classList.remove("is-hidden");
  historyEmptyEl?.classList.add("is-hidden");
  clearHistoryButton?.classList.remove("is-hidden");

  for (const entry of entries) {
    const summary = summarizeEntry(entry);
    const li = document.createElement("li");
    li.className = "history-item";
    li.dataset.id = entry.id;
    li.innerHTML = `
      <div class="history-info">
        <p class="history-title">${escapeHtml(summary.title)}</p>
        <div class="history-meta-row">
          <span class="history-price">${escapeHtml(summary.price)}</span>
          <span>${escapeHtml(summary.risk)}</span>
          <span>${escapeHtml(summary.saved)}</span>
        </div>
      </div>
      <div class="history-actions">
        <button class="icon-button" data-action="restore" type="button" title="Restore quote" aria-label="Restore quote">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-button is-danger" data-action="delete" type="button" title="Delete from history" aria-label="Delete from history">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 7h14M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M7 7l1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    `;
    historyListEl.appendChild(li);
  }
}

function restoreHistoryEntry(id) {
  const entries = loadHistory();
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;
  const merged = { ...defaultFormState, ...entry.input };
  if (!Array.isArray(merged.deliverables)) merged.deliverables = [];
  writeForm(merged);
  activeCurrency = merged.currency || "USD";
  currency = buildCurrencyFormatter(activeCurrency);
  persistState(merged);
  updateOutput(readForm());
  document.querySelector("#quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast({
    type: "success",
    title: "Quote restored",
    message: `${entry.input.clientName || "Quote"} loaded into the form.`,
  });
}

function deleteHistoryEntry(id) {
  const entries = loadHistory().filter((item) => item.id !== id);
  saveHistory(entries);
  renderHistory();
  showToast({
    type: "info",
    title: "Quote removed",
    message: "Removed from your saved history.",
  });
}

if (historyListEl) {
  historyListEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const item = button.closest(".history-item");
    if (!item) return;
    const id = item.dataset.id;
    if (button.dataset.action === "restore") restoreHistoryEntry(id);
    if (button.dataset.action === "delete") deleteHistoryEntry(id);
  });
}

if (saveQuoteButton) {
  saveQuoteButton.addEventListener("click", () => {
    const input = readForm();
    const prices = computeQuote(input);
    const entry = {
      id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
      input,
      prices,
    };
    const entries = [entry, ...loadHistory()];
    saveHistory(entries);
    renderHistory();
    showToast({
      type: "success",
      title: "Quote saved",
      message: `Stored ${input.clientName || "this quote"} in your history.`,
    });
  });
}

if (clearHistoryButton) {
  clearHistoryButton.addEventListener("click", () => {
    if (!loadHistory().length) return;
    saveHistory([]);
    renderHistory();
    showToast({
      type: "info",
      title: "History cleared",
      message: "All saved quotes were removed from this browser.",
    });
  });
}

renderHistory();

function applyHashStateIfPresent() {
  const hash = window.location.hash || "";
  const match = hash.match(/q=([^&]+)/);
  if (!match) return false;
  const decoded = decodeQuoteFromHash(decodeURIComponent(match[1]));
  if (!decoded || typeof decoded !== "object") return false;
  const merged = { ...defaultFormState, ...decoded };
  if (!Array.isArray(merged.deliverables)) merged.deliverables = [];
  writeForm(merged);
  activeCurrency = merged.currency || "USD";
  currency = buildCurrencyFormatter(activeCurrency);
  persistState(merged);
  updateOutput(readForm());
  showToast({
    type: "info",
    title: "Shared quote loaded",
    message: "Imported from the link you opened.",
  });
  return true;
}

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
  if (!savedState.currency) savedState.currency = "USD";
  if (!Array.isArray(savedState.deliverables)) savedState.deliverables = [];
  writeForm(savedState);
  activeCurrency = savedState.currency;
  currency = buildCurrencyFormatter(activeCurrency);
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

applyHashStateIfPresent();

window.addEventListener("hashchange", () => {
  applyHashStateIfPresent();
});

if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}
