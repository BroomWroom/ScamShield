
const DEFAULT_BLOCKED = ["malicious.example", "phishingsite.test"];
const DEFAULT_KEYWORDS = ["login", "confirm", "secure", "verify", "account", "update", "bank", "paypal"];
const DEFAULT_SUSP_TLDS = ["tk", "ml", "ga", "cf", "gq"];

function parseTextarea(t) {
    return t.split("\n").map(s => s.trim()).filter(Boolean);
}

function joinLines(arr) {
    return (arr || []).join("\n");
}

async function restore() {
    const items = await chrome.storage.sync.get({
        blockedDomains: DEFAULT_BLOCKED,
        keywords: DEFAULT_KEYWORDS,
        whitelist: [],
        suspiciousTLDs: DEFAULT_SUSP_TLDS
    });

    document.getElementById("blockedDomains").value = joinLines(items.blockedDomains);
    document.getElementById("keywords").value = joinLines(items.keywords);
    document.getElementById("whitelist").value = joinLines(items.whitelist);
    document.getElementById("suspiciousTLDs").value = joinLines(items.suspiciousTLDs);
}

document.getElementById("save").addEventListener("click", async () => {
    const blockedDomains = parseTextarea(document.getElementById("blockedDomains").value);
    const keywords = parseTextarea(document.getElementById("keywords").value);
    const whitelist = parseTextarea(document.getElementById("whitelist").value);
    const suspiciousTLDs = parseTextarea(document.getElementById("suspiciousTLDs").value);

    await chrome.storage.sync.set({ blockedDomains, keywords, whitelist, suspiciousTLDs });
    const status = document.getElementById("status");
    status.textContent = "Saved.";
    setTimeout(() => status.textContent = "", 2000);
});

document.getElementById("reset").addEventListener("click", async () => {
    await chrome.storage.sync.set({
        blockedDomains: DEFAULT_BLOCKED,
        keywords: DEFAULT_KEYWORDS,
        whitelist: [],
        suspiciousTLDs: DEFAULT_SUSP_TLDS
    });
    restore();
    document.getElementById("status").textContent = "Reset to defaults.";
    setTimeout(() => document.getElementById("status").textContent = "", 2000);
});

restore();
