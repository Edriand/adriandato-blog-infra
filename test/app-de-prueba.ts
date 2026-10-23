import * as fs from 'node:fs';
import * as path from 'node:path';
import { App } from 'aws-cdk-lib';
import { crearApp } from '../lib/app';
import { BlogConfig } from '../lib/config';

// Mismos feature flags que `cdk synth` (cdk.json), para que los tests vean las mismas plantillas
const context = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'cdk.json'), 'utf8')).context;

export function crearAppDePrueba(config: BlogConfig) {
  return crearApp(config, new App({ context }));
}
