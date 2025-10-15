/* 
 * Samowystarczalny popup w Shadow DOM – zero zależności od strony.
 * Autor: Daniel Haczyk BitSky.pl 
 * Licencja: The Unlicense
 * Licencja URI: https://unlicense.org/
 */
(function () {
    "use strict";
  
    /* ===========================
     * KONFIGURACJA DO USTAWIENIA
     * =========================== */
    const CONFIG = {
      /* --- Treść i link --- */
      TEXT_HTML:
        "Apel do Prezydenta<br/>Rzeczypospolitej Polskiej<br/>o zawetowanie Ustawy o<br/>rynku kryptoaktywów",
      DETAILS_URL: "https://bitcoin.org.pl/apel-do-prezydenta-rzeczypospolitej-polskiej/",
      OPEN_DETAILS_IN_NEW_WINDOW: true, // otwieraj „Szczegóły” w nowym oknie
  
      /* --- Cizęstotliwość wyświetlana (ciasteczko) ---
       * 'always'   – pokazuj za każdym razem (nie tworzy ciasteczka)
       * 'minutes'  – pokazuj ponownie po X minutach (ustaw w COOKIE_MINUTES)
       * 'never'    – po pierwszym wyświetleniu nigdy więcej (ustawiamy bardzo długie max-age)
       */
      SHOW_FREQUENCY: "never", // 'always' | 'minutes' | 'never'
      COOKIE_MINUTES: 1440, // tylko gdy SHOW_FREQUENCY === 'minutes'
      COOKIE_NAME: "veto_black_popup_shown",
      COOKIE_PATH: "/", // zazwyczaj "/"
  
      /* --- Blokada po dacie (domyślnie wyłączona) ---
       * Gdy ENABLED === true i bieżąca data > STOP_AT_ISO, popup się nie włączy.
       * Format: dowolny akceptowany przez new Date(), np. "2025-12-31T23:59:59+01:00"
       */
      STOP_AFTER_DATE: {
        ENABLED: true,
        STOP_AT_ISO: "2025-12-31T23:59:59+01:00",
      },
  
      /* --- Wygląd --- */
      FONT_FAMILY: "Arial, Helvetica, sans-serif",
      FONT_WEIGHT: 800, // 700–900
      FONT_SIZE_DESKTOP: "42px", // rozmiar dużego tekstu na desktopie
      FONT_SIZE_MOBILE: "28px",  // rozmiar na telefonie
  
      /* Wymiary okna na desktopie (na telefonie zawsze fullscreen) */
      POPUP_WIDTH_DESKTOP: 700,     // px lub string (np. "80vw")
      POPUP_HEIGHT_DESKTOP: "auto", // px lub "auto"
      MIN_WIDTH: 320,               // minimalna szerokość
      MIN_HEIGHT: 220,              // minimalna wysokość
  
      /* Responsywność i warstwa przyciemnienia */
      MOBILE_BREAKPOINT: 768, // px
      OVERLAY_OPACITY: 0.55,  // 0–1 (zaciemnienie tła)
      Z_INDEX: 2147483647,    // na samą górę
  
      /* Odstępy wewnętrzne i promień (względnie do stylu referencyjnego) */
      PADDING_DESKTOP: 40, // px
      PADDING_MOBILE: 20,  // px
      BORDER_RADIUS: 0,    // screenshot wygląda na brak zaokrąglenia
  
      /* Teksty przycisków / X */
      LABEL_DETAILS: "Szczegóły",
      LABEL_CLOSE: "Zamknij",
      LABEL_X: "×", // znak X w lewym górnym rogu
  
      /* Kliknięcie w przyciemnione tło zamyka popup */
      CLICK_OUTSIDE_TO_CLOSE: true,
    };
  
    /* ===========================
     * KONIEC KONFIGURACJI
     * =========================== */
  
    // ——— Funkcje pomocnicze ———
    const now = () => new Date();
    function isAfterStopDate() {
      if (!CONFIG.STOP_AFTER_DATE.ENABLED) return false;
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
          try {
            return decodeURIComponent(val);
          } catch {
            return val;
          }
        }
      }
      return null;
    }
  
    function setCookie(name, value, maxAgeSeconds) {
      // Przy 'always' nie robimy ciastka.
      if (CONFIG.SHOW_FREQUENCY === "always") return;
      let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${CONFIG.COOKIE_PATH}; samesite=Lax`;
      if (typeof maxAgeSeconds === "number" && Number.isFinite(maxAgeSeconds)) {
        cookie += `; max-age=${Math.max(0, Math.floor(maxAgeSeconds))}`;
      } else {
        // domyślnie sesyjne – ale tu zawsze podajemy max-age
      }
      try {
        document.cookie = cookie;
      } catch {
        // ignorujemy błędy zapisu ciasteczka
      }
    }
  
    function markShown() {
      if (CONFIG.SHOW_FREQUENCY === "always") return; // brak ciasteczka
      if (CONFIG.SHOW_FREQUENCY === "never") {
        // 10 lat – praktycznie „nigdy więcej”
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
  
    // ——— Style (w Shadow DOM) ———
    function stylesCSS(cfg) {
      const widthCSS =
        typeof cfg.POPUP_WIDTH_DESKTOP === "number"
          ? cfg.POPUP_WIDTH_DESKTOP + "px"
          : String(cfg.POPUP_WIDTH_DESKTOP || "auto");
  
      const heightCSS =
        typeof cfg.POPUP_HEIGHT_DESKTOP === "number"
          ? cfg.POPUP_HEIGHT_DESKTOP + "px"
          : String(cfg.POPUP_HEIGHT_DESKTOP || "auto");
  
      const overlayOpacity = Math.max(0, Math.min(1, cfg.OVERLAY_OPACITY));
  
      return `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }
  .veto__overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,${overlayOpacity});
    z-index: ${cfg.Z_INDEX};
  }
  .veto__wrap {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    z-index: ${cfg.Z_INDEX + 1};
  }
  .veto__popup {
    position: relative;
    background: #000;
    color: #fff;
    width: ${widthCSS};
    height: ${heightCSS};
    min-width: ${cfg.MIN_WIDTH}px;
    min-height: ${cfg.MIN_HEIGHT}px;
    max-width: min(95vw, 1200px);
    max-height: 90vh;
    overflow: auto;
    border-radius: ${cfg.BORDER_RADIUS}px;
    box-shadow: 0 10px 40px rgba(0,0,0,.5);
  }
  .veto__content {
    padding: ${cfg.PADDING_DESKTOP}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .veto__close {
    position: absolute;
    right: 12px; top: calc(env(safe-area-inset-top, 0px) + 8px);
    width: 44px; height: 44px;
    display: inline-flex; align-items: center; justify-content: center;
    font-family: ${cfg.FONT_FAMILY};
    font-weight: ${cfg.FONT_WEIGHT};
    font-size: 28px;
    line-height: 1;
    color: #fff; background: transparent; border: none;
    cursor: pointer;
    user-select: none;
  }
  .veto__text {
    width: 100%;
    font-family: ${cfg.FONT_FAMILY};
    font-weight: ${cfg.FONT_WEIGHT};
    text-align: center;
    font-size: ${cfg.FONT_SIZE_DESKTOP};
    line-height: 1.12;
    letter-spacing: 0;
    padding-top: 24px;
    padding-bottom: 24px;
  }
  .veto__btns {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  
  /* Przyciski – style z polecenia (izolowane w Shadow DOM) */
  .veto__button_outline, .veto__button {
    display: inline-flex;
    justify-content: center; align-items: center;
    width: 48%;
    min-width: 135px;
    height: 50px;
    text-decoration: none;
    font-size: 16px;
    transition: 0.3s ease-in-out;
    cursor: pointer;
    font-family: ${cfg.FONT_FAMILY};
    box-sizing: border-box;
  }
  
  /* Outline (Szczegóły) */
  .veto__button_outline {
    color: #fff;
    border: 2px solid #fff;
    background: #000;
  }
  .veto__button_outline:active, .veto__button_outline:visited, .veto__button_outline:link { color: #fff; }
  .veto__button_outline:hover, .veto__button_outline:focus { color: #000; background: #fff; }
  
  /* Solid (Zamknij) */
  .veto__button {
    color: #000;
    border: 2px solid #fff;
    background: #fff;
  }
  .veto__button:active, .veto__button:visited, .veto__button:link { color: #000; }
  .veto__button:hover, .veto__button:focus { color: #fff; background: #000; }
  
  /* MOBILE – fullscreen + przyciski 100% */
  @media (max-width: ${cfg.MOBILE_BREAKPOINT}px) {
    .veto__popup {
      width: 100vw;
      height: var(--veto-vh, 100dvh);
      max-width: 100vw;
      max-height: var(--veto-vh, 100dvh);
      border-radius: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  
    .veto__content {
      flex: 1;
      width: 100%;
      padding: ${cfg.PADDING_MOBILE}px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      gap: 18px;
    }
  
    .veto__text {
      flex-grow: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${cfg.FONT_SIZE_MOBILE};
      line-height: 1.2;
    }
  
    .veto__btns {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: auto;
    }
  
    .veto__button_outline, .veto__button {
      width: 100%;
    }
  }
  
  
  /* Preferencje redukcji ruchu */
  @media (prefers-reduced-motion: reduce) {
    .veto__button_outline, .veto__button { transition: none; }
  }
      `.trim();
    }
  
    // ——— Render ———
    function renderPopup() {
      // host + shadow
      const host = document.createElement("div");
      host.setAttribute("id", "veto-black-popup-host");
      // Nie skalujemy body, całość jest w osobnym stacking context:
      const shadow = host.attachShadow({ mode: "open" });

      // Ustal dynamiczną wysokość widocznego viewportu dla mobile (adres bar safe)
      function __setVetoVH() {
        const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
        host.style.setProperty('--veto-vh', h + 'px');
      }
      __setVetoVH();
      window.addEventListener('resize', __setVetoVH, { passive: true });
      window.addEventListener('orientationchange', __setVetoVH, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', __setVetoVH, { passive: true });
        window.visualViewport.addEventListener('scroll', __setVetoVH, { passive: true });
      }
  
      // style
      const style = document.createElement("style");
      style.textContent = stylesCSS(CONFIG);
      shadow.appendChild(style);
  
      // overlay
      const overlay = document.createElement("div");
      overlay.className = "veto__overlay";
  
      // wrapper
      const wrap = document.createElement("div");
      wrap.className = "veto__wrap";
      wrap.setAttribute("role", "dialog");
      wrap.setAttribute("aria-modal", "true");
      wrap.setAttribute("aria-label", "Komunikat");
  
      // popup
      const popup = document.createElement("div");
      popup.className = "veto__popup";
  
      // close X
      const btnX = document.createElement("button");
      btnX.className = "veto__close";
      btnX.setAttribute("type", "button");
      btnX.setAttribute("aria-label", CONFIG.LABEL_CLOSE);
      btnX.textContent = CONFIG.LABEL_X;
  
      // content
      const content = document.createElement("div");
      content.className = "veto__content";
  
      const text = document.createElement("div");
      text.className = "veto__text";
      text.innerHTML = CONFIG.TEXT_HTML;
  
      const btns = document.createElement("div");
      btns.className = "veto__btns";
  
      // "Szczegóły" – outline
      const aDetails = document.createElement("a");
      aDetails.className = "veto__button_outline";
      aDetails.textContent = CONFIG.LABEL_DETAILS;
      aDetails.href = CONFIG.DETAILS_URL || "#";
      if (CONFIG.OPEN_DETAILS_IN_NEW_WINDOW) {
        aDetails.target = "_blank";
        aDetails.rel = "noopener noreferrer";
      }
  
      // "Zamknij" – solid
      const bClose = document.createElement("button");
      bClose.className = "veto__button";
      bClose.setAttribute("type", "button");
      bClose.textContent = CONFIG.LABEL_CLOSE;
  
      // składanie
      btns.appendChild(aDetails);
      btns.appendChild(bClose);
      content.appendChild(text);
      content.appendChild(btns);
      popup.appendChild(btnX);
      popup.appendChild(content);
      wrap.appendChild(popup);
      shadow.appendChild(overlay);
      shadow.appendChild(wrap);
  
      // eventy
      const remove = () => {
        host.remove();
        document.removeEventListener("keydown", onKey);
      };
  
      const onKey = (e) => {
        if (e.key === "Escape") remove();
      };
  
      btnX.addEventListener("click", remove);
      bClose.addEventListener("click", remove);
      if (CONFIG.CLICK_OUTSIDE_TO_CLOSE) {
        overlay.addEventListener("click", remove);
      }
      document.addEventListener("keydown", onKey);
  
      // wstaw do DOM
      document.body.appendChild(host);
    }
  
    function boot() {
      if (!shouldShow()) return;
      renderPopup();
      // Zapisz informację, że już pokazano (zgodnie z konfiguracją)
      markShown();
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  })();
  