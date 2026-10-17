import {MODEL_ID, briefPrompt, parseBrief, reviewPrompt} from './domain.mjs';
let engine, loading;
export const aiState={ready:false,loading:false,message:'Local AI is off. Enable it to download Gemma to this device.',progress:0};
export async function enableAI(onProgress=()=>{}) {
 if(engine) return engine;
 if(loading) return loading;
 loading=(async()=>{
  if(!navigator.gpu) throw new Error('This browser does not provide WebGPU. Try a recent desktop Chrome or Edge browser. You can still write and manage briefs manually.');
  const adapter=await navigator.gpu.requestAdapter();
  if(!adapter) throw new Error('No compatible GPU was found. Try a desktop device with hardware acceleration enabled.');
  aiState.loading=true;
  const webllm=await import('https://esm.run/@mlc-ai/web-llm@0.2.84');
  engine=await webllm.CreateMLCEngine(MODEL_ID,{initProgressCallback:r=>{
   Object.assign(aiState,{message:r.text,progress:r.progress});onProgress(aiState);
  }},{context_window_size:4096});
  Object.assign(aiState,{ready:true,loading:false,message:'Gemma is ready. Campaign text is processed on this device.',progress:1});onProgress(aiState);return engine;
 })();
 try{return await loading;}catch(err){Object.assign(aiState,{ready:false,loading:false,message:err.message,progress:0});onProgress(aiState);throw err;}finally{loading=null;}
}
export async function generateBrief(input) {
 if(!engine) throw new Error('Enable local AI first using Open AI & privacy, or use the sample template.');
 const result=await engine.chat.completions.create({messages:[{role:'user',content:briefPrompt(input)}],temperature:.35,max_tokens:650});
 return parseBrief(result.choices[0].message.content||'');
}
export async function reviewCaption(campaign,caption) {
 if(!engine) throw new Error('Enable local AI first using Open AI & privacy.');
 const result=await engine.chat.completions.create({messages:[{role:'user',content:reviewPrompt(campaign,caption)}],temperature:.2,max_tokens:500});
 return result.choices[0].message.content;
}
