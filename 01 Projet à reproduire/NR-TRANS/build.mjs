import {cp,rm} from 'node:fs/promises';
await rm(new URL('./dist/',import.meta.url),{recursive:true,force:true});
await cp(new URL('./app/',import.meta.url),new URL('./dist/',import.meta.url),{recursive:true});
console.log('Build terminé : dist/ (ressources statiques autonomes).');
