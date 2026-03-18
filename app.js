// Полный функционал приложения ЖК Домовой
const DB = {
    init() {
        if (!localStorage.getItem('jk_domovoy')) {
            const defaultData = {
                user: { name: 'Алексей Власов', apartment: '142', building: '3', area: 65, tariff: 'Комфорт', phone: '+7 (999) 123-45-67', email: 'alexey@example.com' },
                messages: [
                    { id: 1, from: 'uk', text: 'Добрый день! Чем можем помочь?', time: '10:30', date: '18.03.2024' },
                    { id: 2, from: 'user', text: 'Здравствуйте, подскажите когда будет горячая вода?', time: '10:32', date: '18.03.2024' },
                    { id: 3, from: 'uk', text: 'По плану горячую воду включат 20 марта.', time: '10:35', date: '18.03.2024' }
                ],
                bills: [
                    { id: 1, period: 'Март 2024', amount: 4250, status: 'pending', heating: 1800, water: 650, electricity: 1200, maintenance: 600 },
                    { id: 2, period: 'Февраль 2024', amount: 3980, status: 'paid', paidDate: '28.02.2024' },
                    { id: 3, period: 'Январь 2024', amount: 4100, status: 'paid', paidDate: '25.01.2024' }
                ],
                passes: [
                    { id: 1, type: 'permanent', title: 'Постоянный пропуск', expires: '31.12.2024', status: 'active' },
                    { id: 2, type: 'car', title: 'Автомобиль', details: 'Mercedes E200, А777АА 77', status: 'active' },
                    { id: 3, type: 'temp', guest: 'Иван Петров', date: '14.03.2024', timeStart: '10:00', timeEnd: '18:00', status: 'pending' }
                ],
                masterRequests: [],
                settings: { notifications: true, email: true, sms: false }
            };
            localStorage.setItem('jk_domovoy', JSON.stringify(defaultData));
        }
        return JSON.parse(localStorage.getItem('jk_domovoy'));
    },
    save(data) { localStorage.setItem('jk_domovoy', JSON.stringify(data)); },
    get() { return JSON.parse(localStorage.getItem('jk_domovoy')); }
};

document.addEventListener('DOMContentLoaded', function() {
    const data = DB.init();
    initNavigation();
    renderChat(data);
    renderBills(data);
    renderPasses(data);
    renderProfile(data);
    initPWA();
});

function initNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId + '-section') section.classList.add('active');
            });
        });
    });
}

