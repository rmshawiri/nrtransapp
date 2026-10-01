import {createClient} from '@supabase/supabase-js';
import {credentials} from './credentials.mjs';
const c=credentials(),client=createClient(new URL(c['API URL']).origin,c['Secret keys'],{auth:{persistSession:false,autoRefreshToken:false}});
const {data,error}=await client.storage.getBucket('payment-proofs');
if(error&&![400,404,'400','404'].includes(error.statusCode))throw new Error('Bucket inspection failed');
const settings={public:false,fileSizeLimit:5*1024*1024,allowedMimeTypes:['application/pdf','image/jpeg','image/png']};
const response=data?await client.storage.updateBucket('payment-proofs',settings):await client.storage.createBucket('payment-proofs',settings);
if(response.error)throw new Error('Private bucket provisioning failed');
console.log('payment-proofs configured: private, 5 MiB maximum, PDF/JPEG/PNG only.');
