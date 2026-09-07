const DB = {
  employees: {
    NV001: {
      id:'NV001', name:'Nguyễn Văn An', initials:'NA', branch:'HCM', department:'Kinh doanh', position:'Nhân viên kinh doanh',
      phone:'0900 123 456', email:'an.nguyen@example.local', joined:'2024-03-18', status:'Đang làm việc', manager:'Trần Minh Khoa',
      attendance:[
        {date:'2026-09-01', type:'Đi làm', in:'08:02', out:'17:18', note:''},
        {date:'2026-09-02', type:'Đi làm', in:'07:58', out:'17:11', note:''},
        {date:'2026-09-03', type:'Công tác', in:'08:10', out:'16:55', note:'Gặp khách hàng'},
        {date:'2026-09-04', type:'Đi làm', in:'08:05', out:'17:20', note:''},
        {date:'2026-09-05', type:'Nghỉ phép', in:'', out:'', note:'Phép năm'}
      ]
    }
  },
  items: {
    MH001: {
      id:'MH001', name:'Cà phê rang 500g', unit:'Gói', branch:'HCM', warehouse:'KH-HCM', category:'Thành phẩm',
      stock:1280, reserved:145, available:1135, pendingOrders:7, unitPrice:89000,
      movements:[
        {date:'2026-08-28', doc:'PN0826/0145', type:'Nhập', qty:500, partner:'Nhà cung cấp A'},
        {date:'2026-08-30', doc:'PX0826/0221', type:'Xuất', qty:-120, partner:'Khách hàng Minh Phát'},
        {date:'2026-09-01', doc:'PX0926/0008', type:'Xuất', qty:-80, partner:'Khách hàng Hoàng Gia'},
        {date:'2026-09-03', doc:'PN0926/0019', type:'Nhập', qty:300, partner:'Nhà cung cấp A'},
        {date:'2026-09-05', doc:'PX0926/0042', type:'Xuất', qty:-65, partner:'Khách hàng An Khang'}
      ],
      outboundOrders:[
        {order:'SO0926/0101', customer:'Minh Phát', qty:40, shipDate:'2026-09-08', status:'Chờ xuất'},
        {order:'SO0926/0108', customer:'Hoàng Gia', qty:25, shipDate:'2026-09-09', status:'Đã duyệt'},
        {order:'SO0926/0115', customer:'An Khang', qty:80, shipDate:'2026-09-10', status:'Chờ xuất'}
      ]
    }
  }
};

const $ = s => document.querySelector(s);
const params = new URLSearchParams(location.search);
const type = params.get('type');
const id = params.get('id');

function esc(v=''){ return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }
function money(v){ return new Intl.NumberFormat('vi-VN').format(v) + ' đ'; }
function dateInRange(date, from, to){ return (!from || date >= from) && (!to || date <= to); }
function demoPayload(kind){ return kind==='employee' ? 'E:NV001' : 'I:MH001'; }

function renderDemoQR(kind){
  const target = kind === 'employee' ? $('#employeeQr') : $('#itemQr');
  if (!target || target.dataset.ready) return;
  target.dataset.ready = '1';
  new QRCode(target, { text: demoPayload(kind), width:180, height:180, correctLevel:QRCode.CorrectLevel.L });
}

document.querySelectorAll('[data-demo-qr]').forEach(btn => btn.addEventListener('click', () => renderDemoQR(btn.dataset.demoQr)));

function renderSearchResults(){
  const q = ($('#quickSearch')?.value || '').trim().toLowerCase();
  const branch = $('#branchFilter')?.value || '';
  const results = [];
  Object.values(DB.employees).forEach(x => {
    const hay = `${x.id} ${x.name} ${x.department} ${x.position}`.toLowerCase();
    if ((!q || hay.includes(q)) && (!branch || x.branch===branch)) results.push({type:'employee', id:x.id, title:`${x.id} · ${x.name}`, sub:`${x.department} · ${x.position}`});
  });
  Object.values(DB.items).forEach(x => {
    const hay = `${x.id} ${x.name} ${x.category} ${x.warehouse}`.toLowerCase();
    if ((!q || hay.includes(q)) && (!branch || x.branch===branch)) results.push({type:'item', id:x.id, title:`${x.id} · ${x.name}`, sub:`Kho ${x.warehouse} · Tồn ${x.stock.toLocaleString('vi-VN')} ${x.unit}`});
  });
  const box = $('#searchResults'); if (!box) return;
  box.innerHTML = results.length ? results.map(r => `<a class="list-group-item list-group-item-action px-0" href="?type=${r.type}&id=${r.id}"><div class="fw-semibold">${esc(r.title)}</div><div class="small text-secondary">${esc(r.sub)}</div></a>`).join('') : '<div class="text-secondary small py-3">Không có kết quả phù hợp.</div>';
}

