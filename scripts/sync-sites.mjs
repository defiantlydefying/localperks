// Run after opening the existing portfolio with the Sites source helper.
import { readFile, writeFile, cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const target = process.argv[2];
if (!target) throw Error('Usage: npm run sync:sites -- /absolute/path/to/portfolio');
const manifest = JSON.parse(await readFile(resolve(target, '.openai/hosting.json'), 'utf8'));
if (manifest.project_id !== 'appgprj_6ac72523b34c81919a2461d5c7b4c4a6')
  throw Error('This is not the existing Emma portfolio Site.');
await cp(new URL('../dist/', import.meta.url), resolve(target, 'public/projects/localperks'), {
  recursive: true,
});
const inference = await readFile(new URL('../lib/inference.mjs', import.meta.url), 'utf8');
await writeFile(
  resolve(target, 'worker/localperks-inference.mjs'),
  inference.replace("'../dist/domain.mjs'", "'../public/projects/localperks/domain.mjs'"),
);
console.log(
  'Synced LocalPerks frontend and inference handler. Package and publish this opened Site through the Sites workflow.',
);
