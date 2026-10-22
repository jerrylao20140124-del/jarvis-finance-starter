import {useEffect,useRef,useState} from 'react';
import type {Analysis,Judgment,Transaction} from '../types';

type Reflection={judgment:Judgment;reason:string};
type Reflections=Record<string,Reflection>;
const reflectionKey='jarvis-advisor-reflections-v1';
const isJudgment=(value:unknown):value is Judgment=>value==='need'||value==='want'||value==='unsure';

function loadReflections():Reflections {
 try {
	const saved=JSON.parse(localStorage.getItem(reflectionKey)||'null');
	if(!saved||typeof saved!=='object'||Array.isArray(saved)) return {};
	return Object.fromEntries(Object.entries(saved).flatMap(([id,value])=>{
	 if(value&&typeof value==='object'&&isJudgment((value as Reflection).judgment)&&typeof (value as Reflection).reason==='string')
		return [[id,{judgment:(value as Reflection).judgment,reason:(value as Reflection).reason}]];
	 return [];
	}));
 } catch {return {};}
}

function validateAnalysis(value:unknown):Analysis {
 if(!value||typeof value!=='object') throw Error('The advisor returned an invalid response. Please try again.');
 const result=value as Record<string,unknown>;
 if((result.mode!=='mock'&&result.mode!=='live')||!isJudgment(result.label)||typeof result.reason!=='string'||typeof result.question!=='string'||typeof result.alternative!=='string')
	throw Error('The advisor returned an invalid response. Please try again.');
 return result as Analysis;
}

export default function Advisor({rows}:{rows:Transaction[]}) {
 const isPages=import.meta.env.MODE==='pages';
 const expenses=rows.filter(row=>row.kind==='expense');
 const [selectedId,setSelectedId]=useState(()=>expenses[0]?.id||'');
 const selected=expenses.find(row=>row.id===selectedId)||expenses[0];
 const [context,setContext]=useState('');
 const [analysis,setAnalysis]=useState<Analysis|null>(null);
 const [reflections,setReflections]=useState<Reflections>(loadReflections);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState('');
 const [storageWarning,setStorageWarning]=useState('');
 const controller=useRef<AbortController|null>(null);
 const latest=useRef({selectedId:selected?.id||'',item:selected?.item||'',cents:selected?.cents||0,context});
 latest.current={selectedId:selected?.id||'',item:selected?.item||'',cents:selected?.cents||0,context};
 const reflection=selected?reflections[selected.id]||{judgment:'unsure' as Judgment,reason:''}:{judgment:'unsure' as Judgment,reason:''};

 useEffect(()=>{
	setAnalysis(null);
	setError('');
	if(controller.current){controller.current.abort();controller.current=null;setPending(false);}
 },[selected?.id,selected?.item,selected?.cents,context]);

 useEffect(()=>{
	try {localStorage.setItem(reflectionKey,JSON.stringify(reflections));setStorageWarning('');}
	catch {setStorageWarning('Your reflection could not be saved on this device.');}
 },[reflections]);

 useEffect(()=>()=>controller.current?.abort(),[]);

 function updateReflection(update:Partial<Reflection>){
	if(!selected) return;
	setReflections(current=>({...current,[selected.id]:{...current[selected.id]||{judgment:'unsure',reason:''},...update}}));
 }

 async function analyse(){
	if(!selected) return;
	const request={item:selected.item,cents:selected.cents,context};
	const activeController=new AbortController();
	controller.current=activeController;
	setPending(true);setError('');setAnalysis(null);
	let timedOut=false;
	const timeout=window.setTimeout(()=>{timedOut=true;activeController.abort();},20000);
	try {
	 const response=await fetch('/api/classify',{
		method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:activeController.signal
	 });
	 let body:unknown;
	 try {body=await response.json();} catch {throw Error('The advisor returned an invalid response. Please try again.');}
	 if(!response.ok){
		const message=body&&typeof body==='object'&&typeof (body as Record<string,unknown>).error==='string'?(body as {error:string}).error:'The advisor could not respond. Please try again.';
		throw Error(message);
	 }
	 const result=validateAnalysis(body);
	 const current=latest.current;
	 if(controller.current===activeController&&current.selectedId===selected.id&&current.item===request.item&&current.cents===request.cents&&current.context===request.context)
		setAnalysis(result);
	} catch(cause) {
	 if(timedOut){setError('The request timed out after 20 seconds. Check your connection and try again.');}
	 else if(!activeController.signal.aborted){setError((cause as Error).message||'The advisor could not respond. Please try again.');}
	} finally {
	 window.clearTimeout(timeout);
	 if(controller.current===activeController){controller.current=null;setPending(false);}
	}
 }

 return <section className="card" aria-busy={pending}>
	<h2>Spending advisor</h2>
	{expenses.length===0?<p className="muted">Log an expense to reflect on a spending decision.</p>:<>
	 <label>Expense<select value={selected?.id||''} disabled={pending} onChange={event=>setSelectedId(event.target.value)}>
		{expenses.map(expense=><option key={expense.id} value={expense.id}>{expense.item} · ${(expense.cents/100).toFixed(2)}</option>)}
	 </select></label>
	 <label>Purpose or existing alternatives<textarea value={context} maxLength={500} rows={3} disabled={pending} onChange={event=>setContext(event.target.value)} placeholder="What was the expense for? What alternatives were available?"/></label>
	 <p className="muted">{context.length}/500 characters</p>
	 <label>Your judgment<select value={reflection.judgment} disabled={pending} onChange={event=>updateReflection({judgment:event.target.value as Judgment})}>
		<option value="need">Need</option><option value="want">Want</option><option value="unsure">Unsure</option>
	 </select></label>
	 {isPages?<p className="muted">The advisor service is unavailable on GitHub Pages. Your judgment and reflection are still saved on this device.</p>:<button type="button" disabled={pending||!selected} onClick={analyse}>{pending?'Analysing spending…':error?'Retry analysis':'Analyse spending'}</button>}
	 {pending&&<p role="status" aria-live="polite">Analysing spending. Please wait.</p>}
	 {error&&<p role="alert" className="error">{error}</p>}
	 {analysis&&<div aria-live="polite" style={{marginTop:18,borderLeft:'2px solid var(--accent)',paddingLeft:16}}>
		<p><strong>{analysis.mode==='mock'?'MOCK MODE — fixed example, not connected to AI':'LIVE AI RESPONSE'}</strong></p>
		{analysis.mode==='mock'&&<p className="muted">Mock mode checks the interface only. This fixed example is not an analysis from a model.</p>}
		<p><strong>Advisor judgment:</strong> {analysis.label.toUpperCase()}</p>
		<p><strong>Reason:</strong> {analysis.reason}</p>
		<p><strong>Follow-up question:</strong> {analysis.question}</p>
		<p><strong>Alternative:</strong> {analysis.alternative}</p>
	 </div>}
	 <label>I agree/disagree because…<textarea value={reflection.reason} maxLength={1000} rows={3} disabled={pending} onChange={event=>updateReflection({reason:event.target.value})} placeholder="Explain your own decision. This is saved separately from the advisor response."/></label>
	 <p className="muted">Your judgment and reflection are saved on this device for this expense.</p>
	 {storageWarning&&<p role="alert" className="error">{storageWarning}</p>}
	</>}
 </section>;
}
