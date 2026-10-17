const api=new URL('./api/ai',import.meta.url);
const listeners=new Set();let loading;
export const aiState={ready:false,loading:false,failed:false,mode:'hosted',message:'Connecting to hosted AI…',progress:0};
const update=value=>{Object.assign(aiState,value);for(const listener of listeners)listener(aiState);};
export function observeAI(listener){listeners.add(listener);listener(aiState);return()=>listeners.delete(listener);}
export async function enableAI(onProgress){
 if(onProgress)listeners.add(onProgress);if(aiState.ready)return aiState;if(loading)return loading;
 loading=(async()=>{update({loading:true,failed:false,message:'Connecting to hosted Gemma…'});const response=await fetch(api.href+'/status',{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Hosted AI is being connected. The rest of LocalPerks is available.');const status=await response.json();if(!status.configured)throw new Error('Hosted AI is being connected. Use the editable template while setup is completed.');update({ready:true,loading:false,failed:false,message:'Hosted Gemma via Ollama is available. No model download is needed.',progress:1,model:status.model});return aiState;})();
 try{return await loading;}catch(err){update({ready:false,loading:false,failed:true,message:err.message,progress:0});throw err;}finally{loading=null;}
}
async function request(task,input){
 await enableAI();let response;try{response=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({task,input}),signal:AbortSignal.timeout(50000)});}catch(err){throw new Error(err.name==='TimeoutError'?'AI took too long. Try again; your input is still here.':'Could not reach hosted AI. Check your connection and try again.');}
 const result=await response.json();if(!response.ok)throw new Error(result.error||'AI could not complete this request.');return result;
}
export async function generateBrief(input){return (await request('brief',input)).brief;}
export async function reviewCaption(campaign,caption){return (await request('review',{deliverables:campaign.deliverables,caption})).text;}
