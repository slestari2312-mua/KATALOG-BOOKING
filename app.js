import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUSINESS_WHATSAPP, STORAGE_BUCKET } from './config.js';
const configured = !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR-');
const db = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const $ = s => document.querySelector(s);
let settings = {regular_price:200000,whatsapp_number:BUSINESS_WHATSAPP}, calendar, adminCalendar;
const fmt = n => new Intl.NumberFormat('id-ID').format(Number(n||0));
const esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const msg = (id,text) => { const e=$(id); if(e)e.textContent=text; };
const wa = text => { const n=String(settings.whatsapp_number||BUSINESS_WHATSAPP).replace(/\D/g,''); return n && !n.includes('xxxxxxxx') ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : '#'; };
function modal(id,on=true){$(id).classList.toggle('open',on)}
function updateContactLinks(){ $('#weddingLink').href=wa('Halo BYSL_MUA, saya ingin konsultasi layanan Wedding Makeup.'); $('#footerWa').href=wa('Halo BYSL_MUA, saya ingin bertanya tentang layanan makeup.'); const insta=String(settings.instagram||'@bysl_mua').replace(/^@/,'');const tik=String(settings.tiktok||'@bysl_mua').replace(/^@/,'');$('#instagramLink').href='https://www.instagram.com/'+encodeURIComponent(insta)+'/';$('#tiktokLink').href='https://www.tiktok.com/@'+encodeURIComponent(tik);const logo=settings.logo_url||'logo-bysl.jpg';document.querySelectorAll('.brand-logo,.hero-logo').forEach(i=>{i.src=logo}); }
async function loadSettings(){
 if(!db){updateContactLinks();return}
 const {data,error}=await db.from('site_settings').select('key,value'); if(error){console.error(error);return}
 for(const r of data||[]) settings[r.key]=r.value;
 $('#regularPrice').textContent=`Rp ${fmt(settings.regular_price)}`;
 $('#serviceType option:first-child').textContent=`Regular Makeup — Rp ${fmt(settings.regular_price)}`;
 $('#aboutCopy').textContent=settings.about_text||$('#aboutCopy').textContent;
 $('#contentForm [name=brand_name]').value=settings.brand_name||'MAKEUP ARTIST BY Siti Lestari';
 $('#contentForm [name=regular_price]').value=settings.regular_price||200000;

 $('#contentForm [name=whatsapp_number]').value=settings.whatsapp_number||'';
 $('#contentForm [name=instagram]').value=settings.instagram||'@bysl_mua';$('#contentForm [name=tiktok]').value=settings.tiktok||'@bysl_mua';
 $('#contentForm [name=about_text]').value=settings.about_text||'';
 updateContactLinks();
}
// A day is "Full booked" only when no continuous 60-minute slot remains.
// Pending requests do not reserve time. Legacy confirmed bookings without a
// makeup start time are shown as Booked and require admin reconciliation.
function dayAvailability(row){
 if(row.blocked)return 'blocked';
 const slots=(Array.isArray(row.occupied_slots)?row.occupied_slots:[]).map(v=>{
   const match=/^(\d{2}):(\d{2})$/.exec(String(v.start||''));
   if(!match)return null;
   const start=Number(match[1])*60+Number(match[2]);
   return {start,end:Math.min(1440,start+Number(v.minutes||0))};
 }).filter(Boolean).sort((a,b)=>a.start-b.start);
 if(row.legacy_unscheduled)return 'booked';
 if(!slots.length)return 'available';
 let cursor=0;
 for(const slot of slots){if(slot.start-cursor>=60)return 'booked';cursor=Math.max(cursor,slot.end)}
 return 1440-cursor>=60?'booked':'full';
}
async function calendarEvents(start,end){
 if(!db)return [];
 const {data,error}=await db.rpc('get_public_calendar_v2',{start_date:start,end_date:end});
 if(error){console.error('Calendar RPC v2:',error);return []}
 return (data||[]).map(r=>{const status=dayAvailability(r),title=status==='blocked'?'Unavailable':status==='full'?'Full booked':status==='booked'?'Booked · cek jam tersedia':'Available';return {id:r.event_date,title,start:r.event_date,allDay:true,classNames:['event-'+status],extendedProps:{status}};});
}
async function makeCalendar(el,isAdmin=false){
 const c=new FullCalendar.Calendar(el,{initialView:'dayGridMonth',height:'auto',locale:'id',headerToolbar:{left:'prev,next today',center:'title',right:''},buttonText:{today:'Hari ini'},events:async(info,success)=>{const start=info.startStr.slice(0,10),end=info.endStr.slice(0,10);if(isAdmin){const {data,error}=await db.from('bookings').select('id,event_date,status,customer_name,service_type,makeup_start_time,client_count').gte('event_date',start).lte('event_date',end).in('status',['pending','booked','blocked']);if(error){console.error(error);success([]);return}success((data||[]).map(b=>({id:b.id,title:b.status==='pending'?'Pending':b.status==='blocked'?'Unavailable':`Booked ${b.makeup_start_time?.slice(0,5)||''} · ${b.customer_name}`,start:b.event_date,allDay:true,classNames:[`event-${b.status}`],extendedProps:b})));}else success(await calendarEvents(start,end));},dateClick:info=>{if(!isAdmin){const ev=c.getEvents().find(x=>x.startStr===info.dateStr);if(ev&&['blocked','full'].includes(ev.extendedProps.status)){alert('Tanggal ini tidak tersedia. Silakan pilih tanggal lain.');return}openBooking(info.dateStr)}},eventClick:info=>{if(isAdmin)adminEvent(info.event);else if(['available','booked'].includes(info.event.extendedProps.status))openBooking(info.event.startStr)}});c.render();return c;
}
function openBooking(date){$('#eventDate').value=date;$('#chosenDate').textContent=new Date(date+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});msg('#bookingMessage','');modal('#bookingModal')}
let clientSerial=0;
function addClient(){const list=$('#clientsList');if(list.children.length>=3)return;const id=++clientSerial;const card=document.createElement('div');card.className='client-card';card.innerHTML=`<div class="client-card-head"><h4>Klien ${list.children.length+1}</h4><button type="button" class="remove-client" aria-label="Hapus klien">Hapus</button></div><label>Nama klien<input name="client_name_${id}" maxlength="100" required placeholder="Nama klien"></label><label>Add-on layanan rambut<select name="hair_${id}"><option value="Tidak">Tidak</option><option value="Hairdo">Hairdo</option><option value="Hijabdo+">Hijabdo+</option></select></label><label>Catatan model rambut/hijab<input name="client_notes_${id}" maxlength="500" placeholder="Contoh: hairdo low bun"></label>`;card.dataset.id=id;card.querySelector('.remove-client').onclick=()=>{if(list.children.length===1)return;card.remove();refreshClients()};list.append(card);refreshClients()}
function refreshClients(){[...$('#clientsList').children].forEach((c,i)=>c.querySelector('h4').textContent='Klien '+(i+1));$('#addClient').disabled=$('#clientsList').children.length>=3;$('.client-card .remove-client').disabled=$('#clientsList').children.length===1}
$('#addClient').addEventListener('click',addClient);addClient();
$('#bookingForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db){msg('#bookingMessage','Website belum terhubung ke Supabase. Lengkapi config.js terlebih dahulu.');return}
 const f=new FormData(e.currentTarget),v=Object.fromEntries(f.entries()),clients=[...$('#clientsList').children].map(c=>{const id=c.dataset.id;return {name:String(v['client_name_'+id]||'').trim(),hair_service:v['hair_'+id],notes:v['client_notes_'+id]||''}});const button=$('#sendBooking');
 if(clients.some(c=>!c.name)){msg('#bookingMessage','Isi nama semua klien.');return}
 if(!/^https:\/\/(maps\.app\.goo\.gl|www\.google\.com|google\.com|goo\.gl)\//i.test(v.maps_link)){msg('#bookingMessage','Masukkan link Google Maps yang valid (https://maps.app.goo.gl/...).');return}
 button.disabled=true;button.textContent='Mengirim...';
 try{
  const {error}=await db.rpc('create_booking_request_v2',{p_customer_name:v.customer_name,p_whatsapp:v.whatsapp,p_customer_instagram:v.customer_instagram||'',p_referral_source:v.referral_source,p_event_date:v.event_date,p_event_time:v.event_time,p_makeup_start_time:v.makeup_start_time||null,p_service_type:v.service_type,p_event_type:v.event_type,p_maps_link:v.maps_link,p_notes:v.notes||'',p_clients:clients});if(error)throw error;
  msg('#bookingMessage','Permintaan berhasil disimpan (Pending). Silakan lanjutkan konfirmasi lewat WhatsApp.');
  const details=clients.map((c,i)=>`${i+1}. ${c.name} — ${c.hair_service}${c.notes?' ('+c.notes+')':''}`).join('\n');
  const text=`Halo BYSL_MUA, saya sudah mengirim permintaan booking melalui website.\nNama: ${v.customer_name}\nWhatsApp: ${v.whatsapp}\nInstagram: ${v.customer_instagram||'-'}\nTahu BYSL dari: ${v.referral_source}\nTanggal: ${v.event_date}\nAcara: ${v.event_type}\nJam acara: ${v.event_time}\nMulai makeup: ${v.makeup_start_time||'Mohon ditentukan admin'}\nLayanan: ${v.service_type}\nKlien (${clients.length}):\n${details}\nGoogle Maps: ${v.maps_link}\nCatatan: ${v.notes||'-'}\nMohon informasi DP. Saya memahami booking menunggu persetujuan admin.`;
  const link=wa(text);if(link!=='#'){const a=document.createElement('a');a.href=link;a.target='_blank';a.rel='noopener';a.textContent='Buka WhatsApp untuk konfirmasi';a.className='btn outline full';$('#bookingMessage').after(a);a.click()}
  calendar?.refetchEvents();
 }catch(err){console.error(err);msg('#bookingMessage',err.message||'Gagal mengirim. Silakan coba lagi.')}finally{button.disabled=false;button.textContent='Kirim permintaan & lanjut WhatsApp'}
});
async function adminCheck(){const {data}=await db.auth.getUser();if(!data.user)return false;const {data:ok,error}=await db.rpc('is_current_user_bysl_admin');return !error&&ok===true}
async function openDashboard(){if(!db){modal('#loginModal');msg('#loginMessage','Konfigurasi Supabase belum diisi.');return}const {data}=await db.auth.getSession();if(!data.session){modal('#loginModal');return}if(!await adminCheck()){msg('#loginMessage','Akun belum terdaftar sebagai admin.');await db.auth.signOut();modal('#loginModal');return}$('#dashboard').classList.add('open');await loadRequests();if(!adminCalendar)adminCalendar=await makeCalendar($('#adminCalendar'),true);else adminCalendar.refetchEvents()}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();if(!db)return;const f=new FormData(e.currentTarget);const {error}=await db.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error){msg('#loginMessage',error.message);return}modal('#loginModal',false);await openDashboard()});
$('#logout').addEventListener('click',async()=>{await db.auth.signOut();$('#dashboard').classList.remove('open')});
async function loadRequests(){const el=$('#requestsList');el.textContent='Loading...';const {data,error}=await db.from('bookings').select('*').order('created_at',{ascending:false});if(error){el.textContent=error.message;return}if(!data?.length){el.textContent='Belum ada permintaan booking.';return}el.innerHTML=data.map(b=>`<article class="request"><h4>${esc(b.customer_name)} · ${esc(b.service_type)}</h4><p><b>${esc(b.event_date)} ${esc(b.event_time||'')}</b><br>${esc(b.event_type||'')} · ${esc(b.location||'')}<br>WhatsApp: ${esc(b.whatsapp||'')}<br>Status: <b>${esc(b.status)}</b><br>Mulai makeup: ${esc(b.makeup_start_time||'Belum ditentukan')} · ${esc(b.client_count||1)} klien<br>Instagram: ${esc(b.customer_instagram||'-')} · Sumber: ${esc(b.referral_source||'-')}<br>Google Maps: ${b.maps_link?`<a href="${esc(b.maps_link)}" target="_blank" rel="noopener">Buka lokasi</a>`:'-'}<br>Detail klien: ${esc(JSON.stringify(b.clients||[]))}<br>Catatan: ${esc(b.notes||'-')}</p><div class="request-actions">${b.status==='pending'?`<button class="btn dark" data-act="approve" data-id="${b.id}">Approve (DP verified)</button><button class="btn outline" data-act="reject" data-id="${b.id}">Reject</button>`:''}<button class="btn outline" data-act="delete" data-id="${b.id}">Delete</button></div></article>`).join('');el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>bookingAction(b.dataset.id,b.dataset.act)))}
async function bookingAction(id,action){if(action==='delete'&&!confirm('Hapus booking ini?'))return;if(action==='approve'&&!confirm('DP sudah diterima dan diverifikasi? Lanjutkan persetujuan booking?'))return;let result;if(action==='approve'){const {data:record,error:fetchError}=await db.from('bookings').select('makeup_start_time').eq('id',id).single();if(fetchError){alert(fetchError.message);return}let start=record.makeup_start_time;if(!start){start=prompt('Masukkan jam mulai makeup (HH:MM) sebelum approve:');if(!start)return}result=await db.rpc('approve_booking_v2',{p_booking_id:id,p_makeup_start_time:start});}else if(action==='reject')result=await db.from('bookings').update({status:'rejected'}).eq('id',id);else result=await db.from('bookings').delete().eq('id',id);if(result.error)alert(result.error.message);else if(result.data?.ok===false)alert(result.data.message||'Tidak dapat menyetujui booking.');await loadRequests();calendar?.refetchEvents();adminCalendar?.refetchEvents()}
function adminEvent(ev){const p=ev.extendedProps;if(confirm(`${ev.title} · ${ev.startStr}\n${p.customer_name||''}\nHapus entri ini?`)){db.from('bookings').delete().eq('id',ev.id).then(({error})=>{if(error)alert(error.message);loadRequests();calendar?.refetchEvents();adminCalendar?.refetchEvents()})}}
$('#manualForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(f.get('status')==='booked'&&!f.get('makeup_start_time')){alert('Jam mulai wajib untuk booking manual.');return}const {error}=await db.from('bookings').insert({customer_name:f.get('customer_name'),event_date:f.get('event_date'),status:f.get('status'),notes:f.get('notes'),service_type:'Admin entry',makeup_start_time:f.get('status')==='booked'?(f.get('makeup_start_time')||null):null,client_count:f.get('status')==='booked'?Number(f.get('client_count')||1):1});if(error)alert(error.message);else{alert('Kalender diperbarui.');e.currentTarget.reset();calendar?.refetchEvents();adminCalendar?.refetchEvents()}});
$('#contentForm').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget),values={brand_name:f.get('brand_name'),regular_price:Number(f.get('regular_price')),whatsapp_number:f.get('whatsapp_number'),instagram:f.get('instagram'),tiktok:f.get('tiktok'),about_text:f.get('about_text')};for(const [key,value] of Object.entries(values)){const {error}=await db.from('site_settings').upsert({key,value},{onConflict:'key'});if(error){alert(error.message);return}}await loadSettings();calendar?.refetchEvents();alert('Pengaturan berhasil disimpan.')});
async function upload(file,path){const {error}=await db.storage.from(STORAGE_BUCKET).upload(path,file,{upsert:false,contentType:file.type});if(error)throw error;return db.storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl}
$('#logoForm').addEventListener('submit',async e=>{e.preventDefault();const file=e.currentTarget.logo.files[0];if(!file)return;try{const path=`logo/${Date.now()}-${file.name.replace(/[^\w.-]/g,'_')}`,url=await upload(file,path);const {error}=await db.from('site_settings').upsert({key:'logo_url',value:url},{onConflict:'key'});if(error)throw error;settings.logo_url=url;updateContactLinks();alert('Logo berhasil diperbarui.')}catch(err){alert(err.message)}});
$('#refresh').addEventListener('click',loadRequests);document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{document.querySelectorAll('.tab,.tab-panel').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#panel-'+t.dataset.tab).classList.add('active');adminCalendar?.updateSize()}));
$('#adminShortcut').addEventListener('click',openDashboard);$('#closeDashboard').addEventListener('click',()=>$('#dashboard').classList.remove('open'));$('#closeBooking').addEventListener('click',()=>modal('#bookingModal',false));$('#closeLogin').addEventListener('click',()=>modal('#loginModal',false));$('#hamb').addEventListener('click',()=>$('#nav').classList.toggle('open'));document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>$('#nav').classList.remove('open')));$('#year').textContent=new Date().getFullYear();
if(!configured){console.info('BYSL_MUA: isi config.js untuk mengaktifkan backend Supabase.')}else{await loadSettings();}
calendar=await makeCalendar($('#calendar'));
