import {defineConfig,loadEnv} from 'vite';
import configHandler from './api/config.js';
import platformHandler from './api/platform.js';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 for(const key of ['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY'])if(env[key])process.env[key]=env[key];
 const connect=server=>{server.middlewares.use((req,res,next)=>{if(req.url.startsWith('/api/config'))return configHandler(req,res);if(req.url.startsWith('/api/platform'))return platformHandler(req,res);next();});};
 return {server:{host:'127.0.0.1',port:5173,strictPort:true},plugins:[{name:'local-api',configureServer:connect,configurePreviewServer:connect}],build:{target:'es2022'}};
});
