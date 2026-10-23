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
| `blog-pro-stack-dns` | us-east-1 | Certificado ACM de `adriandato.com` + `www`, validado en la zona existente |
| `blog-pro-stack-web` | eu-west-1 | Bucket privado, bucket de logs, CloudFront, función de rutas, cabeceras y registros A/AAAA |

`blog-pro-stack-web` lee el certificado de `blog-pro-stack-dns` con `crossRegionReferences`.

Coste esperado: unos 0,50 $ al mes por la zona de Route 53; S3 y CloudFront quedan en la capa gratuita con el tráfico previsto.

## Configuración

Todo está en `lib/config.ts`: cuenta `216625556188`, región `eu-west-1`, dominio, zona `Z08156062W72TBWZFC7B2`, nombre del bucket (`blog-pro-s3-web-<cuenta>`) y etiquetas (`proyecto=blog`, `entorno=prod`, `owner=adrian`, `gestionado-por=cdk`), que se aplican a todos los recursos con `Tags.of(app)`.

- **La zona de Route 53 no la gestiona este repo.** La creó el registro del dominio; aquí solo se importa. No la crees ni la borres desde el CDK.
- **El nombre del bucket es fijo** porque el rol de publicación de la web solo tiene permisos sobre ese bucket.

## Regla de nombres

Todo recurso con nombre y todo stack se llama `{proyecto}-{entorno}-{recurso}-{nombre}`, solo con minúsculas, números y guiones. En el blog, `blog-pro-…` (en los nombres el entorno es `pro`; la etiqueta `entorno` sigue siendo `prod`). Los nombres globales llevan el ID de la cuenta.

| Recurso | Nombre |
| --- | --- |
| Stacks | `blog-pro-stack-dns`, `blog-pro-stack-web` |
| Bucket de la web | `blog-pro-s3-web-216625556188` |
| Bucket de logs | `blog-pro-s3-logs-216625556188` |
| CloudFront Function | `blog-pro-cloudfront-rutas` |
| Política de cabeceras | `blog-pro-cloudfront-cabeceras` |
| Origin Access Control | `blog-pro-cloudfront-oac-web` |
| Distribución (comentario) | `blog-pro-cloudfront-web` |
| Certificado (etiqueta `Name`) | `blog-pro-acm-web` |

Los nombres salen siempre del helper `lib/nombres.ts`. El test `test/nombres.test.ts` sintetiza la app con los mismos feature flags que `cdk synth` y falla si un stack o un recurso con nombre se sale del patrón. Solo los proveedores internos de CDK se quedan con nombre generado.

## Requisitos en la cuenta (los prepara el agente de AWS, ya hechos)

- `cdk bootstrap` en `eu-west-1` y `us-east-1` (calificador `hnb659fds`).
- Rol `github-cdk` por OIDC, que confía en `repo:Edriand/adriandato-blog-infra:ref:refs/heads/main` y solo puede asumir los roles del bootstrap.
- Tag Policy con el valor `cdk` para `gestionado-por`.

## GitHub Actions

| Workflow | Cuándo | Qué hace |
| --- | --- | --- |
| `CI` | PR y push a `main` | `tsc`, tests y `cdk synth` sin credenciales |
| `Deploy` | Manual, desde `main` | `cdk diff` y, si eliges `deploy`, `cdk deploy --all` |

El workflow `Deploy` asume `arn:aws:iam::216625556188:role/github-cdk`, escrito en el propio workflow, así que no hace falta configurar variables. No uses `environment:` en el job: el rol no se podría asumir.

## En local

```bash
npm ci
npm test
npx cdk synth   # sin credenciales
aws sso login --profile adriandato-blog
npx cdk diff --profile adriandato-blog
```

## Después del primer despliegue

- El certificado se valida por DNS en la zona del dominio, así que **el registro del dominio tiene que haber terminado** antes del primer despliegue; si no, `BlogDns` se queda esperando la validación.
- La salida `DistributionId` de `blog-pro-stack-web` va como variable `DISTRIBUTION_ID` del repositorio `adriandato-blog-web`.
