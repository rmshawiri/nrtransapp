import {readPages} from './read-pages.mjs';
import {createClient} from '@supabase/supabase-js';
import {createHash,randomUUID} from 'node:crypto';
import * as Core from '../src/domain/core.js';
import {validateFleet} from '../src/domain/fleet.js';

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
const requireValue=(ok,message='Données invalides.',status=400)=>{if(!ok)throw new HttpError(status,message);};
const text=(value,max=160)=>{requireValue(typeof value==='string'&&value.trim().length<=max);return value.trim();};
const uuid=value=>{requireValue(typeof value==='string'&&uuidPattern.test(value));return value;};
const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const messages={payment_integration_unavailable:'Ce moyen reste indisponible tant que son intégration n’est pas réalisée.',payment_instructions_required:'Renseignez les coordonnées de paiement avant d’activer le virement.',secondary_user_policy_required:'Le nombre de lecteurs doit être configuré par l’administrateur commercial.',secondary_user_limit:'La limite de lecteurs de votre formule est atteinte.',invitation_invalid:'Cette invitation est invalide, expirée ou annulée.',invitation_email_mismatch:'Connectez-vous avec l’adresse confirmée destinataire de cette invitation.',account_already_attached:'Ce compte est déjà rattaché à une autre activité.',invalid_vehicle_scope:'Un véhicule sélectionné est indisponible.',member_missing:'Cet utilisateur secondaire est introuvable.',invalid_email:'Indiquez une adresse e-mail valide.',access_denied:'Accès refusé.',subscription_expired:'Votre abonnement a expiré. Vos données restent consultables.',upgrade_required:'Cette formule autorise un seul véhicule. Choisissez VIP pour agrandir votre parc.',invalid_promotion:'Code promotionnel invalide ou expiré.',promotion_not_applicable:'Ce code ne s’applique pas à cette offre.',promotion_limit:'Ce code a atteint sa limite d’utilisation.',payment_method_unavailable:'Ce moyen de paiement est indisponible.',plan_change_policy_required:'Contactez MORA Shawiri pour organiser votre changement de formule.',idempotency_key_reused:'Cette demande a déjà été utilisée avec un contenu différent.',invalid_transition:'Le statut de cette commande ne permet plus cette action.',reason_required:'Indiquez le motif du refus.'};
async function result(request){const {data,error}=await request;if(error){const message=messages[error.message];throw new HttpError(error.message==='access_denied'?403:message?409:500,message||'L’opération n’a pas abouti. Réessayez dans quelques instants.');}return data;}

