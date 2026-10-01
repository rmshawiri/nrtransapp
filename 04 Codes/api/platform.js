import {createPlatform,HttpError} from '../server/platform.mjs';
let platform;
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');
 try{
  const action=new URL(req.url,'http://localhost').searchParams.get('action');
  const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  let body=req.body;
  if(body===undefined){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>3*1024*1024)throw new HttpError(413,'Cette sauvegarde dépasse la taille autorisée.');}try{body=raw?JSON.parse(raw):{};}catch{throw new HttpError(400,'Requête invalide.');}}
  if(typeof body==='string'){try{body=JSON.parse(body);}catch{throw new HttpError(400,'Requête invalide.');}}
  if(!body||Array.isArray(body)||typeof body!=='object')throw new HttpError(400,'Requête invalide.');
  if(Buffer.byteLength(JSON.stringify(body))>3*1024*1024)throw new HttpError(413,'Cette sauvegarde dépasse la taille autorisée.');
  platform??=createPlatform();const data=await platform({action,token,body,method:req.method});res.statusCode=200;res.end(JSON.stringify(data));
 }catch(e){res.statusCode=e instanceof HttpError?e.status:500;res.end(JSON.stringify({message:e instanceof HttpError?e.message:'Le service est momentanément indisponible.'}));}
}
