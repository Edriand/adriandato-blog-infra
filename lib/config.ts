import { Nombres } from './nombres';

/**
 * Configuración del blog. Nada de esto es secreto: son los identificadores de la
 * cuenta adriandato-blog que prepara el agente de AWS.
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
   * Zona de Route 53 que creó el registro del dominio. El CDK solo la importa:
   * nunca la crea ni la borra.
   */
  hostedZoneId: string;
  /** Regla de nombres: blog-pro-{recurso}-{nombre} */
  nombres: Nombres;
  /** Nombre fijo: el rol de publicación de GitHub solo tiene permisos sobre este bucket */
  siteBucketName: string;
  tags: Record<string, string>;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BlogConfig {
  // Se puede sobrescribir para sintetizar contra otra cuenta (por ejemplo, en tests)
  const account = env.BLOG_ACCOUNT_ID || '216625556188';
  // En los nombres el entorno es "pro"; en la etiqueta sigue siendo "prod"
  const nombres = new Nombres('blog', 'pro', account);
  return {
    account,
    region: 'eu-west-1',
    domainName: 'adriandato.com',
    redirectDomains: ['www.adriandato.com'],
    hostedZoneId: 'Z08156062W72TBWZFC7B2',
    nombres,
    siteBucketName: nombres.global('s3', 'web'),
    tags: {
      proyecto: 'blog',
      entorno: 'prod',
      owner: 'adrian',
      'gestionado-por': 'cdk',
    },
  };
}
