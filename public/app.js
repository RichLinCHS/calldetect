const storageKey = "caller-lookup.saved.v1";
const get = id => document.getElementById(id);
const valid = number => typeof number === "string" && /^\+[1-9]\d{6,14}$/.test(number);

const chinese = {
  "Caller Lookup": "来电查询",
  "Save an unfamiliar number and check what’s associated with it.": "保存陌生号码并查询相关信息。",
  "Add a caller": "添加来电号码",
  "Phone number": "电话号码",
  "Paste": "粘贴",
  "Save & open": "保存并打开",
  "Copy a number from Phone Recents. Include its country code for numbers outside North America.": "从电话应用的最近通话中复制号码。北美以外的号码请加上国家或地区代码。",
  "Saved numbers": "已保存的号码",
  "Your saved numbers will appear here.": "已保存的号码会显示在这里。",
  "Caller ID can be spoofed. Lookup results describe the displayed number.": "来电显示可能被伪造。查询结果对应屏幕上显示的号码。",
  "Search Google": "用 Google 搜索",
  "Check number": "验证号码",
  "Copy AI lookup prompt": "复制 AI 查询提示词",
  "Open ChatGPT": "打开 ChatGPT",
  "Search Google opens public results for this number in a new tab. Check number validates its format with Twilio.": "Google 搜索会在新标签页打开公开结果。验证号码使用 Twilio 检查号码格式。",
  "Twilio Lookup documentation": "Twilio 号码查询文档",
  "Language": "语言",
  "Appearance": "外观",
  "System": "跟随系统",
  "Light": "浅色",
  "Dark": "深色",
  "Saved numbers could not be loaded in this browser.": "无法加载已保存的号码。",
  "Browser storage is unavailable. Changes last until this tab reloads.": "浏览器存储不可用。重新加载后，当前更改将丢失。",
  "Remove": "删除",
  "Copy a phone number from the Phone app, then tap Paste again.": "请先从电话应用复制号码，再点按“粘贴”。",
  "Number pasted. Tap Save & open.": "号码已粘贴。点按“保存并打开”。",
  "Touch and hold the phone number field, then choose Paste.": "长按电话号码输入框，然后选择“粘贴”。",
  "Enter a 10-digit North American number or include + and the country code.": "请输入 10 位北美电话号码，或输入带有 + 和国家或地区代码的号码。",
  "Prompt copied. Open ChatGPT and paste it.": "提示词已复制。打开 ChatGPT 后粘贴。",
  "Checking number…": "正在验证号码…",
  "Number format validated.": "号码格式已验证。",
  "The lookup provider could not validate this number.": "查询服务无法验证此号码。",
  "No caller identity information available. Use caution with unfamiliar numbers.": "暂无来电者身份信息。请谨慎对待陌生号码。",
  "Number validation is unavailable.": "暂时无法验证号码。",
  "Live number validation has not been configured.": "尚未配置实时号码验证。",
  "The lookup provider is unavailable. Try again later.": "查询服务暂不可用，请稍后重试。",
  "Enter a number with a country code.": "请输入包含国家或地区代码的号码。"
};

function readPreference(name) {
  try { return localStorage.getItem("caller-lookup." + name); } catch { return null; }
}

function savePreference(name, value) {
  try { localStorage.setItem("caller-lookup." + name, value); } catch { /* Keep the in-page selection. */ }
}

let language = readPreference("language") === "zh-CN" ? "zh-CN" : "en";
const savedTheme = readPreference("theme");
let theme = ["light", "dark"].includes(savedTheme) ? savedTheme : "system";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const feedback = new Map();

function translate(text) {
  return language === "zh-CN" && Object.hasOwn(chinese, text) ? chinese[text] : text;
}

function setFeedback(id, text) {
  feedback.set(id, text);
  get(id).textContent = translate(typeof text === "function" ? text() : text);
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.title = translate("Caller Lookup");
  get("language").value = language;
  document.querySelectorAll("[data-translate]").forEach(element => {
    element.textContent = translate(element.dataset.translate);
  });
  for (const [id, text] of feedback) setFeedback(id, text);
  render();
}

