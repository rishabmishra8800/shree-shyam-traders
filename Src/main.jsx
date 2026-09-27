import React, {useEffect, useMemo, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createClient} from '@supabase/supabase-js';
import {LayoutDashboard, Package, Users, ReceiptText, CreditCard, Menu, X, Plus, RefreshCw, Search, Trash2} from 'lucide-react';
import './styles.css';

const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase=(url&&key&&key!=='YOUR_SUPABASE_ANON_KEY')?createClient(url,key):null;

const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;

function App(){
 const [tab,setTab]=useState('dashboard'), [open,setOpen]=useState(false), [products,setProducts]=useState([]), [customers,setCustomers]=useState([]), [sales,setSales]=useState([]), [loading,setLoading]=useState(false), [msg,setMsg]=useState('');
 const [search,setSearch]=useState('');
 const [productForm,setProductForm]=useState({name:'',sku:'',selling_price:'',purchase_price:'',stock:'',unit:'pcs'});
 const [customerForm,setCustomerForm]=useState({name:'',phone:'',address:''});

 async function load(){
   if(!supabase){setMsg('Supabase connection is not configured. Copy .env.example to .env and add your project URL + anon key.'); return;}
   setLoading(true); setMsg('');
   const [p,c,s]=await Promise.all([
     supabase.from('products').select('*').order('created_at',{ascending:false}),
     supabase.from('customers').select('*').order('created_at',{ascending:false}),
     supabase.from('sales').select('*').order('sale_date',{ascending:false}).limit(100)
   ]);
   if(p.error||c.error||s.error) setMsg((p.error||c.error||s.error).message);
   setProducts(p.data||[]); setCustomers(c.data||[]); setSales(s.data||[]); setLoading(false);
 }
 useEffect(()=>{load()},[]);
 const totalSales=useMemo(()=>sales.reduce((a,x)=>a+Number(x.total||0),0),[sales]);
 const due=useMemo(()=>sales.reduce((a,x)=>a+Number(x.due_amount||0),0),[sales]);
 const low=products.filter(x=>Number(x.stock)<=Number(x.min_stock||5));
 const filtered=products.filter(x=>(x.name||'').toLowerCase().includes(search.toLowerCase())||(x.sku||'').toLowerCase().includes(search.toLowerCase()));

 async function addProduct(e){
   e.preventDefault(); if(!supabase) return;
   const {error}=await supabase.from('products').insert({name:productForm.name,sku:productForm.sku||null,selling_price:Number(productForm.selling_price||0),purchase_price:Number(productForm.purchase_price||0),stock:Number(productForm.stock||0),unit:productForm.unit||'pcs'});
   if(error)setMsg(error.message); else {setMsg('Product added');setProductForm({name:'',sku:'',selling_price:'',purchase_price:'',stock:'',unit:'pcs'});load();}
 }
 async function addCustomer(e){
   e.preventDefault(); if(!supabase) return;
   const {error}=await supabase.from('customers').insert(customerForm);
   if(error)setMsg(error.message); else {setMsg('Customer added');setCustomerForm({name:'',phone:'',address:''});load();}
 }
 async function deleteProduct(id){
   if(!confirm('Delete this product?')) return;
   const {error}=await supabase.from('products').delete().eq('id',id);
   if(error)setMsg(error.message); else load();
 }

 const nav=[['dashboard','Dashboard',LayoutDashboard],['products','Products',Package],['customers','Customers',Users],['sales','Sales',ReceiptText],['payments','Payments',CreditCard]];
 return <div className="app">
   <aside className={open?'sidebar open':'sidebar'}>
     <div className="brand"><div className="logo">SS</div><div><b>Shree Shyam</b><span>Traders</span></div></div>
     <nav>{nav.map(([id,label,Icon])=><button className={tab===id?'active':''} onClick={()=>{setTab(id);setOpen(false)}} key={id}><Icon size={19}/>{label}</button>)}</nav>
     <div className="sidefoot">Billing • Stock • Sales</div>
   </aside>
   {open&&<div className="overlay" onClick={()=>setOpen(false)}/>}
   <main>
    <header><button className="menubtn" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button><div><h1>{nav.find(x=>x[0]===tab)?.[1]}</h1><small>Shree Shyam Traders</small></div><button className="refresh" onClick={load}><RefreshCw size={18}/></button></header>
    {msg&&<div className="notice">{msg}</div>}
    {tab==='dashboard'&&<Dashboard totalSales={totalSales} due={due} products={products.length} customers={customers.length} low={low.length} sales={sales}/>}
    {tab==='products'&&<Products form={productForm} setForm={setProductForm} add={addProduct} products={filtered} search={search} setSearch={setSearch} del={deleteProduct}/>}
    {tab==='customers'&&<Customers form={customerForm} setForm={setCustomerForm} add={addCustomer} customers={customers}/>}
    {tab==='sales'&&<Sales sales={sales}/>}
    {tab==='payments'&&<Payments sales={sales}/>}
   </main>
 </div>
}

