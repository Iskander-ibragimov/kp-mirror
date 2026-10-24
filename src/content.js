// Injects a ▶ button before the film title on Kinopoisk film/series pages.
(function (root) {
  const KPM = root.KPM;
  const BTN_ID = 'kpm-play';
  const LABEL = 'Смотреть на kinokino.vip';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function findTitle(doc) {
    return doc.querySelector('h1[itemprop="name"]') || doc.querySelector('h1');
  }

  function createButton(doc) {
    const btn = doc.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', LABEL);
    btn.title = LABEL;

    const svg = doc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const p = doc.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z');
    svg.appendChild(p);
    btn.appendChild(svg);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const win = doc.defaultView;
      const target = KPM.toMirrorUrl(win.location.href);
      if (target) KPM.navigate(win, target);
    });
    return btn;
  }

  function ensureButton(doc, href) {
    const existing = doc.getElementById(BTN_ID);

    if (!KPM.toMirrorUrl(href)) {
      if (existing) existing.remove();
      return;
    }

    const title = findTitle(doc);
    if (title) {
      if (existing && existing.parentElement === title && title.firstChild === existing) return;
      const btn = existing || createButton(doc);
      btn.classList.remove('kpm-floating');
      title.insertBefore(btn, title.firstChild);
      return;
    }

    if (existing && existing.classList.contains('kpm-floating') && existing.parentElement === doc.body) return;
    if (!doc.body) return;
    const btn = existing || createButton(doc);
    btn.classList.add('kpm-floating');
    doc.body.appendChild(btn);
  }

  let observer = null;
  let poll = null;

  function start(win) {
    const doc = win.document;
    let scheduled = false;
    let lastHref = win.location.href;
    const run = () => {
      scheduled = false;
      lastHref = win.location.href;
      ensureButton(doc, lastHref);
    };
    const schedule = () => {
      if (!scheduled) {
        scheduled = true;
        win.setTimeout(run, 0);
      }
    };
    run();
    observer = new win.MutationObserver(schedule);
    observer.observe(doc.documentElement, { childList: true, subtree: true });
    poll = win.setInterval(() => {
      if (win.location.href !== lastHref) schedule();
    }, 500);
  }

  function stop() {
    if (observer) observer.disconnect();
    if (poll) clearInterval(poll);
    observer = null;
    poll = null;
  }

  KPM.ensureButton = ensureButton;
  KPM.start = start;
  KPM.stop = stop;
  KPM.navigate = (win, url) => win.location.assign(url);

  if (!root.__KPM_NO_AUTOSTART__ && root.document) start(root);
})(globalThis);
