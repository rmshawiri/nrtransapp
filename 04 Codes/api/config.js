import {publicConfig} from '../server/platform.mjs';
export default function handler(req,res){res.setHeader('Cache-Control','no-store');res.statusCode=200;res.setHeader('Content-Type','application/json');res.end(JSON.stringify(publicConfig()));}
