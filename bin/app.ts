#!/usr/bin/env node
import { crearApp } from '../lib/app';
import { loadConfig } from '../lib/config';

crearApp(loadConfig());
