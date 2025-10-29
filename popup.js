
async function refresh() {
    const items = await chrome.storage.sync.get({ enabled: true });
    document.getElementById("enabled").checked = items.enabled;
}

document.getElementById("enabled").addEventListener("change", async (e) => {
    await chrome.storage.sync.set({ enabled: e.target.checked });
});

document.getElementById("openOptions").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

refresh();
