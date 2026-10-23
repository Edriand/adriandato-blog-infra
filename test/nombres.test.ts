import { Template } from 'aws-cdk-lib/assertions';
import { crearAppDePrueba } from './app-de-prueba';
import { loadConfig } from '../lib/config';
import { Nombres, PATRON_NOMBRE } from '../lib/nombres';

// Dónde guarda el nombre cada tipo de recurso con nombre. Si añades un tipo nuevo
// con nombre propio, añádelo aquí para que el test lo vigile.
const NOMBRE_DE: Record<string, (props: any) => unknown> = {
  'AWS::S3::Bucket': (p) => p.BucketName,
  'AWS::CloudFront::Function': (p) => p.Name,
  'AWS::CloudFront::ResponseHeadersPolicy': (p) => p.ResponseHeadersPolicyConfig?.Name,
  'AWS::CloudFront::OriginAccessControl': (p) => p.OriginAccessControlConfig?.Name,
  'AWS::CloudFront::CachePolicy': (p) => p.CachePolicyConfig?.Name,
  'AWS::CloudFront::Distribution': (p) => p.DistributionConfig?.Comment,
  'AWS::CertificateManager::Certificate': (p) =>
    p.Tags?.find((t: { Key: string }) => t.Key === 'Name')?.Value,
  'AWS::Lambda::Function': (p) => p.FunctionName,
  'AWS::IAM::Role': (p) => p.RoleName,
  'AWS::Logs::LogGroup': (p) => p.LogGroupName,
  'AWS::SSM::Parameter': (p) => p.Name,
};

// Los proveedores internos de CDK (custom resources) se quedan con nombre generado
const esProveedorInterno = (path: string) => /Provider|CustomResource/.test(path);

const config = loadConfig({ BLOG_ACCOUNT_ID: '216625556188' });
const { dns, site } = crearAppDePrueba(config);

test.each([dns, site])('el stack %s sigue la regla de nombres', (stack) => {
  expect(stack.stackName).toMatch(PATRON_NOMBRE);
  expect(stack.stackName.startsWith('blog-pro-stack-')).toBe(true);
});

test.each([dns, site])('todo recurso con nombre de %s sigue la regla', (stack) => {
  const recursos = Template.fromStack(stack).toJSON().Resources as Record<string, any>;
  const fuera: string[] = [];
  for (const [id, recurso] of Object.entries(recursos)) {
    const leer = NOMBRE_DE[recurso.Type];
    if (!leer || esProveedorInterno(recurso.Metadata?.['aws:cdk:path'] ?? '')) continue;
    const nombre = leer(recurso.Properties ?? {});
    if (typeof nombre !== 'string' || !PATRON_NOMBRE.test(nombre) || !nombre.startsWith('blog-pro-')) {
      fuera.push(`${id} (${recurso.Type}): ${JSON.stringify(nombre)}`);
    }
  }
  expect(fuera).toEqual([]);
});

test('los nombres esperados', () => {
  expect(dns.stackName).toBe('blog-pro-stack-dns');
  expect(site.stackName).toBe('blog-pro-stack-web');
  expect(config.siteBucketName).toBe('blog-pro-s3-web-216625556188');
});

test('el helper rechaza lo que se sale de la regla', () => {
  const n = new Nombres('blog', 'pro', '216625556188');
  expect(n.global('s3', 'web')).toBe('blog-pro-s3-web-216625556188');
  expect(() => n.nombre('S3', 'web')).toThrow();
  expect(() => n.nombre('s3', 'mi_bucket')).toThrow();
  expect(() => n.nombre('s3', '')).toThrow();
  expect(() => new Nombres('blog', 'prod.', '1')).toThrow();
});
