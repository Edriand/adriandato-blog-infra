/**
 * Regla de nombres de Adrián para todo recurso con nombre y para los stacks:
 * {proyecto}-{entorno}-{recurso}-{nombre}, solo minúsculas, números y guiones.
 * Los nombres globales (como los buckets) llevan además el ID de la cuenta.
 */
export const PATRON_NOMBRE = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/;

const PIEZA = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class Nombres {
  constructor(
    readonly proyecto: string,
    readonly entorno: string,
    readonly cuenta: string,
  ) {
    for (const pieza of [proyecto, entorno, cuenta]) comprobarPieza(pieza);
  }

  /** Prefijo que deben llevar todos los nombres de este proyecto y entorno */
  get prefijo(): string {
    return `${this.proyecto}-${this.entorno}-`;
  }

  /** Nombre normal: blog-pro-cloudfront-rutas */
  nombre(recurso: string, nombre: string): string {
    comprobarPieza(recurso);
    comprobarPieza(nombre);
    const completo = `${this.prefijo}${recurso}-${nombre}`;
    if (!PATRON_NOMBRE.test(completo)) {
      throw new Error(`Nombre fuera de la regla: ${completo}`);
    }
    return completo;
  }

  /** Nombre único en todo AWS, con el ID de la cuenta: blog-pro-s3-web-216625556188 */
  global(recurso: string, nombre: string): string {
    return this.nombre(recurso, `${nombre}-${this.cuenta}`);
  }

  /** Nombre de stack: blog-pro-stack-web */
  stack(nombre: string): string {
    return this.nombre('stack', nombre);
  }
}

function comprobarPieza(pieza: string): void {
  if (!PIEZA.test(pieza)) {
    throw new Error(`"${pieza}" solo puede tener minúsculas, números y guiones`);
  }
}
