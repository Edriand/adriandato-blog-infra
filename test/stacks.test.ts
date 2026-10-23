import { Match, Template } from 'aws-cdk-lib/assertions';
import { loadConfig } from '../lib/config';
import { crearAppDePrueba } from './app-de-prueba';

function synth(env: NodeJS.ProcessEnv = {}) {
  const config = loadConfig({ BLOG_ACCOUNT_ID: '111111111111', ...env });
  const { dns, site } = crearAppDePrueba(config);
  return { dns: Template.fromStack(dns), site: Template.fromStack(site) };
}

test('el bucket del sitio es privado y exige TLS', () => {
  const { site } = synth();
  site.hasResourceProperties('AWS::S3::Bucket', {
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    },
  });
  site.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
});

test('CloudFront sirve el dominio y www con HTTPS, cabeceras y la función de rutas', () => {
  const { site } = synth();
  site.hasResourceProperties('AWS::CloudFront::Distribution', {
    DistributionConfig: Match.objectLike({
      Aliases: ['adriandato.com', 'www.adriandato.com'],
      PriceClass: 'PriceClass_100',
      DefaultCacheBehavior: Match.objectLike({
        ViewerProtocolPolicy: 'redirect-to-https',
        ResponseHeadersPolicyId: Match.anyValue(),
        FunctionAssociations: [Match.objectLike({ EventType: 'viewer-request' })],
      }),
    }),
  });
  site.resourceCountIs('AWS::Route53::RecordSet', 4);
});

test('el certificado está en us-east-1 y cubre www', () => {
  const { dns } = synth();
  dns.hasResourceProperties('AWS::CertificateManager::Certificate', {
    DomainName: 'adriandato.com',
    SubjectAlternativeNames: ['www.adriandato.com'],
  });
});

test('importa la zona del registro del dominio y nunca la crea', () => {
  const { dns, site } = synth();
  dns.resourceCountIs('AWS::Route53::HostedZone', 0);
  site.resourceCountIs('AWS::Route53::HostedZone', 0);
  site.hasResourceProperties('AWS::Route53::RecordSet', { HostedZoneId: 'Z08156062W72TBWZFC7B2' });
});

test('el bucket del sitio tiene el nombre que espera el rol de publicación', () => {
  const { site } = synth({ BLOG_ACCOUNT_ID: '216625556188' });
  site.hasResourceProperties('AWS::S3::Bucket', { BucketName: 'blog-pro-s3-web-216625556188' });
});
