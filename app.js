const modal = document.querySelector('#modal');
const content = document.querySelector('#modalContent');

const close = () => modal.classList.remove('show');

const open = (html) => {
  content.innerHTML = html;
  modal.classList.add('show');
};

document.querySelectorAll('.day-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.day-tab, .day-panel').forEach((element) => {
      element.classList.remove('active');
    });

    tab.classList.add('active');
    document.querySelector(`#${tab.dataset.day}`).classList.add('active');
  });
});

document.querySelector('#closeModal').addEventListener('click', close);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    close();
  }
});

document.querySelector('#inviteBtn').addEventListener('click', () => {
  open(`
    <h2>邀請旅伴</h2>
    <p>分享連結給同行的朋友，大家都能即時查看與編輯行程。</p>
    <label>邀請連結</label>
    <input value="tripmate.app/t/okinawa-2024" readonly>
    <button class="confirm" id="copyLink">複製邀請連結</button>
  `);
});

document.querySelector('#addPlace').addEventListener('click', () => {
  open(`
    <h2>加入新的景點</h2>
    <p>把想去的地方加進今天的行程。</p>
    <label>景點名稱</label>
    <input placeholder="例如：瀨長島 Umikaji Terrace">
    <label>預計時間</label>
    <input type="time" value="18:00">
    <button class="confirm">加入行程</button>
  `);
});

document.querySelector('#addMemory').addEventListener('click', () => {
  open(`
    <h2>留下旅途小記</h2>
    <p>分享此刻的風景和心情。</p>
    <label>你的心情</label>
    <input placeholder="沖繩的風好舒服！">
    <button class="confirm">發布小記</button>
  `);
});

document.querySelector('#newTrip').addEventListener('click', () => {
  open(`
    <h2>建立一趟新旅行</h2>
    <p>規劃下一個讓人期待的目的地。</p>
    <label>旅行名稱</label>
    <input placeholder="例如：北海道雪國之旅">
    <button class="confirm">開始規劃</button>
  `);
});

const fileInput = document.querySelector('#fileInput');

document.querySelectorAll('#addReceipt, #receiptUpload').forEach((button) => {
  button.addEventListener('click', () => {
    open(`
      <h2>收好這張發票</h2>
      <p>拍照或上傳收據，旅費明細就不會遺漏。</p>
      <div class="upload-preview" id="dropZone">
        ▧　點此拍照／選擇圖片
      </div>
      <button class="confirm">儲存收據</button>
    `);

    document.querySelector('#dropZone').addEventListener('click', () => {
      fileInput.click();
    });
  });
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  const zone = document.querySelector('#dropZone');

  if (!file || !zone) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    zone.innerHTML = `<img src="${reader.result}" alt="收據預覽">`;
  };

  reader.readAsDataURL(file);
});

document.addEventListener('click', (event) => {
  if (event.target.id === 'copyLink') {
    navigator.clipboard?.writeText('tripmate.app/t/okinawa-2024');
    event.target.textContent = '已複製！';
  }

  if (
    event.target.classList.contains('confirm') &&
    event.target.id !== 'copyLink'
  ) {
    close();
  }
});