function employeeView(x){
  const from=$('#fromDate').value, to=$('#toDate').value;
  const rows=x.attendance.filter(r=>dateInRange(r.date,from,to));
  return `
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
      <a href="./index.html" class="btn btn-outline-secondary btn-sm">← Trang chính</a>
      <span class="badge text-bg-primary">NHÂN SỰ</span>
    </div>
    <div class="card border-0 shadow-sm mb-3"><div class="card-body p-3 p-md-4">
      <div class="d-flex gap-3 align-items-center flex-wrap">
        <div class="profile-avatar">${esc(x.initials)}</div>
        <div class="flex-grow-1"><div class="text-secondary small">${esc(x.id)}</div><h1 class="h4 fw-bold mb-1">${esc(x.name)}</h1><div>${esc(x.position)} · ${esc(x.department)}</div></div>
        <div><span class="badge text-bg-success"><span class="status-dot bg-white"></span>${esc(x.status)}</span></div>
      </div>
      <hr>
      <div class="row g-3 small">
        <div class="col-6 col-lg-3"><div class="text-secondary">Chi nhánh</div><strong>${esc(x.branch)}</strong></div>
        <div class="col-6 col-lg-3"><div class="text-secondary">Ngày vào làm</div><strong>${esc(x.joined)}</strong></div>
        <div class="col-6 col-lg-3"><div class="text-secondary">Quản lý</div><strong>${esc(x.manager)}</strong></div>
        <div class="col-6 col-lg-3"><div class="text-secondary">Liên hệ</div><strong>${esc(x.phone)}</strong></div>
        <div class="col-12"><div class="text-secondary">Email</div><strong>${esc(x.email)}</strong></div>
      </div>
    </div></div>
    <div class="card border-0 shadow-sm"><div class="card-body p-0">
      <div class="p-3 border-bottom d-flex justify-content-between align-items-center"><h2 class="h6 fw-bold mb-0">Lịch sử chấm công</h2><span class="small text-secondary">${rows.length} dòng</span></div>
      <div class="table-wrap"><table class="table table-hover table-sm mb-0 align-middle"><thead class="table-light"><tr><th>Ngày</th><th>Loại</th><th>Vào</th><th>Ra</th><th>Ghi chú</th></tr></thead><tbody>
      ${rows.map(r=>`<tr><td>${r.date}</td><td>${esc(r.type)}</td><td>${esc(r.in)}</td><td>${esc(r.out)}</td><td>${esc(r.note)}</td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-secondary py-4">Không có dữ liệu trong khoảng ngày.</td></tr>'}
      </tbody></table></div>
    </div></div>`;
}

function itemView(x){
  const from=$('#fromDate').value, to=$('#toDate').value;
  const rows=x.movements.filter(r=>dateInRange(r.date,from,to));
  return `
    <div class="d-flex align-items-center justify-content-between mb-3 gap-2 flex-wrap">
      <a href="./index.html" class="btn btn-outline-secondary btn-sm">← Trang chính</a>
      <span class="badge text-bg-success">MÃ HÀNG</span>
    </div>
    <div class="card border-0 shadow-sm mb-3"><div class="card-body p-3 p-md-4">
      <div class="text-secondary small">${esc(x.id)} · ${esc(x.category)}</div><h1 class="h4 fw-bold mb-1">${esc(x.name)}</h1><div class="text-secondary">Kho ${esc(x.warehouse)} · Chi nhánh ${esc(x.branch)} · ĐVT ${esc(x.unit)}</div>
    </div></div>
    <div class="row g-3 mb-3">
      <div class="col-6 col-lg-3"><div class="metric"><div class="small text-secondary">Tồn kho</div><div class="value">${x.stock.toLocaleString('vi-VN')}</div><div class="small">${esc(x.unit)}</div></div></div>
      <div class="col-6 col-lg-3"><div class="metric"><div class="small text-secondary">Khả dụng</div><div class="value text-success">${x.available.toLocaleString('vi-VN')}</div><div class="small">${esc(x.unit)}</div></div></div>
      <div class="col-6 col-lg-3"><div class="metric"><div class="small text-secondary">Đang giữ</div><div class="value text-warning">${x.reserved.toLocaleString('vi-VN')}</div><div class="small">${esc(x.unit)}</div></div></div>
      <div class="col-6 col-lg-3"><div class="metric"><div class="small text-secondary">Đơn chờ xuất</div><div class="value text-primary">${x.pendingOrders}</div><div class="small">Giá ${money(x.unitPrice)}</div></div></div>
    </div>
    <div class="row g-3">
      <div class="col-12 col-xl-7"><div class="card border-0 shadow-sm h-100"><div class="card-body p-0">
        <div class="p-3 border-bottom d-flex justify-content-between"><h2 class="h6 fw-bold mb-0">Lịch sử nhập / xuất</h2><span class="small text-secondary">${rows.length} dòng</span></div>
        <div class="table-wrap"><table class="table table-hover table-sm mb-0 align-middle"><thead class="table-light"><tr><th>Ngày</th><th>Chứng từ</th><th>Loại</th><th class="text-end">SL</th><th>Đối tác</th></tr></thead><tbody>
        ${rows.map(r=>`<tr><td>${r.date}</td><td>${esc(r.doc)}</td><td><span class="badge ${r.qty>0?'text-bg-success':'text-bg-danger'}">${esc(r.type)}</span></td><td class="text-end fw-semibold">${r.qty>0?'+':''}${r.qty}</td><td>${esc(r.partner)}</td></tr>`).join('') || '<tr><td colspan="5" class="text-center text-secondary py-4">Không có dữ liệu trong khoảng ngày.</td></tr>'}
        </tbody></table></div>
      </div></div></div>
      <div class="col-12 col-xl-5"><div class="card border-0 shadow-sm h-100"><div class="card-body p-0">
        <div class="p-3 border-bottom"><h2 class="h6 fw-bold mb-0">Đơn xuất sắp tới</h2></div>
        <div class="table-wrap"><table class="table table-sm mb-0 align-middle"><thead class="table-light"><tr><th>Đơn</th><th>Khách</th><th class="text-end">SL</th><th>Ngày</th></tr></thead><tbody>
        ${x.outboundOrders.map(r=>`<tr><td>${esc(r.order)}</td><td>${esc(r.customer)}</td><td class="text-end">${r.qty}</td><td>${r.shipDate}<div class="small text-secondary">${esc(r.status)}</div></td></tr>`).join('')}
        </tbody></table></div>
      </div></div></div>
    </div>`;
}

function renderDetail(){
  const detail=$('#detailView');
  if (!type || !id) { $('#homeView').classList.remove('d-none'); detail.classList.add('d-none'); renderSearchResults(); return; }
  let html='';
  if (type==='employee' && DB.employees[id]) html=employeeView(DB.employees[id]);
  else if (type==='item' && DB.items[id]) html=itemView(DB.items[id]);
  else html='<div class="alert alert-warning">Không tìm thấy dữ liệu cho QR này.</div>';
  $('#homeView').classList.add('d-none'); detail.classList.remove('d-none'); detail.innerHTML=html;
}

function resetFilters(){ $('#quickSearch').value=''; $('#fromDate').value=''; $('#toDate').value=''; $('#branchFilter').value=''; renderDetail(); }

$('#btnSearch').addEventListener('click', renderDetail);
$('#btnReset').addEventListener('click', resetFilters);
$('#quickSearch').addEventListener('input', () => { if (!type) renderSearchResults(); });
$('#branchFilter').addEventListener('change', () => { if (!type) renderSearchResults(); });

let scanner=null, nativeStream=null, nativeStop=false, nativeBusy=false;
const modal=new bootstrap.Modal('#scannerModal');

function handleScan(decoded){
  const value=String(decoded||'').trim();
  if (!value) return false;
  if (navigator.vibrate) navigator.vibrate(35);
  if (/^https?:\/\//i.test(value)) { location.href=value; return true; }
  let m=value.match(/^E:([A-Za-z0-9_-]+)$/i);
  if (m) { location.href=`?type=employee&id=${encodeURIComponent(m[1])}`; return true; }
  m=value.match(/^I:([A-Za-z0-9_-]+)$/i);
  if (m) { location.href=`?type=item&id=${encodeURIComponent(m[1])}`; return true; }
  m=value.match(/^(employee|item):([A-Za-z0-9_-]+)$/i);
  if (m) { location.href=`?type=${m[1].toLowerCase()}&id=${encodeURIComponent(m[2])}`; return true; }
  return false;
}

async function stopNativeScanner(){
  nativeStop=true;
  if (nativeStream) nativeStream.getTracks().forEach(t=>t.stop());
  nativeStream=null;
  nativeBusy=false;
}

async function startNativeScanner(){
  if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) return false;
  let formats=[];
  try { formats=await BarcodeDetector.getSupportedFormats(); } catch(e) {}
  if (formats.length && !formats.includes('qr_code')) return false;

  const root=$('#qrReader');
  root.innerHTML=`<div class="position-relative overflow-hidden rounded-3 bg-dark"><video id="fastQrVideo" autoplay playsinline muted style="width:100%;display:block;aspect-ratio:4/3;object-fit:cover"></video><div style="position:absolute;inset:18%;border:3px solid rgba(255,255,255,.95);border-radius:18px;box-shadow:0 0 0 9999px rgba(0,0,0,.18);pointer-events:none"></div><span class="badge text-bg-success position-absolute top-0 start-0 m-2">FAST · Native</span></div>`;
  const video=$('#fastQrVideo');
  nativeStop=false;
  nativeStream=await navigator.mediaDevices.getUserMedia({
    audio:false,
    video:{facingMode:{ideal:'environment'},width:{ideal:640,max:1280},height:{ideal:480,max:720},frameRate:{ideal:30,max:30}}
  });
  video.srcObject=nativeStream;
  await video.play();

  const track=nativeStream.getVideoTracks()[0];
  try {
    const caps=track.getCapabilities?.()||{};
    if (caps.focusMode?.includes('continuous')) await track.applyConstraints({advanced:[{focusMode:'continuous'}]});
  } catch(e) {}

  const detector=new BarcodeDetector({formats:['qr_code']});
  const canvas=document.createElement('canvas');
  const ctx=canvas.getContext('2d',{willReadFrequently:false});
  let lastFrame=0;

  const loop=async now=>{
    if (nativeStop) return;
    if (!nativeBusy && video.readyState>=2 && now-lastFrame>45) {
      nativeBusy=true; lastFrame=now;
      try {
        const vw=video.videoWidth||640, vh=video.videoHeight||480;
        const size=Math.max(220,Math.floor(Math.min(vw,vh)*0.68));
        const sx=Math.max(0,Math.floor((vw-size)/2));
        const sy=Math.max(0,Math.floor((vh-size)/2));
        canvas.width=size; canvas.height=size;
        ctx.drawImage(video,sx,sy,size,size,0,0,size,size);
        const codes=await detector.detect(canvas);
        if (codes?.length && handleScan(codes[0].rawValue)) return;
      } catch(e) {}
      nativeBusy=false;
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return true;
}

async function startFallbackScanner(){
  const root=$('#qrReader');
  root.innerHTML='';
  scanner=new Html5Qrcode('qrReader',{formatsToSupport:[Html5QrcodeSupportedFormats.QR_CODE],verbose:false});
  await scanner.start(
    {facingMode:'environment'},
    {fps:30,qrbox:(w,h)=>{const s=Math.floor(Math.min(w,h)*0.72);return {width:s,height:s};},aspectRatio:1.333333},
    decoded=>handleScan(decoded),
    ()=>{}
  );
}

$('#btnOpenScanner').addEventListener('click', () => modal.show());
document.getElementById('scannerModal').addEventListener('shown.bs.modal', async () => {
  try {
    const nativeOk=await startNativeScanner();
    if (!nativeOk) await startFallbackScanner();
  } catch(e) {
    try { await stopNativeScanner(); await startFallbackScanner(); }
    catch(e2) { $('#qrReader').innerHTML='<div class="alert alert-danger mb-0">Không mở được camera. Hãy kiểm tra quyền Camera và HTTPS.</div>'; }
  }
});

document.getElementById('scannerModal').addEventListener('hidden.bs.modal', async () => {
  await stopNativeScanner();
  if (scanner) { try { await scanner.stop(); } catch(e){} try { await scanner.clear(); } catch(e){} scanner=null; }
  $('#qrReader').innerHTML='';
});

renderDetail();
