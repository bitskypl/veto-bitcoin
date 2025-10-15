/* black-veto-popup.js – samowystarczalny popup (Shadow DOM)
 * Czyta konfigurację z window.BSVetoPopupConfig (wp_add_inline_script).
 */
(function () {
  "use strict";

  // Domyślne wartości (fallback, gdy czegoś braknie w config.json)
  const DEFAULTS = {
    TEXT_HTML: "Apel do Prezydenta<br/>Rzeczypospolitej Polskiej<br/>o zawetowanie Ustawy o<br/>rynku kryptoaktywów",
    DETAILS_URL: "#",
    OPEN_DETAILS_IN_NEW_WINDOW: true,
    SHOW_FREQUENCY: "minutes",
    COOKIE_MINUTES: 1440,
    COOKIE_NAME: "veto_black_popup_shown",
    COOKIE_PATH: "/",
    STOP_AFTER_DATE: { ENABLED: false, STOP_AT_ISO: "2099-12-31T23:59:59+01:00" },
    FONT_FAMILY: "Arial, Helvetica, sans-serif",
    FONT_WEIGHT: 800,
    FONT_SIZE_DESKTOP: "42px",
    FONT_SIZE_MOBILE: "28px",
    POPUP_WIDTH_DESKTOP: 700,
    POPUP_HEIGHT_DESKTOP: "auto",
    MIN_WIDTH: 320,
    MIN_HEIGHT: 220,
    MOBILE_BREAKPOINT: 768,
    OVERLAY_OPACITY: 0.55,
    Z_INDEX: 2147483647,
    PADDING_DESKTOP: 40,
    PADDING_MOBILE: 20,
    BORDER_RADIUS: 0,
    LABEL_DETAILS: "Szczegóły",
    LABEL_CLOSE: "Zamknij",
    LABEL_X: "×",
    CLICK_OUTSIDE_TO_CLOSE: true,
  };

  // <- tu wp_inline_script z WP podstawi window.BSVetoPopupConfig
  const CONFIG = Object.assign({}, DEFAULTS, (window.BSVetoPopupConfig || {}));

  const now = () => new Date();
  function isAfterStopDate() {
    if (!CONFIG.STOP_AFTER_DATE || !CONFIG.STOP_AFTER_DATE.ENABLED) return false;
    const stop = new Date(CONFIG.STOP_AFTER_DATE.STOP_AT_ISO);
    return Number.isFinite(+stop) && now() > stop;
  }

  function getCookie(name) {
    const cookies = document.cookie ? document.cookie.split("; ") : [];
    for (let i = 0; i < cookies.length; i++) {
      const part = cookies[i];
      const eqIdx = part.indexOf("=");
      const key = part.substring(0, eqIdx);
      const val = part.substring(eqIdx + 1);
      if (key === decodeURIComponent(name)) {
        try { return decodeURIComponent(val); } catch { return val; }
      }
    }
    return null;
  }

  function setCookie(name, value, maxAgeSeconds) {
    if (CONFIG.SHOW_FREQUENCY === "always") return;
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${CONFIG.COOKIE_PATH}; samesite=Lax`;
    if (typeof maxAgeSeconds === "number" && Number.isFinite(maxAgeSeconds)) {
      cookie += `; max-age=${Math.max(0, Math.floor(maxAgeSeconds))}`;
    }
    try { document.cookie = cookie; } catch {}
  }

  function markShown() {
    if (CONFIG.SHOW_FREQUENCY === "always") return;
    if (CONFIG.SHOW_FREQUENCY === "never") {
      setCookie(CONFIG.COOKIE_NAME, "1", 10 * 365 * 24 * 60 * 60);
      return;
    }
    if (CONFIG.SHOW_FREQUENCY === "minutes") {
      const seconds = Math.max(1, (CONFIG.COOKIE_MINUTES | 0)) * 60;
      setCookie(CONFIG.COOKIE_NAME, "1", seconds);
    }
  }

  function shouldShow() {
    if (isAfterStopDate()) return false;
    if (CONFIG.SHOW_FREQUENCY === "always") return true;
    return !getCookie(CONFIG.COOKIE_NAME);
  }

  function stylesCSS(cfg) {
    const widthCSS = typeof cfg.POPUP_WIDTH_DESKTOP === "number" ? cfg.POPUP_WIDTH_DESKTOP + "px" : (cfg.POPUP_WIDTH_DESKTOP || "auto");
    const heightCSS = typeof cfg.POPUP_HEIGHT_DESKTOP === "number" ? cfg.POPUP_HEIGHT_DESKTOP + "px" : (cfg.POPUP_HEIGHT_DESKTOP || "auto");
    const overlayOpacity = Math.max(0, Math.min(1, cfg.OVERLAY_OPACITY));

    return `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
.veto__overlay { position: fixed; inset: 0; background: rgba(0,0,0,${overlayOpacity}); z-index: ${cfg.Z_INDEX}; }
.veto__wrap { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: ${cfg.Z_INDEX + 1}; }
.veto__popup {
  position: relative; background: #000; color: #fff;
  width: ${widthCSS}; height: ${heightCSS};
  min-width: ${cfg.MIN_WIDTH}px; min-height: ${cfg.MIN_HEIGHT}px;
  max-width: min(95vw, 1200px); max-height: 90vh; overflow: auto;
  border-radius: ${cfg.BORDER_RADIUS}px; box-shadow: 0 10px 40px rgba(0,0,0,.5);
}
.veto__content { padding: ${cfg.PADDING_DESKTOP}px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.veto__close {
  position: absolute; right: 12px; top: 8px; width: 44px; height: 44px;
  display: inline-flex; align-items: center; justify-content: center;
  font-family: ${cfg.FONT_FAMILY}; font-weight: ${cfg.FONT_WEIGHT}; font-size: 28px;
  line-height: 1; color: #fff; background: transparent; border: none; cursor: pointer; user-select: none;
}
.veto__text {
  width: 100%; font-family: ${cfg.FONT_FAMILY}; font-weight: ${cfg.FONT_WEIGHT};
  text-align: center; font-size: ${cfg.FONT_SIZE_DESKTOP}; line-height: 1.12; letter-spacing: 0;
  padding-top: 24px; padding-bottom: 24px;
}
.veto__btns { width: 100%; display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; }

.veto__button_outline, .veto__button {
  display: inline-flex; justify-content: center; align-items: center;
  width: 48%; min-width: 135px; height: 50px; text-decoration: none; font-size: 16px; transition: 0.3s ease-in-out; cursor: pointer; font-family: ${cfg.FONT_FAMILY}; box-sizing: border-box;
}
.veto__button_outline { color: #fff; border: 2px solid #fff; background: #000; }
.veto__button_outline:active, .veto__button_outline:visited, .veto__button_outline:link { color: #fff; }
.veto__button_outline:hover, .veto__button_outline:focus { color: #000; background: #fff; }

.veto__button { color: #000; border: 2px solid #fff; background: #fff; }
.veto__button:active, .veto__button:visited, .veto__button:link { color: #000; }
.veto__button:hover, .veto__button:focus { color: #fff; background: #000; }

/* MOBILE – fullscreen, tekst center, przyciski na dole */
@media (max-width: ${cfg.MOBILE_BREAKPOINT}px) {
  .veto__popup { width: 100vw; height: 100vh; max-width: 100vw; max-height: 100vh; border-radius: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; }
  .veto__content { flex: 1; width: 100%; padding: ${cfg.PADDING_MOBILE}px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; text-align: center; gap: 18px; }
  .veto__text { flex-grow: 1; display: flex; align-items: center; justify-content: center; font-size: ${cfg.FONT_SIZE_MOBILE}; line-height: 1.2; }
  .veto__btns { width: 100%; display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
  .veto__button_outline, .veto__button { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .veto__button_outline, .veto__button { transition: none; }
}
    `.trim();
  }

  function renderPopup() {
    const host = document.createElement("div");
    host.setAttribute("id", "veto-black-popup-host");
    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = stylesCSS(CONFIG);
    shadow.appendChild(style);

    const overlay = document.createElement("div");
    overlay.className = "veto__overlay";

    const wrap = document.createElement("div");
    wrap.className = "veto__wrap";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Komunikat");

    const popup = document.createElement("div");
    popup.className = "veto__popup";

    const btnX = document.createElement("button");
    btnX.className = "veto__close";
    btnX.setAttribute("type", "button");
    btnX.setAttribute("aria-label", CONFIG.LABEL_CLOSE);
    btnX.textContent = CONFIG.LABEL_X;

    const content = document.createElement("div");
    content.className = "veto__content";

    const text = document.createElement("div");
    text.className = "veto__text";
    text.innerHTML = CONFIG.TEXT_HTML;

    const btns = document.createElement("div");
    btns.className = "veto__btns";

    const aDetails = document.createElement("a");
    aDetails.className = "veto__button_outline";
    aDetails.textContent = CONFIG.LABEL_DETAILS;
    aDetails.href = CONFIG.DETAILS_URL || "#";
    if (CONFIG.OPEN_DETAILS_IN_NEW_WINDOW) {
      aDetails.target = "_blank"; aDetails.rel = "noopener noreferrer";
    }

    const bClose = document.createElement("button");
    bClose.className = "veto__button";
    bClose.setAttribute("type", "button");
    bClose.textContent = CONFIG.LABEL_CLOSE;

    btns.appendChild(aDetails);
    btns.appendChild(bClose);
    content.appendChild(text);
    content.appendChild(btns);
    popup.appendChild(btnX);
    popup.appendChild(content);
    wrap.appendChild(popup);
    shadow.appendChild(overlay);
    shadow.appendChild(wrap);

    const remove = () => { host.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") remove(); };

    btnX.addEventListener("click", remove);
    bClose.addEventListener("click", remove);
    if (CONFIG.CLICK_OUTSIDE_TO_CLOSE) overlay.addEventListener("click", remove);
    document.addEventListener("keydown", onKey);

    document.body.appendChild(host);
  }

  function boot() {
    if (!shouldShow()) return;
    renderPopup();
    markShown();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
