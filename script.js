(function () {
  "use strict";

  const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0, useGrouping: "always" });
  const eur2 = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" });
  const pct = new Intl.NumberFormat("it-IT", { style: "percent", maximumFractionDigits: 1 });

  // Each parameter has a slider and a number box kept in sync.
  // The number box accepts a wider range than the slider.
  const params = {
    amount: { value: 200000, min: 1000, max: 2000000 },
    years: { value: 25, min: 1, max: 40 },
    rate: { value: 3.5, min: 0, max: 20 },
  };

  const $ = (id) => document.getElementById(id);

  function setSliderFill(range) {
    const min = Number(range.min);
    const max = Number(range.max);
    const v = Math.min(max, Math.max(min, Number(range.value)));
    range.style.setProperty("--pct", ((v - min) / (max - min)) * 100 + "%");
  }

  function bind(key) {
    const p = params[key];
    const range = $(key + "-range");
    const number = $(key + "-number");
    const wrap = number.parentElement;

    range.value = p.value;
    number.value = p.value;
    setSliderFill(range);

    range.addEventListener("input", () => {
      p.value = Number(range.value);
      number.value = p.value;
      wrap.classList.remove("invalid");
      setSliderFill(range);
      update();
    });

    number.addEventListener("input", () => {
      const raw = number.value.replace(",", ".");
      const v = parseFloat(raw);
      if (raw === "" || !Number.isFinite(v) || v < p.min || v > p.max) {
        wrap.classList.add("invalid");
        return;
      }
      wrap.classList.remove("invalid");
      p.value = key === "years" ? Math.round(v) : v;
      range.value = p.value;
      setSliderFill(range);
      update();
    });

    // On leaving the box, snap invalid input back into the allowed range.
    number.addEventListener("change", () => {
      let v = parseFloat(number.value.replace(",", "."));
      if (!Number.isFinite(v)) v = p.value;
      v = Math.min(p.max, Math.max(p.min, v));
      if (key === "years") v = Math.round(v);
      p.value = v;
      number.value = v;
      range.value = v;
      wrap.classList.remove("invalid");
      setSliderFill(range);
      update();
    });
  }

  function compute(principal, years, annualRate) {
    const n = Math.round(years * 12);
    const r = annualRate / 100 / 12;
    const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

    // Yearly amortization schedule
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

  function update() {
    const principal = params.amount.value;
    const years = params.years.value;
    const rate = params.rate.value;
    const res = compute(principal, years, rate);

    $("total-interest").textContent = eur.format(res.totalInterest);
    $("monthly").textContent = eur2.format(res.monthly);
    $("principal").textContent = eur.format(principal);
    $("total-paid").textContent = eur.format(res.totalPaid);
    $("n-payments").textContent = res.n.toLocaleString("it-IT");
    $("interest-ratio").textContent = pct.format(res.totalInterest / principal);

    const pPrincipal = principal / res.totalPaid;
    const pInterest = 1 - pPrincipal;
    $("seg-principal").style.width = pPrincipal * 100 + "%";
    $("seg-interest").style.width = pInterest * 100 + "%";
    $("pct-principal").textContent = pct.format(pPrincipal);
    $("pct-interest").textContent = pct.format(pInterest);
    $("split-bar").setAttribute(
      "aria-label",
      "Capitale " + pct.format(pPrincipal) + ", interessi " + pct.format(pInterest)
    );

    $("schedule-body").innerHTML = res.schedule
      .map(
        (row) =>
          "<tr><td>" + row.year + "</td><td>" + eur.format(row.principal) + "</td><td>" +
          eur.format(row.interest) + "</td><td>" + eur.format(row.balance) + "</td></tr>"
      )
      .join("");
  }

  Object.keys(params).forEach(bind);
  update();
})();
