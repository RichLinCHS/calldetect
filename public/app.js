const storageKey = "caller-lookup.saved.v1";
const get = id => document.getElementById(id);
const valid = number => typeof number === "string" && /^\+[1-9]\d{6,14}$/.test(number);

let numbers = [];
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (Array.isArray(stored)) numbers = [...new Set(stored.filter(valid))];
} catch {
  get("status").textContent = "Saved numbers could not be loaded in this browser.";
}

let selected;
let view = 0;

function normalize(value) {
  const input = value.trim();
  if (!/^\+?[\d ().-]+$/.test(input)) return null;
  let digits = input.replace(/\D/g, "");
  if (!input.startsWith("+")) {
    if (digits.length === 10) digits = "1" + digits;
    if (!/^1\d{10}$/.test(digits)) return null;
  }
  const number = "+" + digits;
  return valid(number) ? number : null;
}

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(numbers));
    get("status").textContent = "";
  } catch {
    get("status").textContent = "Browser storage is unavailable. Changes last until this tab reloads.";
  }
}

function show(number) {
  selected = number;
  view += 1;
  get("details").hidden = !number;
  get("details-heading").textContent = number ?? "";
  get("result").textContent = "";
  get("source").hidden = true;
  get("verify").disabled = false;
  render();
  if (number) get("details-heading").focus();
}

function render() {
  get("empty").hidden = numbers.length > 0;
  get("numbers").replaceChildren(...numbers.map(number => {
    const row = document.createElement("li");
    const open = document.createElement("button");
    open.className = "secondary";
    open.textContent = number;
    if (number === selected) open.setAttribute("aria-current", "true");
    open.onclick = () => show(number);

    const remove = document.createElement("button");
    remove.className = "secondary";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove " + number);
    remove.onclick = () => {
      numbers = numbers.filter(entry => entry !== number);
      persist();
      if (selected === number) show(null);
      else render();
      get("number").focus();
    };

    row.append(open, remove);
    return row;
  }));
}

get("save").onsubmit = event => {
  event.preventDefault();
  const number = normalize(get("number").value);
  if (!number) {
    get("status").textContent = "Enter a 10-digit North American number or include + and the country code.";
    return;
  }
  numbers = [number, ...numbers.filter(entry => entry !== number)];
  persist();
  get("number").value = "";
  show(number);
};

get("copy").onclick = async () => {
  const current = view;
  const prompt = "Research public business listings and publicly reported spam for displayed caller ID " +
    selected + ". Search for exact matches, link each source, and say when evidence is weak or absent. " +
    "Do not infer a private person's identity or location. Distinguish the number's assigned region from the caller's actual origin.";
  try {
    await navigator.clipboard.writeText(prompt);
    if (current === view) get("result").textContent = "Prompt copied. Open ChatGPT and paste it.";
  } catch {
    if (current === view) get("result").textContent = prompt;
  }
};

get("verify").onclick = async () => {
  const current = view;
  get("verify").disabled = true;
  get("source").hidden = true;
  get("result").textContent = "Checking number…";

  try {
    const response = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: selected })
    });
    const data = await response.json();
    if (current !== view) return;
    if (!response.ok) {
      get("result").textContent = data.message;
      return;
    }
    const country = data.country ? new Intl.DisplayNames(["en"], { type: "region" }).of(data.country) : null;
    get("result").textContent = data.valid
      ? (country ? "Numbering country or region: " + country + "." : "Number format validated.")
      : "The lookup provider could not validate this number.";
    get("source").href = data.source;
    get("source").hidden = false;
  } catch {
    if (current === view) get("result").textContent = "Number validation is unavailable.";
  } finally {
    if (current === view) get("verify").disabled = false;
  }
};

render();
