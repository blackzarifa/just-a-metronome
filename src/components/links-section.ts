import "./links-section.css";

export interface LinksSection {
  el: HTMLElement;
}

export function createLinksSection(): LinksSection {
  const el = document.createElement("section");
  el.id = "links";
  el.className = "links-section";
  el.innerHTML = `
    <div class="links-inner">
      <hgroup class="colophon">
        <h2 class="colophon-name">Just a Metronome</h2>
        <p class="colophon-gloss">no ads. no subscriptions. just a metronome.</p>
      </hgroup>
      <hr class="hairline">
      <nav class="link-row" aria-label="Links">
      <a class="link-card" href="https://github.com/blackzarifa/just-a-metronome"
         target="_blank" rel="noopener noreferrer">
        <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.48
                   0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62
                   1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.07
                   0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34
                   1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9
                   0 1.37-.01 2.480-.01 2.82 0 .27.18.59.69.48A10.04 10.04 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"></path>
        </svg>
        <div class="link-text">
          <span class="link-label">GitHub</span>
          <span class="link-sub">Source &amp; issues</span>
        </div>
      </a>

      <a class="link-card" href="#" data-placeholder="donation"
         target="_blank" rel="noopener noreferrer">
        <svg class="link-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 8h13a3 3 0 0 1 0 6h-1"></path>
          <path d="M4 8v8a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V8z"></path>
          <line x1="7" y1="2.5" x2="7" y2="4.5"></line>
          <line x1="10.5" y1="2.5" x2="10.5" y2="4.5"></line>
          <line x1="14" y1="2.5" x2="14" y2="4.5"></line>
        </svg>
        <div class="link-text">
          <span class="link-label">Buy me a coffee</span>
          <span class="link-sub">If it helped</span>
        </div>
      </a>
      </nav>
    </div>
  `;

  return { el };
}
