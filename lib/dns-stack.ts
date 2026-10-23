import { Stack, StackProps } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';
import { BlogConfig } from './config';

interface DnsStackProps extends StackProps {
  config: BlogConfig;
}

/**
 * Certificado ACM validado contra la zona de Route 53 del dominio. Va en us-east-1 porque CloudFront solo
 * acepta certificados de esa región.
 */
export class DnsStack extends Stack {
  readonly zone: route53.IHostedZone;
  readonly certificate: acm.ICertificate;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);
    const { domainName, redirectDomains, hostedZoneId } = props.config;

    // Zona creada por el registro del dominio: se importa, no se gestiona aquí
    this.zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', { hostedZoneId, zoneName: domainName });

    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName,
      subjectAlternativeNames: redirectDomains,
      validation: acm.CertificateValidation.fromDns(this.zone),
    });
  }
}
