import "./corner-controls.css";
import { saveTheme, type Theme } from "../storage";

export interface CornerControls {
  el: HTMLElement;
  isHelpOpen(): boolean;
  toggleHelp(): void;
  closeHelp(returnFocus: boolean): void;
}

export function createCornerControls(): CornerControls {
  const el = document.createElement("div");
  el.className = "corner-controls";
  el.innerHTML = `
    <button id="help-toggle" class="corner-btn help-toggle" type="button"
            aria-label="Show instructions and keyboard shortcuts" aria-haspopup="dialog" aria-expanded="false">
      <svg class="icon icon-help" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.5" y="6" width="19" height="13" rx="2"></rect>
        <line x1="6" y1="9.5" x2="6" y2="9.5"></line>
        <line x1="9.5" y1="9.5" x2="9.5" y2="9.5"></line>
        <line x1="13" y1="9.5" x2="13" y2="9.5"></line>
        <line x1="16.5" y1="9.5" x2="16.5" y2="9.5"></line>
        <line x1="6" y1="12.5" x2="6" y2="12.5"></line>
        <line x1="9.5" y1="12.5" x2="9.5" y2="12.5"></line>
        <line x1="13" y1="12.5" x2="13" y2="12.5"></line>
        <line x1="16.5" y1="12.5" x2="16.5" y2="12.5"></line>
        <line x1="7" y1="15.7" x2="15.5" y2="15.7"></line>
      </svg>
    </button>

    <button id="theme-toggle" class="corner-btn theme-toggle" type="button" aria-label="Switch to dark theme">
      <svg class="icon icon-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2"></circle>
        <g class="sun-rays">
          <line x1="12" y1="1.5" x2="12" y2="4.5"></line>
          <line x1="12" y1="19.5" x2="12" y2="22.5"></line>
          <line x1="1.5" y1="12" x2="4.5" y2="12"></line>
          <line x1="19.5" y1="12" x2="22.5" y2="12"></line>
          <line x1="4.4" y1="4.4" x2="6.5" y2="6.5"></line>
          <line x1="17.5" y1="17.5" x2="19.6" y2="19.6"></line>
          <line x1="4.4" y1="19.6" x2="6.5" y2="17.5"></line>
          <line x1="17.5" y1="6.5" x2="19.6" y2="4.4"></line>
        </g>
      </svg>
      <svg class="icon icon-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.5 14.7A8.5 8.5 0 1 1 9.3 3.5a7 7 0 0 0 11.2 11.2Z"></path>
      </svg>
    </button>

    <section id="help-popover" class="help-popover" role="dialog" aria-modal="false"
             aria-label="Instructions and keyboard shortcuts" aria-hidden="true">
      <button id="help-close" class="icon-btn help-close" type="button" aria-label="Close">&times;</button>
      <h2 class="help-title">How to use</h2>
      <p class="help-text">Click or tap anywhere to start or stop the beat.</p>
      <ul class="help-shortcuts">
        <li><kbd>Space</kbd><span>start / stop</span></li>
        <li><kbd>&larr;</kbd><kbd>&rarr;</kbd><span>tempo &plusmn;1 (&plusmn;5 with Shift)</span></li>
        <li><kbd>&uarr;</kbd><kbd>&darr;</kbd><span>beats per bar</span></li>
        <li><kbd>T</kbd><span>tap tempo</span></li>
      </ul>
      <p class="help-tip"><kbd>WASD</kbd> / <kbd>HJKL</kbd> also supported</p>
    </section>
  `;

  const themeToggleEl = el.querySelector<HTMLButtonElement>("#theme-toggle")!;
  const helpToggleEl = el.querySelector<HTMLButtonElement>("#help-toggle")!;
  const helpPopoverEl = el.querySelector<HTMLElement>("#help-popover")!;
  const helpCloseEl = el.querySelector<HTMLButtonElement>("#help-close")!;

  function openHelp(): void {
    helpPopoverEl.classList.add("is-open");
    helpPopoverEl.setAttribute("aria-hidden", "false");
    helpToggleEl.setAttribute("aria-expanded", "true");
    helpCloseEl.focus();
  }

  function closeHelp(returnFocus: boolean): void {
    if (!helpPopoverEl.classList.contains("is-open")) return;
    helpPopoverEl.classList.remove("is-open");
    helpPopoverEl.setAttribute("aria-hidden", "true");
    helpToggleEl.setAttribute("aria-expanded", "false");
    if (returnFocus) helpToggleEl.focus();
  }

  function toggleHelp(): void {
    if (helpPopoverEl.classList.contains("is-open")) closeHelp(true);
    else openHelp();
  }

  function isHelpOpen(): boolean {
    return helpPopoverEl.classList.contains("is-open");
  }

  function setTheme(theme: Theme): void {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggleEl.setAttribute(
      "aria-label",
      theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
    );
    saveTheme(theme);
  }

  helpToggleEl.addEventListener("click", toggleHelp);
  helpCloseEl.addEventListener("click", () => closeHelp(true));
  themeToggleEl.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  });

  return { el, isHelpOpen, toggleHelp, closeHelp };
}
