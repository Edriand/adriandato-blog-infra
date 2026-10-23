#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { loadConfig } from '../lib/config';
import { DnsStack } from '../lib/dns-stack';
import { SiteStack } from '../lib/site-stack';

const app = new App();
const config = loadConfig();

for (const [key, value] of Object.entries(config.tags)) {
  Tags.of(app).add(key, value);
}

const dns = new DnsStack(app, 'BlogDns', {
  config,
  env: { account: config.account, region: 'us-east-1' },
  crossRegionReferences: true,
  description: 'adriandato.com: zona de Route 53 y certificado ACM',
});

new SiteStack(app, 'BlogSite', {
  config,
  zone: dns.zone,
  certificate: dns.certificate,
  env: { account: config.account, region: config.region },
  crossRegionReferences: true,
  description: 'adriandato.com: S3 privado, CloudFront con OAC y DNS',
});
