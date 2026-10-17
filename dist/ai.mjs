import {MODEL_ID, briefPrompt, parseBrief, reviewPrompt} from './domain.mjs';
let engine,loading,worker;
const listeners=new Set();
export const aiState={ready:false,loading:false,failed:false,message:'AI starts automatically in the background.',progress:0};
const update=value=>{Object.assign(aiState,value);for(const listener of listeners)listener(aiState);};
export function observeAI(listener){listeners.add(listener);listener(aiState);return()=>listeners.delete(listener);}
export async function enableAI(onProgress){
 if(onProgress)listeners.add(onProgress);
 if(engine)return engine;
 if(loading)return loading;
 loading=(async()=>{
  update({loading:true,failed:false,message:'Preparing AI automatically. The first model download can take a few minutes.',progress:0});
  if(!navigator.gpu)throw new Error('Local AI needs a WebGPU-capable browser. Use desktop Chrome or Edge, or continue with the editable brief template.');
  const adapter=await navigator.gpu.requestAdapter();if(!adapter)throw new Error('This device cannot run local AI. You can still negotiate terms and manage collaborations.');
  const webllm=await import('https://esm.run/@mlc-ai/web-llm@0.2.84');
  worker=new Worker(new URL('./ai-worker.mjs',import.meta.url),{type:'module'});
  engine=await webllm.CreateWebWorkerMLCEngine(worker,MODEL_ID,{initProgressCallback:r=>update({message:r.text,progress:r.progress})},{context_window_size:4096});
  update({ready:true,loading:false,failed:false,message:'AI ready · Gemma runs on this device.',progress:1});return engine;
 })();
 try{return await loading;}catch(err){worker?.terminate();worker=null;engine=null;update({ready:false,loading:false,failed:true,message:err.message,progress:0});throw err;}finally{loading=null;}
}
let generation=Promise.resolve();
function run(prompt,max_tokens){const job=generation.catch(()=>{}).then(async()=>{const model=await enableAI();const result=await model.chat.completions.create({messages:[{role:'user',content:prompt}],temperature:.25,max_tokens});return result.choices[0].message.content||'';});generation=job;return job;}
export async function generateBrief(input){return parseBrief(await run(briefPrompt(input),650));}
export async function reviewCaption(campaign,caption){return run(reviewPrompt(campaign,caption),500);}
