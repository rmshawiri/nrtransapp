// Read Supabase collections in bounded requests without silently truncating them.
export async function readPages(fetchPage,size=500){
 const rows=[];
 for(let offset=0;;offset+=size){
  const page=await fetchPage(offset,offset+size-1);
  if(!Array.isArray(page))throw Error('Invalid collection response');
  rows.push(...page);
  if(page.length<size)return rows;
 }
}
