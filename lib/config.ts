/**
 * Configuración del blog. Lo que no es secreto vive aquí; el ID de la cuenta
 * llega por variable de entorno para no atarlo al código.
 */
export interface BlogConfig {
  /** ID de la cuenta adriandato-blog */
  account: string;
  /** Región principal (bucket y recursos regionales) */
  region: string;
  domainName: string;
  /** Dominios extra que redirigen al principal */
  redirectDomains: string[];
  /**
   * ID de una zona de Route 53 que ya exista (por ejemplo, la que crea Route 53
   * al registrar el dominio). Si se deja vacío, el stack crea la zona.
   */
  hostedZoneId?: string;
  tags: Record<string, string>;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BlogConfig {
  const account = env.BLOG_ACCOUNT_ID ?? env.CDK_DEFAULT_ACCOUNT;
  if (!account) {
    throw new Error('Falta BLOG_ACCOUNT_ID (ID de la cuenta adriandato-blog)');
  }
  return {
    account,
    region: 'eu-west-1',
    domainName: 'adriandato.com',
    redirectDomains: ['www.adriandato.com'],
    hostedZoneId: env.BLOG_HOSTED_ZONE_ID || undefined,
    tags: {
      proyecto: 'blog',
      entorno: 'prod',
      owner: 'adrian',
      // Pendiente: añadir "cdk" a la Tag Policy de la organización
      'gestionado-por': 'cdk',
    },
  };
}
