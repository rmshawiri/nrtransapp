const key='nr-trans-offline-context';
export function rememberContext(user,context){
 const {initialState,...metadata}=context;
 localStorage.setItem(key,JSON.stringify({userId:user.id,context:metadata,savedAt:new Date().toISOString()}));
}
export function offlineContext(){
 try{const cached=JSON.parse(localStorage.getItem(key));if(!cached?.userId||!cached.context?.organizationId||cached.context.role!=='owner')return null;
 return {userId:cached.userId,...cached.context,offline:true,canWrite:cached.context.canWrite&&Date.parse(cached.context.subscription?.endsAt)>Date.now()};}catch{return null;}
}
export function forgetContext(){localStorage.removeItem(key);}
