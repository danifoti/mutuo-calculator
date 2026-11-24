(function () {
  "use strict";

  const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const eur2 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
  const pctFmt = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 1 });

  // Limits accepted by the number boxes (sliders may have a narrower range).
  const LIMITS = {
    house: { min: 50000, max: 5000000 },
    pct: { min: 10, max: 100 },
    amount: { min: 10000, max: 500000 },
    years: { min: 1, max: 40 },
    rate: { min: 0, max: 20 },
  };

  // `targetPct` is the share the user asked for. The loan amount follows it when
  // the house value changes, but is capped at LIMITS.amount.max and at the house value.
  const state = { house: 250000, targetPct: 80, amount: 200000, years: 25, rate: 3.5 };

  const $ = (id) => document.getElementById(id);
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const round1 = (v) => Math.round(v * 10) / 10;

  const maxAmount = () => Math.min(LIMITS.amount.max, state.house);
  const actualPct = () => (state.amount / state.house) * 100;

  function amountFromPct() {
    state.amount = Math.round(clamp((state.house * state.targetPct) / 100, LIMITS.amount.min, maxAmount()));
  }

  const setters = {
    house(v) { state.house = v; amountFromPct(); },
    pct(v) { state.targetPct = v; amountFromPct(); },
    amount(v) {
      state.amount = Math.round(clamp(v, LIMITS.amount.min, maxAmount()));
      state.targetPct = actualPct();
    },
    years(v) { state.years = Math.round(v); },
    rate(v) { state.rate = v; },
  };

  const getters = {
    house: () => state.house,
    pct: () => round1(actualPct()),
    amount: () => state.amount,
    years: () => state.years,
    rate: () => state.rate,
  };

  const keys = Object.keys(LIMITS);
  const controls = {};

  function setSliderFill(range) {
    const min = Number(range.min);
    const max = Number(range.max);
    const v = clamp(Number(range.value), min, max);
    range.style.setProperty("--pct", ((v - min) / (max - min)) * 100 + "%");
  }

  const parse = (s) => parseFloat(String(s).replace(",", "."));

  function bind(key) {
    const range = $(key + "-range");
    const number = $(key + "-number");
    const wrap = number.parentElement;
    controls[key] = { range, number, wrap };

    range.addEventListener("input", () => {
      setters[key](Number(range.value));
      render();
    });

    // Live update while typing, only once the value is inside the allowed range.
    number.addEventListener("input", () => {
      const v = parse(number.value);
      const lim = LIMITS[key];
      if (!Number.isFinite(v) || v < lim.min || v > lim.max) {
        wrap.classList.add("invalid");
        return;
      }
      wrap.classList.remove("invalid");
      setters[key](v);
      render(number);
    });

    // On leaving the box, snap the value back into range and show the real value.
    number.addEventListener("change", () => {
      let v = parse(number.value);
      if (!Number.isFinite(v)) v = getters[key]();
      setters[key](clamp(v, LIMITS[key].min, LIMITS[key].max));
      render();
    });
  }

  function compute(principal, years, annualRate) {
    const n = Math.round(years * 12);
    const r = annualRate / 100 / 12;
    const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

    const schedule = [];
    let balance = principal;
    for (let y = 1; y <= years; y++) {
      let yPrincipal = 0;
      let yInterest = 0;
      for (let m = 0; m < 12; m++) {
        const interest = balance * r;
        const princ = monthly - interest;
        yInterest += interest;
        yPrincipal += princ;
        balance -= princ;
      }
      schedule.push({ year: y, principal: yPrincipal, interest: yInterest, balance: Math.max(0, balance) });
    }

    const totalPaid = monthly * n;
    return { n, monthly, totalPaid, totalInterest: totalPaid - principal, schedule };
  }

  function renderInputs(skip) {
    keys.forEach((key) => {
      const { range, number, wrap } = controls[key];
      const v = getters[key]();
      range.value = v;
      setSliderFill(range);
      if (number !== skip) {
        number.value = v;
        wrap.classList.remove("invalid");
      }
    });

    const pctNow = actualPct();
    document.querySelectorAll(".preset").forEach((btn) => {
      const p = Number(btn.dataset.pct);
      const wanted = (state.house * p) / 100;
      btn.querySelector("[data-amount]").textContent = eur.format(wanted);
      btn.disabled = wanted > LIMITS.amount.max;
      btn.title = btn.disabled ? "Supera l'importo massimo di " + eur.format(LIMITS.amount.max) : "";
      const active = Math.abs(pctNow - p) < 0.05;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    const hint = $("pct-hint");
    const wantedAmount = (state.house * state.targetPct) / 100;
    if (wantedAmount > LIMITS.amount.max + 0.5) {
      hint.textContent =
        "Importo limitato al massimo di " + eur.format(LIMITS.amount.max) +
        " (" + pctFmt.format(state.amount / state.house) + " del valore della casa).";
      hint.hidden = false;
    } else if (wantedAmount < LIMITS.amount.min - 0.5) {
      hint.textContent = "Importo minimo del mutuo: " + eur.format(LIMITS.amount.min) + ".";
      hint.hidden = false;
    } else {
      hint.hidden = true;
    }
  }

  function renderResults() {
    const principal = state.amount;
    const res = compute(principal, state.years, state.rate);
    const downPayment = state.house - principal;

    $("monthly").textContent = eur2.format(res.monthly);
    $("total-interest").textContent = eur.format(res.totalInterest);
    $("principal").textContent = eur.format(principal);
    $("down-payment").textContent = eur.format(downPayment);
    $("total-paid").textContent = eur.format(res.totalPaid);
    $("total-cost").textContent = eur.format(downPayment + res.totalPaid);
    $("n-payments").textContent = res.n.toLocaleString("it-IT");
    $("interest-ratio").textContent = pctFmt.format(res.totalInterest / principal);

    const pPrincipal = principal / res.totalPaid;
    const pInterest = 1 - pPrincipal;
    $("seg-principal").style.width = pPrincipal * 100 + "%";
    $("seg-interest").style.width = pInterest * 100 + "%";
    $("pct-principal").textContent = pctFmt.format(pPrincipal);
    $("pct-interest").textContent = pctFmt.format(pInterest);
    $("split-bar").setAttribute(
      "aria-label",
      "Capitale " + pctFmt.format(pPrincipal) + ", interessi " + pctFmt.format(pInterest)
    );

    $("schedule-body").innerHTML = res.schedule
      .map(
        (row) =>
          "<tr><td>" + row.year + "</td><td>" + eur.format(row.principal) + "</td><td>" +
          eur.format(row.interest) + "</td><td>" + eur.format(row.balance) + "</td></tr>"
      )
      .join("");
  }

  function render(skip) {
    renderInputs(skip);
    renderResults();
  }

  keys.forEach(bind);

  document.querySelectorAll(".preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      setters.pct(Number(btn.dataset.pct));
      render();
    });
  });

  render();
})();
