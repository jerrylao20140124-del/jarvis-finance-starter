import {useEffect,useState} from 'react';
import {balance,money,parseCents,periodRows,today} from '../money';
import type {Transaction} from '../types';

const storageKey='jarvis-goal-v1';
type GoalSettings={name:string;targetCents:number;achieved:boolean};
const defaultGoal:GoalSettings={name:'Weekly savings',targetCents:3000,achieved:false};

function loadGoal():GoalSettings {
 try {
	const saved=JSON.parse(localStorage.getItem(storageKey)||'null');
	if(saved&&typeof saved.name==='string'&&saved.name.trim()&&Number.isSafeInteger(saved.targetCents)&&saved.targetCents>0&&saved.targetCents<=100000000)
	 return {name:saved.name.trim(),targetCents:saved.targetCents,achieved:saved.achieved===true};
 } catch {}
 return defaultGoal;
}

export default function Goal({rows}:{rows:Transaction[]}) {
 const [goal,setGoal]=useState<GoalSettings>(loadGoal);
 const [name,setName]=useState(goal.name);
 const [amount,setAmount]=useState((goal.targetCents/100).toFixed(2));
 const [mode,setMode]=useState<'week'|'month'>('week');
 const [referenceDate,setReferenceDate]=useState(today);
 const [error,setError]=useState('');
 const [storageWarning,setStorageWarning]=useState('');
 const [notice,setNotice]=useState(false);
 const period=referenceDate?periodRows(rows,referenceDate,mode):[];
 const netCents=balance(period);
 const achieved=Boolean(referenceDate)&&netCents>=goal.targetCents;
 const percentage=referenceDate?Math.min(100,Math.max(0,(netCents/goal.targetCents)*100)):0;
 const remaining=Math.max(0,goal.targetCents-netCents);

 useEffect(()=>{
	if(achieved&&!goal.achieved) setNotice(true);
	if(achieved!==goal.achieved) setGoal(current=>({...current,achieved}));
 },[achieved,goal.achieved]);

 useEffect(()=>{
	try {localStorage.setItem(storageKey,JSON.stringify(goal));setStorageWarning('');}
	catch {setStorageWarning('Your savings target could not be saved on this device.');}
 },[goal]);

 useEffect(()=>{
	if(!notice) return;
	const timeout=window.setTimeout(()=>setNotice(false),3000);
	return ()=>window.clearTimeout(timeout);
 },[notice]);

 function saveTarget(event:React.FormEvent<HTMLFormElement>){
	event.preventDefault();
	try {
	 const trimmedName=name.trim();
	 if(!trimmedName) throw Error('Enter a target name.');
	 const targetCents=parseCents(amount);
	 setGoal(current=>({...current,name:trimmedName,targetCents}));
	 setName(trimmedName);
	 setError('');
	} catch (cause) {setError((cause as Error).message);}
 }

 return <section className="card">
	<h2>Savings target</h2>
	<form onSubmit={saveTarget}>
	 <label>Target name<input value={name} onChange={event=>setName(event.target.value)} maxLength={60} required/></label>
	 <label>Target amount<input inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="30.00" required/></label>
	 <label>Period<select value={mode} onChange={event=>setMode(event.target.value as 'week'|'month')}>
		<option value="week">Week</option><option value="month">Month</option>
	 </select></label>
	 <label>Reference date<input type="date" value={referenceDate} onChange={event=>setReferenceDate(event.target.value)}/></label>
	 <button type="submit">Save target</button>
	</form>
	<p role="alert" className="error">{error||storageWarning}</p>
	{notice&&<p role="status" aria-live="polite" style={{borderLeft:'3px solid var(--accent)',padding:'10px 14px',background:'#0c1d2d',color:'#e8edf4'}}>TARGET ACHIEVED</p>}
	<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,150px),1fr))',gap:16,marginTop:18}}>
	 <div><span className="eyebrow">PERIOD NET SAVINGS</span><p><strong>{money(netCents)}</strong></p></div>
	 <div><span className="eyebrow">TARGET</span><p><strong>{money(goal.targetCents)}</strong></p></div>
	 <div><span className="eyebrow">REMAINING</span><p><strong>{money(remaining)}</strong></p></div>
	 <div><span className="eyebrow">STATUS</span><p><strong>{referenceDate?(achieved?'TARGET ACHIEVED':'TARGET IN PROGRESS'):'Choose a reference date'}</strong></p></div>
	</div>
	<div role="progressbar" aria-label="Savings target progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} style={{height:12,background:'#263b51',marginTop:10,overflow:'hidden'}}>
	<div style={{height:'100%',width:`${percentage}%`,background:'var(--accent)'}}/>
	</div>
	<p className="muted">Progress: {percentage.toFixed(1)}%. Available balance is your all-time wallet total; period net savings is income minus expenses in the selected period.</p>
 </section>;
}