export function publicConfig(env=process.env){return {supabaseUrl:env.SUPABASE_URL||'',publishableKey:env.SUPABASE_PUBLISHABLE_KEY||'',ready:!!(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY&&env.SUPABASE_SECRET_KEY)};}
function stableId(org,label){const h=createHash('sha256').update(org+':'+label).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
export function initialState(org){const state=Core.blank();for(const k of Core.collections)state[k].forEach((r,i)=>r.id=stableId(org,k+':'+i));state.serverVersion=0;return state;}
export function validateSync(body){
 uuid(body.id);requireValue(Number.isSafeInteger(body.baseVersion)&&body.baseVersion>=0);
 requireValue(body.state?.demo===false);
 try{validateFleet(body.state);}catch(e){throw new HttpError(400,e.message);}
 const seen=new Set();for(const kind of Core.collections)for(const record of body.state[kind]){uuid(record.id);requireValue(!seen.has(record.id),'Identifiant partagé par plusieurs enregistrements.');seen.add(record.id);}
 return body.state;
}

export function createPlatform(env=process.env){
 const config=publicConfig(env);
 const service=config.ready?createClient(config.supabaseUrl,env.SUPABASE_SECRET_KEY,options):null;
 async function authenticate(token){
  requireValue(service,'Service non configuré.',503);requireValue(typeof token==='string'&&token.length>20,'Connectez-vous pour continuer.',401);
  const {data,error}=await service.auth.getUser(token);
  requireValue(!error&&data.user&&!data.user.is_anonymous,'Session invalide ou expirée.',401);
  let claims;try{claims=JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString());}catch{throw new HttpError(401,'Session invalide.');}
  requireValue(uuidPattern.test(claims.session_id||''),'Session invalide.',401);
  requireValue(await result(service.rpc('nr_session_active',{p_actor:data.user.id,p_session:claims.session_id})),'Session révoquée. Reconnectez-vous.',401);
  const scoped=createClient(config.supabaseUrl,config.publishableKey,{...options,global:{headers:{Authorization:'Bearer '+token}}});
  return {user:data.user,scoped};
 }
 async function context(auth){
  const actor=auth.user.id;
  let [admin,members]=await Promise.all([result(service.from('nr_admins').select('user_id').eq('user_id',actor)),result(service.from('nr_members').select('*').eq('user_id',actor).eq('active',true))]);
  if(!members.length&&!admin.length){
   const name=String(auth.user.user_metadata?.business_name||'Mon activité').slice(0,160);
   await result(service.rpc('nr_onboard',{p_actor:actor,p_name:name||'Mon activité'}));
   members=await result(service.from('nr_members').select('*').eq('user_id',actor).eq('active',true));
  }
  const member=members[0],organizationId=member?.org_id||null;
  let subscription=null;
  if(organizationId)subscription=await result(service.rpc('nr_subscription_current',{p_org:organizationId,p_actor:actor}));
  return {userId:actor,organizationId,isAdmin:admin.length>0,role:member?.role||(admin.length?'admin':'inactive'),canWrite:member?.role==='owner'&&!!subscription,subscription:subscription?{plan:subscription.plan_id,startsAt:subscription.starts_at,endsAt:subscription.ends_at}:null};
 }
 async function snapshot(auth,ctx){
  if(!ctx.organizationId)return null;
  const data=await result(auth.scoped.rpc('nr_snapshot',{p_org:ctx.organizationId}));
  requireValue(data,'Accès à cette activité refusé.',403);
  const state=initialState(ctx.organizationId);
  if(data.organization.version>0){
   for(const k of Core.collections)state[k]=[];
   for(const r of data.records)state[r.kind].push(r.payload);
   state.loanVehicles=data.allocations.map(a=>({id:a.id,loanId:a.loan_id,vehicleId:a.vehicle_id,amount:Number(a.amount)}));
   state.settings=data.organization.settings;
  }
  state.serverVersion=Number(data.organization.version);state.revision=0;
  if(ctx.role==='owner')validateFleet(state);
  else if(data.organization.version===0)for(const k of Core.collections)state[k]=[];
  return state;
 }
 function owner(ctx){requireValue(ctx.role==='owner','Action réservée au propriétaire.',403);}
 function administrator(ctx){requireValue(ctx.isAdmin,'Accès administrateur requis.',403);}
 async function orderFor(ctx,id){const order=await result(service.from('nr_orders').select('*').eq('id',uuid(id)).maybeSingle());requireValue(order&&(ctx.isAdmin||order.org_id===ctx.organizationId&&ctx.role==='owner'),'Commande introuvable.',404);return order;}

 return async function platform({action,token,body={},method='GET'}){
  if(action==='public-reviews'){requireValue(method==='GET','Méthode non autorisée.',405);requireValue(service,'Service non configuré.',503);return {reviews:await result(service.from('nr_reviews').select('author_name,rating,comment,created_at').eq('status','approved').order('created_at',{ascending:false}).limit(12))};}
  const auth=await authenticate(token),actor=auth.user.id;
  if(action==='accept-invitation'){
   requireValue(method==='POST','Méthode non autorisée.',405);
   return {organizationId:await result(service.rpc('nr_invitation_accept',{p_actor:actor,p_token:uuid(body.token)}))};
  }
  const ctx=await context(auth),org=ctx.organizationId;
  const readActions=['context','client','admin','snapshot','members','payment-methods'];
  requireValue(readActions.includes(action)?method==='GET':method==='POST','Méthode non autorisée.',405);
  if(action==='context')return {...ctx,initialState:await snapshot(auth,ctx)};
  if(action==='snapshot')return {state:await snapshot(auth,ctx)};
  if(action==='sync'){
   owner(ctx);requireValue(body.organizationId===undefined||body.organizationId===org,'Cette synchronisation appartient à une autre activité.',403);const state=validateSync(body);
   const hash=createHash('sha256').update(JSON.stringify(state)).digest('hex');
   return result(service.rpc('nr_sync_apply',{p_org:org,p_actor:actor,p_mutation:body.id,p_hash:hash,p_expected:body.baseVersion,p_state:state}));
  }
  if(action==='members'){
   owner(ctx);
   const [members,invitations,vehicles,scopes]=await Promise.all([
    result(service.from('nr_members').select('*').eq('org_id',org)),result(service.from('nr_invitations').select('*').eq('org_id',org).order('created_at',{ascending:false})),result(service.from('nr_records').select('id,payload').eq('org_id',org).eq('kind','vehicles').is('deleted_at',null)),result(service.from('nr_member_vehicles').select('*').eq('org_id',org))]);
   return {members,invitations,vehicles:vehicles.map(v=>({id:v.id,name:v.payload.name})),scopes};
  }
  if(action==='client'){
   const profile=await result(service.from('nr_profiles').select('*').eq('id',actor).maybeSingle());
   if(ctx.role!=='owner')return {profile,subscription:ctx.subscription,orders:[],members:[],notifications:[],payments:[],vehicleCount:0};
   const [orders,payments,members,notifications,vehicles,subscriptions]=await Promise.all([
    readPages((start,end)=>result(service.from('nr_orders').select('*').eq('org_id',org).order('created_at',{ascending:false}).order('id').range(start,end))),readPages((start,end)=>result(service.from('nr_payments').select('*').eq('org_id',org).order('created_at',{ascending:false}).order('id').range(start,end))),readPages((start,end)=>result(service.from('nr_members').select('*').eq('org_id',org).order('user_id').range(start,end))),readPages((start,end)=>result(service.from('nr_notifications').select('*').eq('org_id',org).order('created_at',{ascending:false}).order('id').range(start,end))),readPages((start,end)=>result(service.from('nr_records').select('id').eq('org_id',org).eq('kind','vehicles').is('deleted_at',null).order('id').range(start,end))),readPages((start,end)=>result(service.from('nr_subscriptions').select('*').eq('org_id',org).order('ends_at',{ascending:false}).order('id').range(start,end)))]);
   return {profile:profile||{display_name:auth.user.user_metadata?.display_name||''},subscription:ctx.subscription,subscriptions,orders,payments,members,notifications,vehicleCount:vehicles.length};
  }
  if(action==='admin'){
   administrator(ctx);const fields={clients:['nr_organizations','id,name,created_at'],orders:['nr_orders','*'],payments:['nr_payments','*'],promotions:['nr_promotions','*'],reviews:['nr_reviews','*'],audit:['nr_audit','*'],plans:['nr_plans','*'],settings:['nr_commercial_settings','*'],subscriptions:['nr_subscriptions','*'],methods:['nr_payment_methods','*'],members:['nr_members','*'],notifications:['nr_notifications','*']};
   return Object.fromEntries(await Promise.all(Object.entries(fields).map(async([key,[table,columns]])=>[key,await readPages((start,end)=>{let query=service.from(table).select(columns);for(const column of table==='nr_members'?['org_id','user_id']:['id'])query=query.order(column,{ascending:true});return result(query.range(start,end));})])));
  }
  if(action==='invite'){
   owner(ctx);requireValue(typeof body.allVehicles==='boolean'&&Array.isArray(body.vehicleIds)&&body.vehicleIds.length<=1000);
   return result(service.rpc('nr_invitation_create',{p_org:org,p_actor:actor,p_email:text(body.email,254),p_all:body.allVehicles,p_vehicles:[...new Set(body.vehicleIds.map(uuid))]}));
  }
  if(action==='cancel-invitation'){
   owner(ctx);await result(service.rpc('nr_invitation_cancel',{p_org:org,p_actor:actor,p_invitation:uuid(body.id)}));return {ok:true};
  }
  if(action==='member-access'){
   owner(ctx);requireValue(typeof body.active==='boolean'&&typeof body.allVehicles==='boolean'&&Array.isArray(body.vehicleIds)&&body.vehicleIds.length<=1000);
   await result(service.rpc('nr_member_change',{p_org:org,p_actor:actor,p_user:uuid(body.userId),p_active:body.active,p_all:body.allVehicles,p_vehicles:[...new Set(body.vehicleIds.map(uuid))]}));return {ok:true};
  }
  if(action==='payment-methods')return result(service.from('nr_payment_methods').select('id,name,status,instructions'));
  if(action==='payment-method') {administrator(ctx);requireValue(['active','disabled','soon'].includes(body.status));await result(service.rpc('nr_payment_method_save',{p_actor:actor,p_id:text(body.id,30),p_status:body.status,p_instructions:text(body.instructions,4000)}));return {ok:true};}
  if(action==='order-detail'){
   owner(ctx);const order=await orderFor(ctx,body.id);
   const method=await result(service.from('nr_payment_methods').select('id,name,status,instructions').eq('id',order.method).single());
   const payment=await result(service.from('nr_payments').select('reference,proof_path,created_at').eq('order_id',order.id).maybeSingle());
   return {order,method,payment};
  }
  if(action==='quote'||action==='order'){
   owner(ctx);requireValue(['avance','vip'].includes(body.plan)&&[1,3,6,12].includes(body.months));
   const args={p_org:org,p_actor:actor,p_plan:body.plan,p_months:body.months,p_code:text(body.code||'',50)};
   if(action==='quote')return result(service.rpc('nr_quote',args));
   return result(service.rpc('nr_order_create',{...args,p_method:text(body.method,30),p_key:uuid(body.idempotencyKey)}));
  }
  if(action==='proof-upload'){
   owner(ctx);const order=await orderFor(ctx,body.orderId);requireValue(['awaiting_payment','rejected','declared'].includes(order.status),'Cette commande est déjà en cours de validation.',409);
   const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png'}[body.type];requireValue(ext,'Choisissez un PDF, JPEG ou PNG.');
   const path=org+'/'+order.id+'/'+randomUUID()+'.'+ext;
   const upload=await result(service.storage.from('payment-proofs').createSignedUploadUrl(path,{upsert:false}));return {path,token:upload.token};
  }
  if(action==='declare-payment'){
   owner(ctx);const order=await orderFor(ctx,body.orderId);let proof=null;
   if(body.proof){proof=text(body.proof,250);requireValue(proof.startsWith(org+'/'+order.id+'/')&&!proof.includes('..'));
    const blob=await result(service.storage.from('payment-proofs').download(proof));requireValue(blob.size>0&&blob.size<=5*1024*1024,'Justificatif invalide ou trop volumineux.');
    const b=Buffer.from(await blob.arrayBuffer());requireValue(b.subarray(0,5).toString()==='%PDF-'||b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||b[0]===255&&b[1]===216&&b[2]===255,'Le contenu du justificatif est invalide.');
   }
   const reference=text(body.reference,160);requireValue(reference.length>0,'Indiquez la référence du paiement.');
   return result(service.rpc('nr_payment_declare',{p_org:org,p_actor:actor,p_order:order.id,p_reference:reference,p_proof:proof}));
  }
  if(action==='proof-read'){
   const order=await orderFor(ctx,body.orderId);const payment=await result(service.from('nr_payments').select('proof_path').eq('order_id',order.id).maybeSingle());requireValue(payment?.proof_path,'Aucun justificatif.',404);
   const signed=await result(service.storage.from('payment-proofs').createSignedUrl(payment.proof_path,60));return {url:signed.signedUrl};
  }
  if(action==='send-notification'){
   administrator(ctx);const title=text(body.title,160),message=text(body.message,4000);requireValue(title&&message);await result(service.rpc('nr_notification_send',{p_actor:actor,p_org:uuid(body.organizationId),p_id:uuid(body.id),p_title:title,p_message:message}));return {ok:true};
  }
  if(action==='read-notification'){
   owner(ctx);await result(service.rpc('nr_notification_read',{p_actor:actor,p_id:uuid(body.id)}));return {ok:true};
  }
  if(action==='commercial-settings'){
   administrator(ctx);requireValue(Array.isArray(body.plans)&&body.plans.length<=3);
   const plans=body.plans.map(p=>{requireValue(['gratuit','avance','vip'].includes(p.id)&&typeof p.unlimited==='boolean'&&(p.limit===null||Number.isInteger(p.limit)&&p.limit>=0&&p.limit<=10000));return {id:p.id,unlimited:p.unlimited,limit:p.limit};});
   requireValue(body.planChange===null||body.planChange==='at_expiry');await result(service.rpc('nr_admin_configure',{p_actor:actor,p_data:{plans,planChange:body.planChange}}));return {ok:true};
  }
  if(action==='moderate-review'){
   administrator(ctx);requireValue(['approved','rejected','hidden'].includes(body.status));await result(service.rpc('nr_review_moderate',{p_actor:actor,p_review:uuid(body.id),p_status:body.status}));return {ok:true};
  }
  if(action==='promotion'){
   administrator(ctx);requireValue(['fixed','percent'].includes(body.type)&&Number.isFinite(body.value)&&body.value>=0&&(body.type!=='percent'||body.value<=100));
   const data={name:text(body.name,120),code:text(body.code,50),type:body.type,value:body.value,active:body.active!==false,plans:[],months:[],minimum:0};
   requireValue(data.name&&data.code.length>=3);
   requireValue(body.plans===undefined||Array.isArray(body.plans)&&body.plans.every(x=>['avance','vip'].includes(x)));requireValue(body.months===undefined||Array.isArray(body.months)&&body.months.every(x=>[1,3,6,12].includes(x)));
   data.plans=[...new Set(body.plans||[])];data.months=[...new Set(body.months||[])];
   for(const key of ['maxUses','maxPerClient','minimum']){const value=body[key]??(key==='minimum'?0:null);requireValue(value===null||Number.isSafeInteger(value)&&value>=0);data[key]=value;}
   for(const key of ['startsAt','endsAt']){const value=body[key]||null;requireValue(value===null||typeof value==='string'&&Number.isFinite(Date.parse(value)));data[key]=value;}
   if(data.startsAt&&data.endsAt)requireValue(Date.parse(data.endsAt)>Date.parse(data.startsAt));
   if(body.id)data.id=uuid(body.id);return {id:await result(service.rpc('nr_promotion_save',{p_actor:actor,p_data:data}))};
  }
  if(action==='decision'){
   administrator(ctx);requireValue(typeof body.approve==='boolean');return result(service.rpc('nr_order_decide',{p_actor:actor,p_order:uuid(body.orderId),p_approve:body.approve,p_reason:text(body.reason||'',2000)}));
  }
  if(action==='profile'){
   const display_name=text(body.name,120),phone=text(body.phone||'',40);requireValue(display_name.length>0);
   await result(service.from('nr_profiles').upsert({id:actor,display_name,phone}));return {ok:true};
  }
  if(action==='review'){
   owner(ctx);requireValue(Number.isInteger(body.rating)&&body.rating>=1&&body.rating<=5);const comment=text(body.comment,2000);requireValue(comment.length>0);
   const profile=await result(service.from('nr_profiles').select('display_name').eq('id',actor).maybeSingle());
   const author_name=profile?.display_name||String(auth.user.user_metadata?.display_name||'Client NR-TRANS').slice(0,120);
   await result(service.from('nr_reviews').upsert({org_id:org,author_name,rating:body.rating,comment,status:'pending'},{onConflict:'org_id'}));return {ok:true};
  }
  throw new HttpError(404,'Action introuvable.');
 };
}