function Card({title,value,icon:Icon}){return <div className="card"><div><span>{title}</span><strong>{value}</strong></div><div className="icon"><Icon size={22}/></div></div>}
function Dashboard({totalSales,due,products,customers,low,sales}){
 return <><div className="cards"><Card title="Total Sales" value={money(totalSales)} icon={ReceiptText}/><Card title="Outstanding Due" value={money(due)} icon={CreditCard}/><Card title="Products" value={products} icon={Package}/><Card title="Customers" value={customers} icon={Users}/></div>
 <div className="grid2"><section className="panel"><div className="panelhead"><h2>Recent Sales</h2></div>{sales.slice(0,8).map(s=><div className="row" key={s.id}><div><b>{s.invoice_no||`Sale #${s.id}`}</b><small>{new Date(s.sale_date).toLocaleDateString('en-IN')}</small></div><strong>{money(s.total)}</strong></div>)}{!sales.length&&<Empty text="No sales yet" />}</section>
 <section className="panel"><div className="panelhead"><h2>Stock Alert</h2><span>{low} low stock</span></div><p className="muted">Products at or below minimum stock will appear here.</p></section></div></>
}
function Products({form,setForm,add,products,search,setSearch,del}){
 return <><div className="toolbar"><div className="search"><Search size={18}/><input placeholder="Search products..." value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
 <section className="panel"><div className="panelhead"><h2>Add Product</h2></div><form className="formgrid" onSubmit={add}>{[['name','Product name'],['sku','SKU'],['purchase_price','Purchase price'],['selling_price','Selling price'],['stock','Opening stock'],['unit','Unit']].map(([k,p])=><input key={k} required={k==='name'||k==='selling_price'} type={k.includes('price')||k==='stock'?'number':'text'} placeholder={p} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>) }<button className="primary"><Plus size={18}/>Add Product</button></form></section>
 <section className="panel"><div className="panelhead"><h2>Products</h2><span>{products.length} items</span></div><div className="tablewrap"><table><thead><tr><th>Name</th><th>SKU</th><th>Sale Price</th><th>Stock</th><th></th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.sku||'—'}</td><td>{money(p.selling_price)}</td><td><span className={Number(p.stock)<=Number(p.min_stock||5)?'badge danger':'badge'}>{p.stock} {p.unit||'pcs'}</span></td><td><button className="iconbtn" onClick={()=>del(p.id)}><Trash2 size={17}/></button></td></tr>)}</tbody></table></div>{!products.length&&<Empty text="No products found" />}</section></>
}
function Customers({form,setForm,add,customers}){
 return <><section className="panel"><div className="panelhead"><h2>Add Customer</h2></div><form className="formgrid" onSubmit={add}><input required placeholder="Customer name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/><button className="primary"><Plus size={18}/>Add Customer</button></form></section><section className="panel"><div className="panelhead"><h2>Customers</h2><span>{customers.length}</span></div><div className="tablewrap"><table><thead><tr><th>Name</th><th>Phone</th><th>Address</th></tr></thead><tbody>{customers.map(c=><tr key={c.id}><td><b>{c.name}</b></td><td>{c.phone||'—'}</td><td>{c.address||'—'}</td></tr>)}</tbody></table></div>{!customers.length&&<Empty text="No customers yet" />}</section></>
}
function Sales({sales}){return <section className="panel"><div className="panelhead"><h2>Sales</h2><span>{sales.length} records</span></div><div className="tablewrap"><table><thead><tr><th>Invoice</th><th>Date</th><th>Total</th><th>Paid</th><th>Due</th></tr></thead><tbody>{sales.map(s=><tr key={s.id}><td>{s.invoice_no||`#${s.id}`}</td><td>{new Date(s.sale_date).toLocaleDateString('en-IN')}</td><td>{money(s.total)}</td><td>{money(s.paid_amount)}</td><td>{money(s.due_amount)}</td></tr>)}</tbody></table></div>{!sales.length&&<Empty text="No sales yet" />}</section>}
function Payments({sales}){return <section className="panel"><div className="panelhead"><h2>Payment Overview</h2></div><div className="cards mini"><Card title="Paid" value={money(sales.reduce((a,s)=>a+Number(s.paid_amount||0),0))} icon={CreditCard}/><Card title="Due" value={money(sales.reduce((a,s)=>a+Number(s.due_amount||0),0))} icon={CreditCard}/></div></section>}
function Empty({text}){return <div className="empty">{text}</div>}

createRoot(document.getElementById('root')).render(<App/>);
