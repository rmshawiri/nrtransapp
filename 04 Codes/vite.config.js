import {defineConfig,loadEnv} from 'vite';
export default defineConfig(({mode})=>{
 const env=loadEnv(mode,process.cwd(),'');
 return {server:{host:'127.0.0.1',port:5173,strictPort:true},plugins:[{name:'local-public-config',configureServer(server){server.middlewares.use('/api/config',(_req,res)=>{res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify({supabaseUrl:env.SUPABASE_URL||'',publishableKey:env.SUPABASE_PUBLISHABLE_KEY||'',ready:false}));});}}],build:{target:'es2022'}};
});
