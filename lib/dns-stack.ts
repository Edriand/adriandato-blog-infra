import { Stack, StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { BlogConfig } from './config';

interface DnsStackProps extends StackProps {
  config: BlogConfig;
}

/**
 * Zona de Route 53 y certificado ACM. Va en us-east-1 porque CloudFront solo
 * acepta certificados de esa región.
 */
export class DnsStack extends Stack {
  readonly zone: route53.IHostedZone;
  readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);
    const { domainName, redirectDomains, hostedZoneId } = props.config;

    this.zone = hostedZoneId
      ? route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', { hostedZoneId, zoneName: domainName })
      : new route53.PublicHostedZone(this, 'Zone', { zoneName: domainName });

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: redirectDomains,
      validation: acm.CertificateValidation.fromDns(this.zone),
    });
  }
}
