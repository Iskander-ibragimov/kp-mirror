const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const SRC = ['url.js', 'content.js'].map((f) =>
  fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8')
);
const FILM = 'https://www.kinopoisk.ru/film/5301021/?socialAlias=MjcwMzAwMTg%3D';

function setup(html, url = FILM) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url,
    runScripts: 'outside-only',
  });
  dom.window.__KPM_NO_AUTOSTART__ = true;
  for (const s of SRC) dom.window.eval(s);
  const { KPM } = dom.window;
  return { dom, win: dom.window, doc: dom.window.document, KPM };
}

test('button is inserted as first child of the title, title text unchanged', () => {
  const { doc, KPM, win } = setup('<main><h1>Моана (2026)</h1></main>');
  KPM.ensureButton(doc, win.location.href);
  const h1 = doc.querySelector('h1');
  assert.equal(h1.firstChild.id, 'kpm-play');
  assert.equal(h1.textContent, 'Моана (2026)');
  assert.equal(h1.firstChild.getAttribute('aria-label'), 'Смотреть на kinokino.vip');
});

test('itemprop=name title is preferred over other h1', () => {
  const { doc, KPM, win } = setup('<h1>Другое</h1><h1 itemprop="name">Моана</h1>');
  KPM.ensureButton(doc, win.location.href);
  assert.equal(doc.querySelector('h1[itemprop="name"]').firstChild.id, 'kpm-play');
});

test('calling twice keeps exactly one button', () => {
  const { doc, KPM, win } = setup('<h1>Моана</h1>');
  KPM.ensureButton(doc, win.location.href);
  KPM.ensureButton(doc, win.location.href);
  assert.equal(doc.querySelectorAll('#kpm-play').length, 1);
});

test('no title → floating button in body', () => {
  const { doc, KPM, win } = setup('<div>loading</div>');
  KPM.ensureButton(doc, win.location.href);
  const b = doc.querySelectorAll('#kpm-play');
  assert.equal(b.length, 1);
  assert.ok(b[0].classList.contains('kpm-floating'));
  assert.equal(b[0].parentElement, doc.body);
});

test('title appearing later replaces floating button', () => {
  const { doc, KPM, win } = setup('<div id="app"></div>');
  KPM.ensureButton(doc, win.location.href);
  doc.getElementById('app').innerHTML = '<h1>Моана</h1>';
  KPM.ensureButton(doc, win.location.href);
  const b = doc.querySelectorAll('#kpm-play');
  assert.equal(b.length, 1);
  assert.equal(b[0].parentElement.tagName, 'H1');
  assert.ok(!b[0].classList.contains('kpm-floating'));
});

test('re-rendered title gets the button back exactly once', () => {
  const { doc, KPM, win } = setup('<div id="app"><h1>Моана</h1></div>');
  KPM.ensureButton(doc, win.location.href);
  doc.getElementById('app').innerHTML = '<h1>Моана</h1>';
  KPM.ensureButton(doc, win.location.href);
  assert.equal(doc.querySelectorAll('#kpm-play').length, 1);
  assert.equal(doc.querySelector('h1').firstChild.id, 'kpm-play');
});

test('non-film page removes the button', () => {
  const { dom, doc, KPM, win } = setup('<h1>Моана</h1>');
  KPM.ensureButton(doc, win.location.href);
  dom.reconfigure({ url: 'https://www.kinopoisk.ru/name/123/' });
  KPM.ensureButton(doc, win.location.href);
  assert.equal(doc.querySelectorAll('#kpm-play').length, 0);
});

test('click navigates to mirror of the CURRENT url (after in-site navigation)', () => {
  const { dom, doc, KPM, win } = setup('<h1>Моана</h1>');
  KPM.ensureButton(doc, win.location.href);
  dom.reconfigure({ url: 'https://www.kinopoisk.ru/film/999/' });
  const calls = [];
  KPM.navigate = (w, url) => calls.push(url);
  doc.getElementById('kpm-play').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.deepEqual(calls, ['https://kinokino.vip/film/999/']);
});

test('click does not bubble to page handlers', () => {
  const { doc, KPM, win } = setup('<h1>Моана</h1>');
  KPM.ensureButton(doc, win.location.href);
  KPM.navigate = () => {};
  let bubbled = false;
  doc.querySelector('h1').addEventListener('click', () => (bubbled = true));
  doc.getElementById('kpm-play').dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  assert.equal(bubbled, false);
});

test('start() reacts to DOM changes via observer', async () => {
  const { doc, KPM, win } = setup('<div id="app"></div>');
  KPM.start(win);
  doc.getElementById('app').innerHTML = '<h1>Моана</h1>';
  await new Promise((r) => setTimeout(r, 50));
  assert.equal(doc.querySelector('h1').firstChild.id, 'kpm-play');
  KPM.stop();
});
