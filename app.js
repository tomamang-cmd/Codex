const { createClient } = window.supabase;

const supabaseClient = createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.key
);

const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modalContent');
const fileInput = document.querySelector('#fileInput');

let currentDay = 1;
let currentUser = localStorage.getItem('travelmate-user') || '訪客';
let editorPassword = sessionStorage.getItem('travelmate-password') || '';
let editorEnabled = false;

const closeModal = () => modal.classList.remove('show');

const openModal = (html) => {
  modalContent.innerHTML = html;
  modal.classList.add('show');
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const isEditor = () =>
  editorEnabled && ['幽靈', '虹妃'].includes(currentUser);

function showMessage(message) {
  openModal(`
    <h2>旅伴</h2>
    <p>${escapeHtml(message)}</p>
    <button class="confirm">知道了</button>
  `);
}

function addUserControls() {
  const actions = document.querySelector('.header-actions');

  actions.insertAdjacentHTML(
    'afterbegin',
    `
      <select id="userSelect" aria-label="選擇使用者">
        <option value="幽靈">幽靈</option>
        <option value="虹妃">虹妃</option>
        <option value="訪客">訪客</option>
      </select>
      <button class="invite" id="editorButton">進入編輯模式</button>
    `
  );

  const select = document.querySelector('#userSelect');
  select.value = currentUser;

  select.addEventListener('change', () => {
    currentUser = select.value;
    localStorage.setItem('travelmate-user', currentUser);
    editorEnabled = false;
    editorPassword = '';
    sessionStorage.removeItem('travelmate-password');
    updateEditorInterface();
  });

  document.querySelector('#editorButton').addEventListener('click', () => {
    if (isEditor()) {
      editorEnabled = false;
      editorPassword = '';
      sessionStorage.removeItem('travelmate-password');
      updateEditorInterface();
      return;
    }

    if (currentUser === '訪客') {
      showMessage('訪客只能瀏覽行程。請選擇「幽靈」或「虹妃」後輸入管理密碼。');
      return;
    }

    openModal(`
      <h2>進入編輯模式</h2>
      <p>使用者：${escapeHtml(currentUser)}</p>
      <label>管理密碼</label>
      <input id="passwordInput" type="password" placeholder="輸入管理密碼">
      <button class="confirm" id="verifyPassword">進入編輯模式</button>
    `);
  });
}

function updateEditorInterface() {
  const button = document.querySelector('#editorButton');
  const addPlace = document.querySelector('#addPlace');
  const addMemory = document.querySelector('#addMemory');
  const addReceipt = document.querySelector('#addReceipt');
  const receiptUpload = document.querySelector('#receiptUpload');

  button.textContent = isEditor() ? '離開編輯模式' : '進入編輯模式';

  [addPlace, addMemory, addReceipt, receiptUpload].forEach((button) => {
    if (button) button.style.display = isEditor() ? '' : 'none';
  });

  document.querySelectorAll('.delete-place').forEach((button) => {
    button.style.display = isEditor() ? '' : 'none';
  });
}

async function loadItinerary() {
  const panel = document.querySelector(`#day${currentDay}`);

  const { data, error } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('day_number', currentDay)
    .order('sort_order', { ascending: true })
    .order('time_text', { ascending: true });

  if (error) {
    panel.innerHTML = `<div class="empty"><div>☁️<h3>暫時無法讀取行程</h3><p>${escapeHtml(error.message)}</p></div></div>`;
    return;
  }

  if (!data.length) {
    panel.innerHTML = `<div class="empty"><div>🌿<h3>這一天還沒有行程</h3><p>${isEditor() ? '點「加入景點」開始規劃。' : '請等待旅伴新增行程。'}</p></div></div>`;
    return;
  }

  panel.innerHTML = data
    .map(
      (item) => `
        <article class="place-card">
          <div class="time"><b>${escapeHtml(item.time_text)}</b><span>${escapeHtml(item.category)}</span></div>
          <div class="timeline-dot spot">●</div>
          <img src="${escapeHtml(item.image_url || 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=480&q=85')}" alt="${escapeHtml(item.title)}">
          <div class="place-info">
            <div class="place-type green">${escapeHtml(item.category)}</div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            ${item.map_url ? `<a href="${escapeHtml(item.map_url)}" target="_blank" rel="noopener">⌖ 在 Google 地圖開啟</a>` : ''}
            <p style="margin-top:8px;font-size:10px">新增者：${escapeHtml(item.author)}</p>
          </div>
          <button class="more delete-place" data-id="${item.id}" aria-label="刪除行程">×</button>
        </article>
      `
    )
    .join('');

  updateEditorInterface();
}

function addPlaceDialog() {
  if (!isEditor()) {
    showMessage('只有幽靈或虹妃輸入管理密碼後可以新增行程。');
    return;
  }

  openModal(`
    <h2>加入新的景點</h2>
    <p>新增後所有旅伴重新整理網站就會看到。</p>
    <label>景點名稱</label>
    <input id="placeTitle" placeholder="例如：瀨長島 Umikaji Terrace">
    <label>預計時間</label>
    <input id="placeTime" type="time" value="18:00">
    <label>類型</label>
    <input id="placeCategory" value="景點">
    <label>說明</label>
    <input id="placeDescription" placeholder="例如：欣賞夕陽、吃晚餐">
    <label>Google Maps 連結（可留空）</label>
    <input id="placeMapUrl" placeholder="https://maps.google.com/...">
    <button class="confirm" id="savePlace">儲存行程</button>
  `);
}

async function savePlace() {
  const title = document.querySelector('#placeTitle').value.trim();

  if (!title) {
    showMessage('請先填寫景點名稱。');
    return;
  }

  const { error } = await supabaseClient.rpc('save_itinerary_item', {
    p_password: editorPassword,
    p_author: currentUser,
    p_day_number: currentDay,
    p_time_text: document.querySelector('#placeTime').value,
    p_category: document.querySelector('#placeCategory').value.trim() || '景點',
    p_title: title,
    p_description: document.querySelector('#placeDescription').value.trim(),
    p_map_url: document.querySelector('#placeMapUrl').value.trim(),
    p_image_url: null,
    p_sort_order: Date.now(),
    p_id: null
  });

  if (error) {
    showMessage(`儲存失敗：${error.message}`);
    return;
  }

  closeModal();
  loadItinerary();
}

async function deletePlace(id) {
  if (!isEditor()) return;

  if (!window.confirm('確定要刪除這個行程嗎？')) return;

  const { error } = await supabaseClient.rpc('delete_itinerary_item', {
    p_password: editorPassword,
    p_author: currentUser,
    p_id: id
  });

  if (error) {
    showMessage(`刪除失敗：${error.message}`);
    return;
  }

  loadItinerary();
}

document.querySelectorAll('.day-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.day-tab').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('.day-panel').forEach((item) => item.classList.remove('active'));

    tab.classList.add('active');
    currentDay = Number(tab.dataset.day.replace('day', ''));
    document.querySelector(`#day${currentDay}`).classList.add('active');
    loadItinerary();
  });
});

document.querySelector('#closeModal').addEventListener('click', closeModal);

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

document.querySelector('#addPlace').addEventListener('click', addPlaceDialog);

document.addEventListener('click', async (event) => {
  if (event.target.id === 'verifyPassword') {
    const password = document.querySelector('#passwordInput').value;

    const { data, error } = await supabaseClient.rpc('can_edit_trip', {
      p_password: password,
      p_author: currentUser
    });

    if (error || !data) {
      showMessage('管理密碼不正確，或此使用者沒有編輯權限。');
      return;
    }

    editorPassword = password;
    editorEnabled = true;
    sessionStorage.setItem('travelmate-password', password);
    closeModal();
    updateEditorInterface();
    loadItinerary();
  }

  if (event.target.id === 'savePlace') {
    savePlace();
  }

  if (event.target.classList.contains('delete-place')) {
    deletePlace(event.target.dataset.id);
  }

  if (event.target.classList.contains('confirm') && !event.target.id) {
    closeModal();
  }
});

addUserControls();
updateEditorInterface();
loadItinerary();
