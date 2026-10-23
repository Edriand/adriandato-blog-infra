# adriandato-blog-infra

Infraestructura de [adriandato.com](https://adriandato.com) con AWS CDK (TypeScript). La web está en [adriandato-blog-web](https://github.com/Edriand/adriandato-blog-web).

## Arquitectura

```
navegador ──► Route 53 ──► CloudFront ──(OAC)──► S3 privado (eu-west-1)
                             │  ├─ ACM (us-east-1)
                             │  ├─ CloudFront Function: / → /es/ o /en/, www → apex, index.html
                             │  └─ Response headers policy: HSTS, CSP, nosniff, DENY…
                             └─► S3 de logs (90 días)
```

| Stack | Región | Contenido |
| --- | --- | --- |
| `BlogDns` | us-east-1 | Zona de Route 53 (o la existente) y certificado ACM de `adriandato.com` + `www` |
| `BlogSite` | eu-west-1 | Bucket privado, bucket de logs, CloudFront, función de rutas, cabeceras y registros A/AAAA |

`BlogSite` lee la zona y el certificado de `BlogDns` con `crossRegionReferences`.

Coste esperado: unos 0,50 $ al mes por la zona de Route 53; S3 y CloudFront quedan en la capa gratuita con el tráfico previsto.

## Configuración

| Variable | Obligatoria | Qué es |
| --- | --- | --- |
| `BLOG_ACCOUNT_ID` | Sí | ID de la cuenta `adriandato-blog` |
| `BLOG_HOSTED_ZONE_ID` | No | ID de una zona ya creada (p. ej. la que crea Route 53 al registrar el dominio). Vacía = el stack crea la zona |

El resto (dominio, región y etiquetas) está en `lib/config.ts`. Las etiquetas se aplican a todos los recursos con `Tags.of(app)`.

## Requisitos en la cuenta (los prepara el agente de AWS)

- `cdk bootstrap` en `eu-west-1` y `us-east-1`.
- Rol de despliegue para GitHub Actions por OIDC, que confíe en `repo:Edriand/adriandato-blog-infra:ref:refs/heads/main` y pueda asumir los roles del bootstrap de CDK.
- En la Tag Policy, el valor `cdk` para `gestionado-por`.

## GitHub Actions

| Workflow | Cuándo | Qué hace |
| --- | --- | --- |
| `CI` | PR y push a `main` | `tsc`, tests y `cdk synth` sin credenciales |
| `Deploy` | Manual, desde `main` | `cdk diff` y, si eliges `deploy`, `cdk deploy --all` |

Variables del repositorio (Settings → Secrets and variables → Actions → Variables): `BLOG_ACCOUNT_ID`, `CDK_DEPLOY_ROLE_ARN` y, si aplica, `BLOG_HOSTED_ZONE_ID`.

## En local

```bash
npm ci
npm test
BLOG_ACCOUNT_ID=111111111111 npx cdk synth   # sin credenciales
aws sso login --profile adriandato-blog
BLOG_ACCOUNT_ID=<id> npx cdk diff --profile adriandato-blog
```

## Después del primer despliegue

Las salidas de `BlogSite` (`BucketName` y `DistributionId`) van como variables del repositorio `adriandato-blog-web` para el workflow de publicación. Si la zona la crea este stack, apunta los NS del registrador a los de la zona.
