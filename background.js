

const DEFAULT_BLOCKED_DOMAINS = [
    "malicious.example", "phishingsite.test", "http://localhost/sketchup/templates/phish.html", "http://localhost/sketchup/templates/login.html"
];

const DEFAULT_KEYWORDS = [
    "confirm", "secure", "verify", "update", "bank", "paypal", "login"
];

const DEFAULT_SUSPICIOUS_TLDS = [
    "tk", "ml", "ga", "cf", "gq"
];

async function getSettings() {
    return new Promise(resolve => {
        chrome.storage.sync.get({
            enabled: true,
            blockedDomains: DEFAULT_BLOCKED_DOMAINS,
            keywords: DEFAULT_KEYWORDS,
            whitelist: [],
            suspiciousTLDs: DEFAULT_SUSPICIOUS_TLDS
        }, items => resolve(items));
    });
}

function domainFromUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname;
    } catch (e) {
        return "";
    }
}

function looksLikeIp(hostname) {

    return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function isPunycode(hostname) {
    return hostname.startsWith("xn--");
}

function containsKeyword(url, keywords) {
    const lower = url.toLowerCase();
    return keywords.some(k => k && lower.includes(k.toLowerCase()));
}

function hasSuspiciousTLD(hostname, suspiciousTLDs) {
    const parts = hostname.split(".");
    const tld = parts[parts.length - 1].toLowerCase();
    return suspiciousTLDs.includes(tld);
}

chrome.runtime.onInstalled.addListener(async () => {
    const settings = await getSettings();

    console.log("PhishBlocker installed or updated. Settings loaded.", settings);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete" || !tab.url) return;

    const { enabled, blockedDomains, keywords, whitelist, suspiciousTLDs } = await getSettings();
    if (!enabled) return;

    const url = tab.url;
    const host = domainFromUrl(url);
    if (!host) return;

    if (url.startsWith("chrome://") || url.startsWith("chrome-extension://")) return;

    if (whitelist.some(w => host === w || host.endsWith("." + w))) return;

    let matchedReason = null;

    if (blockedDomains.some(d => host === d || host.endsWith("." + d))) {
        matchedReason = `Blocked domain match: ${host}`;
    }

    if (!matchedReason && looksLikeIp(host)) matchedReason = "Host is raw IP address";
    if (!matchedReason && isPunycode(host)) matchedReason = "Punycode domain (possible homograph)";
    if (!matchedReason && hasSuspiciousTLD(host, suspiciousTLDs)) matchedReason = "Suspicious TLD";

    if (!matchedReason && containsKeyword(url, keywords)) matchedReason = "Suspicious keyword in URL";

    const commonBrands = ["paypal", "google", "facebook", "amazon", "apple", "microsoft", "bank"];
    if (!matchedReason) {
        for (const brand of commonBrands) {
            if (url.toLowerCase().includes(brand) && !host.includes(brand)) {
                matchedReason = `Possible brand impersonation: ${brand}`;
                break;
            }
        }
    }

    if (matchedReason) {
        console.log("PhishBlocker matched:", matchedReason, "URL:", url);

        const warningUrl = chrome.runtime.getURL("warning.html") + `?url=${encodeURIComponent(url)}&reason=${encodeURIComponent(matchedReason)}`;
        try {
            await chrome.tabs.update(tabId, { url: warningUrl });
        } catch (e) {
            console.error("Failed to redirect to warning page", e);
        }
    }
});
