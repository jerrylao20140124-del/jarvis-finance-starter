import {useState} from 'react';
import {Bar,BarChart,CartesianGrid,Cell,Legend,Pie,PieChart,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {categoryTotals,periodRows,today} from '../money';
import type {Transaction} from '../types';

export default function Charts({rows}:{rows:Transaction[]}) {
 const [mode,setMode]=useState<'week'|'month'>('week');
 const [referenceDate,setReferenceDate]=useState(today);
 const data=referenceDate?categoryTotals(periodRows(rows,referenceDate,mode)):[];
 const total=data.reduce((sum,entry)=>sum+entry.amount,0);
 const colors=['#ff5c6c','#56dcff','#ffbd66','#b896ff','#7ce8b0'];

 return <section className="card">
  <h2>Spending by category</h2>
  <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'end',marginBottom:18}}>
   <label>Period<select value={mode} onChange={event=>setMode(event.target.value as 'week'|'month')}>
	<option value="week">Week</option><option value="month">Month</option>
   </select></label>
   <label>Reference date<input type="date" value={referenceDate} onChange={event=>setReferenceDate(event.target.value)}/></label>
  </div>
  {!referenceDate?<p className="muted">Choose a reference date to view expenses.</p>:data.length===0?<p className="muted">No expenses in this period.</p>:<>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',gap:16}}>
   <section style={{minWidth:0}} aria-label="Bar chart">
    <h3>Bar chart</h3>
    <div style={{height:300,width:'100%'}}>
    <ResponsiveContainer width="100%" height="100%">
     <BarChart data={data} margin={{top:8,right:16,bottom:8,left:8}}>
      <CartesianGrid stroke="#263b51" strokeDasharray="3 3"/>
      <XAxis dataKey="name" tick={{fill:'#b6c6d7',fontSize:12}} axisLine={{stroke:'#526579'}} tickLine={{stroke:'#526579'}}/>
      <YAxis tickFormatter={(value:number)=>`$${value}`} tick={{fill:'#b6c6d7',fontSize:12}} axisLine={{stroke:'#526579'}} tickLine={{stroke:'#526579'}}/>
      <Tooltip formatter={(value)=>`$${Number(value).toFixed(2)}`} contentStyle={{background:'#0c1420',border:'1px solid #526579',color:'#e8edf4'}} labelStyle={{color:'#e8edf4'}} itemStyle={{color:'var(--accent)'}}/>
      <Bar dataKey="amount" name="Expenses" fill="var(--accent)" isAnimationActive={false}/>
     </BarChart>
    </ResponsiveContainer>
    </div>
   </section>
   <section style={{minWidth:0}} aria-label="Pie chart">
    <h3>Pie chart</h3>
    <div style={{height:300,width:'100%'}}>
    <ResponsiveContainer width="100%" height="100%">
     <PieChart>
      <Pie data={data} dataKey="amount" nameKey="name" cx="50%" cy="46%" outerRadius="65%" isAnimationActive={false}>
      {data.map((entry,index)=><Cell key={entry.name} fill={colors[index%colors.length]}/>)}</Pie>
      <Tooltip formatter={(value)=>`$${Number(value).toFixed(2)}`} contentStyle={{background:'#0c1420',border:'1px solid #526579',color:'#e8edf4'}} itemStyle={{color:'#e8edf4'}}/>
      <Legend formatter={value=><span style={{color:'#e8edf4'}}>{value}</span>}/>
     </PieChart>
    </ResponsiveContainer>
    </div>
   </section>
   </div>
    <p className="muted">Expenses by category: {data.map(entry=>`${entry.name} $${entry.amount.toFixed(2)} (${total?((entry.amount/total)*100).toFixed(0):0}%)`).join(', ')}. Total expenses: {`$${total.toFixed(2)}`}.</p>
  </>}
 </section>;
}
