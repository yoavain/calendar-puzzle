/**
 * GoatCounter privacy-friendly analytics. The server CSP allows gc.zgo.at (script) and
 * yoavain.goatcounter.com (connect).
 */
declare global {
    interface Window {
        goatcounter?: { allow_frame?: boolean; path?: string };
    }
}

// A pinned version never changes, so the browser can verify its hash. Change both values together.
// Published versions and hashes: https://www.goatcounter.com/help/countjs-versions
const SCRIPT_URL = "https://gc.zgo.at/count.v5.js";
const SCRIPT_INTEGRITY = "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";

export const loadAnalytics = (isEmbedded: boolean): void => {
    if (isEmbedded) {
        // GoatCounter skips frames by default. The path keeps embedded views apart from direct ones.
        // The script reads these settings when it runs, so set them before it loads.
        window.goatcounter = { allow_frame: true, path: "/embed" };
    }
    const script = document.createElement("script");
    script.async = true;
    script.integrity = SCRIPT_INTEGRITY;
    script.crossOrigin = "anonymous";
    script.src = SCRIPT_URL;
    script.dataset["goatcounter"] = "https://yoavain.goatcounter.com/count";
    document.body.appendChild(script);
};
