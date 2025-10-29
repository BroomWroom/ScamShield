
function getParam(name) {
    const params = new URLSearchParams(location.search);
    return params.get(name) || "";
}

const origUrl = getParam("url");
const reason = getParam("reason");

document.getElementById("orig").textContent = origUrl;
document.getElementById("reason").textContent = reason ? `Reason: ${reason}` : "";

document.getElementById("goBack").addEventListener("click", () => {

    history.length > 1 ? history.back() : window.close();
});

document.getElementById("openAnyway").addEventListener("click", () => {
    if (!origUrl) return;

    window.location.href = origUrl;
});

document.getElementById("whitelist").addEventListener("click", async () => {
    try {
        const host = new URL(origUrl).hostname;
        const items = await chrome.storage.sync.get({ whitelist: [] });
        const whitelist = items.whitelist || [];
        if (!whitelist.includes(host)) {
            whitelist.push(host);
            await chrome.storage.sync.set({ whitelist });
            alert(`Whitelisted ${host}. The page will now open.`);
        } else {
            alert(`${host} is already whitelisted.`);
        }
        window.location.href = origUrl;
    } catch (e) {
        console.error(e);
        alert("Could not whitelist (invalid URL).");
    }
});
