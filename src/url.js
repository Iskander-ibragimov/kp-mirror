// Maps a Kinopoisk film/series URL to the same page on the mirror.
(function (root) {
  const MIRROR_ORIGIN = 'https://kinokino.vip';
  const PATH_RE = /^\/(film|series)\/(\d+)(\/|$)/;

  function isKinopoiskHost(host) {
    return host === 'kinopoisk.ru' || host.endsWith('.kinopoisk.ru');
  }

  function parseFilmPath(href) {
    let url;
    try {
      url = new URL(href);
    } catch (e) {
      return null;
    }
    if (!isKinopoiskHost(url.hostname)) return null;
    const m = url.pathname.match(PATH_RE);
    return m ? { type: m[1], id: m[2] } : null;
  }

  function toMirrorUrl(href) {
    const p = parseFilmPath(href);
    return p ? `${MIRROR_ORIGIN}/${p.type}/${p.id}/` : null;
  }

  const api = { parseFilmPath, toMirrorUrl, MIRROR_ORIGIN };
  root.KPM = Object.assign(root.KPM || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
