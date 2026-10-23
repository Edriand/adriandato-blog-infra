import * as fs from 'node:fs';
import * as path from 'node:path';

// Carga la CloudFront Function tal cual se despliega
const source = fs
  .readFileSync(path.join(__dirname, '..', 'functions', 'routing.js'), 'utf8')
  .replace('__DOMAIN__', 'adriandato.com');
const handler = new Function(`${source}; return handler;`)();

function request(uri: string, headers: Record<string, string> = {}) {
  const h: Record<string, { value: string }> = { host: { value: 'adriandato.com' } };
  for (const [k, v] of Object.entries(headers)) h[k] = { value: v };
  return handler({ request: { uri, headers: h } });
}

test('la raíz redirige según el idioma del navegador', () => {
  expect(request('/', { 'accept-language': 'en-GB,en;q=0.9' }).headers.location.value).toBe('/en/');
  expect(request('/', { 'accept-language': 'es-ES,es;q=0.9,en;q=0.8' }).headers.location.value).toBe('/es/');
  expect(request('/', { 'accept-language': 'fr-FR' }).headers.location.value).toBe('/es/');
  expect(request('/').headers.location.value).toBe('/es/');
});

test('www redirige al dominio principal', () => {
  const res = request('/es/blog/', { host: 'www.adriandato.com' });
  expect(res.statusCode).toBe(301);
  expect(res.headers.location.value).toBe('https://adriandato.com/es/blog/');
});

test('las carpetas sirven su index.html', () => {
  expect(request('/es/blog/').uri).toBe('/es/blog/index.html');
});

test('las rutas sin barra final redirigen a la versión con barra', () => {
  const res = request('/es/sobre-mi');
  expect(res.statusCode).toBe(301);
  expect(res.headers.location.value).toBe('/es/sobre-mi/');
});

test('los ficheros se sirven tal cual', () => {
  expect(request('/es/rss.xml').uri).toBe('/es/rss.xml');
  expect(request('/_astro/app.abc123.css').uri).toBe('/_astro/app.abc123.css');
});
