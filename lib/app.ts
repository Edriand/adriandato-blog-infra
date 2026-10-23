import { App, Tags } from 'aws-cdk-lib';
import { BlogConfig } from './config';
import { DnsStack } from './dns-stack';
import { SiteStack } from './site-stack';

/** Monta la app completa. La usan bin/app.ts y los tests, así prueban lo mismo que se despliega. */
export function crearApp(config: BlogConfig, app = new App()): { app: App; dns: DnsStack; site: SiteStack } {
  for (const [key, value] of Object.entries(config.tags)) {
    Tags.of(app).add(key, value);
  }

  const dns = new DnsStack(app, config.nombres.stack('dns'), {
    config,
    env: { account: config.account, region: 'us-east-1' },
    crossRegionReferences: true,
    description: 'adriandato.com: certificado ACM',
  });

  const site = new SiteStack(app, config.nombres.stack('web'), {
    config,
    zone: dns.zone,
    certificate: dns.certificate,
    env: { account: config.account, region: config.region },
    crossRegionReferences: true,
    description: 'adriandato.com: S3 privado, CloudFront con OAC y DNS',
  });

  return { app, dns, site };
}
