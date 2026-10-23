// CloudFront Function (runtime JS 2.0), evento viewer-request.
// - www.<dominio> -> <dominio> (301)
// - "/" -> /es/ o /en/ según Accept-Language (302, porque depende del navegador)
// - /ruta sin extensión -> /ruta/ (301), y /ruta/ -> /ruta/index.html (interno)
var DOMAIN = '__DOMAIN__';

function redirect(statusCode, location) {
  return {
    statusCode: statusCode,
    statusDescription: statusCode === 301 ? 'Moved Permanently' : 'Found',
    headers: { location: { value: location }, 'cache-control': { value: 'max-age=3600' } },
  };
}

function preferredLang(headers) {
  var header = headers['accept-language'];
  if (!header) return 'es';
  var langs = header.value.toLowerCase().split(',');
  for (var i = 0; i < langs.length; i++) {
    var code = langs[i].trim().slice(0, 2);
    if (code === 'es') return 'es';
    if (code === 'en') return 'en';
  }
  return 'es';
}

function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : DOMAIN;
  var uri = request.uri;

  if (host !== DOMAIN) {
    return redirect(301, 'https://' + DOMAIN + uri);
  }
  if (uri === '/' || uri === '/index.html') {
    return redirect(302, '/' + preferredLang(request.headers) + '/');
  }
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }
  var last = uri.split('/').pop();
  if (last.indexOf('.') === -1) {
    return redirect(301, uri + '/');
  }
  return request;
}
