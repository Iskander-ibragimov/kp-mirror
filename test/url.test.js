const test = require('node:test');
const assert = require('node:assert/strict');
const { toMirrorUrl, parseFilmPath } = require('../src/url.js');

test('film with query param maps to clean mirror path', () => {
  assert.equal(
    toMirrorUrl('https://www.kinopoisk.ru/film/5301021/?socialAlias=MjcwMzAwMTg%3D'),
    'https://kinokino.vip/film/5301021/'
  );
});

test('series maps to series', () => {
  assert.equal(toMirrorUrl('https://www.kinopoisk.ru/series/464963/'), 'https://kinokino.vip/series/464963/');
});

test('sub-page and hash map to film root', () => {
  assert.equal(toMirrorUrl('https://www.kinopoisk.ru/film/123/cast/#x'), 'https://kinokino.vip/film/123/');
});

test('bare domain without trailing slash', () => {
  assert.equal(toMirrorUrl('https://kinopoisk.ru/film/77'), 'https://kinokino.vip/film/77/');
});

test('non-film pages return null', () => {
  for (const u of [
    'https://www.kinopoisk.ru/',
    'https://www.kinopoisk.ru/name/123/',
    'https://www.kinopoisk.ru/film/abc/',
    'https://example.com/film/1/',
    'https://notkinopoisk.ru/film/1/',
    'not a url',
  ]) assert.equal(toMirrorUrl(u), null, u);
});

test('parseFilmPath returns type and id', () => {
  assert.deepEqual(parseFilmPath('https://www.kinopoisk.ru/film/5/'), { type: 'film', id: '5' });
});