function applyTheme() {
  document.documentElement.dataset.theme = theme === "system"
    ? (systemTheme.matches ? "dark" : "light") : theme;
  get("theme").value = theme;
}

let numbers = [];
try {
  const stored = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
  if (Array.isArray(stored)) numbers = [...new Set(stored.filter(valid))];
} catch {
  setFeedback("status", "Saved numbers could not be loaded in this browser.");
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
    setFeedback("status", "");
  } catch {
    setFeedback("status", "Browser storage is unavailable. Changes last until this tab reloads.");
  }
}

function show(number) {
  selected = number;
  view += 1;
  get("details").hidden = !number;
  get("details-heading").textContent = number ?? "";
  if (number) {
    const formats = ['"' + number + '"'];
    if (/^\+1\d{10}$/.test(number)) {
      formats.push('"' + number.slice(2, 5) + "-" + number.slice(5, 8) + "-" + number.slice(8) + '"');
    }
    get("google-search").href = "https://www.google.com/search?q=" + encodeURIComponent(formats.join(" OR "));
  } else {
    get("google-search").removeAttribute("href");
  }
  setFeedback("result", "");
  get("caller-status").hidden = true;
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
    remove.textContent = translate("Remove");
    remove.setAttribute("aria-label", translate("Remove") + " " + number);
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

get("paste").onclick = async () => {
  const input = get("number");
  try {
    const text = await navigator.clipboard.readText();
    const number = normalize(text);
    if (!number) {
      setFeedback("status", "Copy a phone number from the Phone app, then tap Paste again.");
      return;
    }
    input.value = number;
    setFeedback("status", "Number pasted. Tap Save & open.");
  } catch {
    input.focus();
    setFeedback("status", "Touch and hold the phone number field, then choose Paste.");
  }
};

get("save").onsubmit = event => {
  event.preventDefault();
  const number = normalize(get("number").value);
  if (!number) {
    setFeedback("status", "Enter a 10-digit North American number or include + and the country code.");
    return;
  }
  numbers = [number, ...numbers.filter(entry => entry !== number)];
  persist();
  get("number").value = "";
  show(number);
};

get("copy").onclick = async () => {
  const current = view;
  const prompt = (language === "zh-CN" ? "请用简体中文回答。 " : "") + "Research public business listings and publicly reported spam for displayed caller ID " +
    selected + ". Search for exact matches, link each source, and say when evidence is weak or absent. " +
    "Do not infer a private person's identity or location. Distinguish the number's assigned region from the caller's actual origin.";
  try {
    await navigator.clipboard.writeText(prompt);
    if (current === view) setFeedback("result", "Prompt copied. Open ChatGPT and paste it.");
  } catch {
    if (current === view) setFeedback("result", prompt);
  }
};

get("verify").onclick = async () => {
  const current = view;
  get("verify").disabled = true;
  get("caller-status").hidden = true;
  get("source").hidden = true;
  setFeedback("result", "Checking number…");

  try {
    const response = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: selected })
    });
    const data = await response.json();
    if (current !== view) return;
    if (!response.ok) {
      setFeedback("result", data.message);
      return;
    }
    const country = typeof data.country === "string" && /^[A-Z]{2}$/.test(data.country) ? data.country : null;
    setFeedback("result", () => {
      if (!data.valid) return "The lookup provider could not validate this number.";
      if (!country) return "Number format validated.";
      const name = new Intl.DisplayNames([language], { type: "region" }).of(country);
      return language === "zh-CN" ? "号码归属国家或地区：" + name + "。" : "Numbering country or region: " + name + ".";
    });
    setFeedback("caller-status", "No caller identity information available. Use caution with unfamiliar numbers.");
    get("caller-status").hidden = false;
    get("source").href = data.source;
    get("source").hidden = false;
  } catch {
    if (current === view) setFeedback("result", "Number validation is unavailable.");
  } finally {
    if (current === view) get("verify").disabled = false;
  }
};

get("language").onchange = event => {
  language = event.target.value;
  savePreference("language", language);
  applyLanguage();
};

get("theme").onchange = event => {
  theme = event.target.value;
  savePreference("theme", theme);
  applyTheme();
};

systemTheme.addEventListener("change", applyTheme);
applyTheme();
applyLanguage();