function renderChat(data) {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.innerHTML = data.messages.map(msg => {
        const isUK = msg.from === 'uk';
        return '<div class="message ' + msg.from + '"><div class="message-avatar">' + (isUK ? '<i class="fas fa-building"></i>' : getInitials(data.user.name)) + '</div><div class="message-content">' + (isUK ? '<span class="message-sender">УК "Домовой"</span>' : '') + '<p>' + msg.text + '</p><span class="message-time">' + msg.time + ' ' + msg.date + '</span></div></div>';
    }).join('');
    chatMessages.scrollTop = chatMessages.scrollHeight;
    document.getElementById('send-message').addEventListener('click', () => sendMessage(data));
    document.getElementById('message-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(data); });
}

function sendMessage(data) {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const date = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();
    data.messages.push({ id: data.messages.length + 1, from: 'user', text: text, time: time, date: date });
    DB.save(data);
    renderChat(data);
    setTimeout(() => {
        const responses = ['Спасибо за обращение! Мы уже работаем над вашим вопросом.', 'Ваша заявка принята. Ожидайте звонка.', 'Информация передана отделу. Ответим в течение дня.'];
        data.messages.push({ id: data.messages.length + 1, from: 'uk', text: responses[Math.floor(Math.random() * responses.length)], time: time, date: date });
        DB.save(data);
        renderChat(data);
    }, 1500);
}

function renderBills(data) {
    document.querySelector('.bills-grid').innerHTML = data.bills.map(bill => {
        let details = '';
        if (bill.status === 'pending') {
            if (bill.heating) details += '<div class="bill-item"><span>Отопление</span><span>' + bill.heating + ' ₽</span></div>';
            if (bill.water) details += '<div class="bill-item"><span>Водоснабжение</span><span>' + bill.water + ' ₽</span></div>';
            if (bill.electricity) details += '<div class="bill-item"><span>Электричество</span><span>' + bill.electricity + ' ₽</span></div>';
            if (bill.maintenance) details += '<div class="bill-item"><span>Содержание жилья</span><span>' + bill.maintenance + ' ₽</span></div>';
        }
        return '<div class="bill-card ' + (bill.status === 'pending' ? 'current' : 'paid') + '"><div class="bill-header"><span class="bill-period">' + bill.period + '</span><span class="bill-status">' + (bill.status === 'pending' ? 'К оплате' : 'Оплачено') + '</span></div><div class="bill-amount">' + bill.amount.toLocaleString() + ' ₽</div>' + (bill.status === 'pending' ? '<div class="bill-details">' + details + '</div><button class="btn-primary" onclick="payBill(' + bill.id + ', ' + bill.amount + ')">Оплатить</button>' : '<div class="bill-date">Оплачено ' + bill.paidDate + '</div>') + '</div>';
    }).join('');
    document.querySelector('#bills-section .history-table tbody').innerHTML = data.bills.filter(b => b.status === 'paid').map(bill => '<tr><td>' + bill.paidDate + '</td><td>' + bill.period + '</td><td>' + bill.amount.toLocaleString() + ' ₽</td><td><span class="status paid">Оплачено</span></td></tr>').join('');
}

function payBill(id, amount) {
    const data = DB.get();
    const bill = data.bills.find(b => b.id === id);
    if (bill) {
        const now = new Date();
        bill.status = 'paid';
        bill.paidDate = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();
        DB.save(data);
        renderBills(data);
        showToast('Счёт успешно оплачен!');
    }
}

function renderPasses(data) {
    const permanentPasses = data.passes.filter(p => p.type === 'permanent' || p.type === 'car');
    document.querySelector('.passes-grid').innerHTML = permanentPasses.map(pass => '<div class="pass-card active"><div class="pass-icon"><i class="fas fa-' + (pass.type === 'car' ? 'car' : 'id-card') + '"></i></div><div class="pass-info"><h3>' + pass.title + '</h3><p>' + (pass.details || 'Действителен до ' + pass.expires) + '</p><span class="pass-status active">Активен</span></div></div>').join('');
    const tempPasses = data.passes.filter(p => p.type === 'temp');
    document.querySelector('.active-passes').innerHTML = '<h2>Временные пропуски</h2>' + (tempPasses.length > 0 ? tempPasses.map(pass => '<div class="temp-pass"><div class="temp-pass-info"><strong>' + pass.guest + '</strong><span>' + pass.date + ' с ' + pass.timeStart + ' до ' + pass.timeEnd + '</span></div><span class="pass-status ' + pass.status + '">' + (pass.status === 'pending' ? 'На рассмотрении' : 'Подтверждён') + '</span></div>').join('') : '<p style="color: var(--text-secondary);">Нет активных пропусков</p>');
}

function openPassModal() {
    document.getElementById('pass-modal').classList.add('active');
    document.getElementById('pass-date').min = new Date().toISOString().split('T')[0];
}

function closePassModal() {
    document.getElementById('pass-modal').classList.remove('active');
    document.getElementById('guest-name').value = '';
    document.getElementById('pass-date').value = '';
}

function submitPass() {
    const name = document.getElementById('guest-name').value;
    const date = document.getElementById('pass-date').value;
    const timeStart = document.getElementById('pass-time-start').value;
    const timeEnd = document.getElementById('pass-time-end').value;
    if (!name || !date) { showToast('Заполните все поля!'); return; }
    const data = DB.get();
    data.passes.push({ id: data.passes.length + 1, type: 'temp', guest: name, date: date, timeStart: timeStart, timeEnd: timeEnd, status: 'pending' });
    DB.save(data);
    closePassModal();
    renderPasses(data);
    showToast('Заявка на пропуск отправлена!');
}

const masterTitles = { plumber: 'Сантехник', electrician: 'Электрик', locksmith: 'Слесарь', cleaner: 'Клининг', conditioner: 'Кондиционер', glass: 'Окна' };
let selectedMaster = '';

function selectMaster(type) {
    selectedMaster = type;
    document.getElementById('master-modal-title').textContent = 'Вызов: ' + masterTitles[type];
    document.getElementById('master-modal').classList.add('active');
    document.getElementById('master-phone').value = DB.get().user.phone;
}

function closeMasterModal() {
    document.getElementById('master-modal').classList.remove('active');
    selectedMaster = '';
    document.getElementById('master-description').value = '';
}

function submitMasterRequest() {
    const description = document.getElementById('master-description').value;
    const time = document.getElementById('master-time').value;
    const phone = document.getElementById('master-phone').value;
    if (!description) { showToast('Опишите проблему!'); return; }
    const data = DB.get();
    data.masterRequests.push({ id: data.masterRequests.length + 1, type: selectedMaster, typeName: masterTitles[selectedMaster], description: description, time: time, phone: phone, status: 'pending', date: new Date().toLocaleDateString('ru-RU') });
    DB.save(data);
    closeMasterModal();
    showToast('Мастер вызван! Ожидайте звонка.');
}

function emergencyCall(service, phone) { window.location.href = 'tel:' + phone; showToast('Вызов: ' + service); }

function renderProfile(data) {
    const user = data.user;
    document.querySelector('.profile-info').innerHTML = '<h2>' + user.name + '</h2><p>Квартира ' + user.apartment + ', корпус ' + user.building + '</p><p>Площадь: ' + user.area + ' м²</p><p>Тариф: ' + user.tariff + '</p><p>Телефон: ' + user.phone + '</p>';
    const settings = data.settings;
    const switches = document.querySelectorAll('.switch input');
    switches[0].checked = settings.notifications; switches[1].checked = settings.email; switches[2].checked = settings.sms;
    switches.forEach((sw, index) => { sw.addEventListener('change', function() { const data = DB.get(); if (index === 0) data.settings.notifications = this.checked; if (index === 1) data.settings.email = this.checked; if (index === 2) data.settings.sms = this.checked; DB.save(data); showToast('Настройки сохранены'); }); });
}

function initPWA() {
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js').then(reg => console.log('SW registered')).catch(err => console.log('SW error:', err)); }
}

function getInitials(name) { return name.split(' ').map(n => n[0]).join('').toUpperCase(); }

function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

document.querySelectorAll('.modal').forEach(modal => { modal.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); }); });
