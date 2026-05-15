// ========================
// 1. البيانات الأساسية والتخزين
// ========================
let currentPage = 'login';
let loggedUser = null;

// بيانات الأقراص
let drives = [
    { name: "القرص C:", total: 237, used: 212, icon: "💿" },
    { name: "القرص D:", total: 512, used: 340, icon: "💾" },
    { name: "القرص E:", total: 1000, used: 390, icon: "📀" },
    { name: "القرص F:", total: 256, used: 98, icon: "⚡" }
];

// بيانات النظام
let systemStats = {
    cpu: 23,
    ramUsed: 7.2,
    ramTotal: 16,
    temp: 58,
    battery: 82,
    charging: true
};

// تهيئة المستخدمين
if (!localStorage.getItem("users")) {
    localStorage.setItem("users", JSON.stringify([
        { username: "admin", password: "123", role: "admin", email: "admin@erterqa.com", lastLogin: null },
        { username: "mohandis", password: "123", role: "user", email: "mohandis@erterqa.com", lastLogin: null }
    ]));
}

// ========================
// 2. دوال مساعدة
// ========================
function getPercentage(used, total) { return (used / total) * 100; }

function getLedColor(percent) {
    if (percent >= 85) return "#e74c3c";
    if (percent >= 50) return "#f39c12";
    return "#2ecc71";
}

// تحديث البطارية الحقيقية
async function updateRealBattery() {
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            systemStats.battery = Math.floor(battery.level * 100);
            systemStats.charging = battery.charging;
            // تحديث العناصر إذا كانت موجودة
            const fillElem = document.getElementById("realBatteryFill");
            const percentElem = document.getElementById("realBatteryPercent");
            const statusElem = document.getElementById("realBatteryStatus");
            if (fillElem) fillElem.style.width = `${systemStats.battery}%`;
            if (percentElem) percentElem.innerHTML = `${systemStats.battery}%`;
            if (statusElem) statusElem.innerHTML = systemStats.charging ? "🔌 موصول بالشاحن" : "🔋 يعمل على البطارية";
        } catch(e) { console.warn("خطأ في البطارية:", e); }
    }
}

// تحديث CPU و RAM
function updateSystemLoad() {
    if (performance && performance.now) {
        let start = performance.now();
        setTimeout(() => {
            let end = performance.now();
            let load = Math.min(95, Math.max(5, (end - start) * 2));
            systemStats.cpu = Math.floor(load);
        }, 50);
    } else {
        systemStats.cpu = Math.floor(Math.random() * 50 + 10);
    }
    if (performance.memory) {
        let used = (performance.memory.usedJSHeapSize / (1024 * 1024 * 1024)).toFixed(1);
        systemStats.ramUsed = Math.min(parseFloat(used), systemStats.ramTotal - 0.5);
    } else {
        systemStats.ramUsed = parseFloat((Math.random() * 10 + 2).toFixed(1));
    }
}

// تحديث جميع البيانات
function refreshAllData() {
    drives.forEach(d => {
        let change = (Math.random() * 12) - 4;
        let newUsed = d.used + change;
        if (newUsed < 5) newUsed = 5;
        if (newUsed > d.total - 2) newUsed = d.total - 2;
        d.used = parseFloat(newUsed.toFixed(1));
    });
    systemStats.cpu = Math.floor(Math.random() * 70) + 8;
    systemStats.ramUsed = parseFloat((Math.random() * 12 + 2).toFixed(1));
    systemStats.temp = Math.floor(Math.random() * 45) + 35;
    systemStats.battery = Math.floor(Math.random() * 60) + 25;
    systemStats.charging = systemStats.battery > 35;
    renderCurrentPage();
}

// ========================
// 3. دوال عرض الصفحات
// ========================
function renderLoginPage() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>🔐 تسجيل الدخول</h1>
                <input type="text" id="loginUsername" placeholder="اسم المستخدم" autocomplete="off">
                <input type="password" id="loginPassword" placeholder="كلمة المرور" autocomplete="off">
                <button onclick="handleLogin()">دخول</button>
                <a href="#" onclick="navigateTo('register')" class="link">📝 ليس لديك حساب؟ سجل الآن</a>
                <a href="#" onclick="navigateTo('forgot')" class="link">🔑 نسيت كلمة المرور؟</a>
                <div id="loginError" class="error"></div>
            </div>
        </div>
    `;
}

function renderRegisterPage() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>📝 إنشاء حساب جديد</h1>
                <input type="text" id="regUsername" placeholder="اسم المستخدم" autocomplete="off">
                <input type="email" id="regEmail" placeholder="البريد الإلكتروني" autocomplete="off">
                <input type="password" id="regPassword" placeholder="كلمة المرور" autocomplete="off">
                <input type="password" id="regConfirm" placeholder="تأكيد كلمة المرور" autocomplete="off">
                <button onclick="handleRegister()">تسجيل</button>
                <a href="#" onclick="navigateTo('login')" class="link">🔐 لديك حساب؟ سجل دخول</a>
                <div id="regMsg"></div>
            </div>
        </div>
    `;
}

function renderForgotPage() {
    return `
        <div class="login-container">
            <div class="login-card">
                <h1>🔑 استعادة كلمة المرور</h1>
                <input type="text" id="forgotUsername" placeholder="اسم المستخدم" autocomplete="off">
                <input type="email" id="forgotEmail" placeholder="البريد الإلكتروني" autocomplete="off">
                <input type="password" id="newPassword" placeholder="كلمة المرور الجديدة" autocomplete="off">
                <button onclick="handleForgot()">إعادة تعيين</button>
                <a href="#" onclick="navigateTo('login')" class="link">🔐 تذكرت كلمة المرور؟ سجل دخول</a>
                <div id="forgotMsg"></div>
            </div>
        </div>
    `;
}

function renderSidebar() {
    if (!loggedUser) return '';
    return `
        <div class="sidebar">
            <div class="logo-sidebar">
                <img src="logo1.png" class="sidebar-logo" onerror="this.style.display='none'">
                <div class="sidebar-slogan">حقوق الطبع محفوظة © 2026</div>
            </div>
            <a href="#" onclick="navigateTo('index')">🏠 الرئيسية</a>
            <a href="#" onclick="navigateTo('dashboard')">📀 لوحة التحكم</a>
            <a href="#" onclick="navigateTo('stats')">📊 الإحصائيات</a>
            ${loggedUser.role === 'admin' ? '<a href="#" onclick="navigateTo(\'admin\')">👑 لوحة المدير</a>' : ''}
            <a href="#" onclick="logout()">🚪 تسجيل الخروج</a>
        </div>
    `;
}

function renderTopBar() {
    return `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: #0f1420cc; padding: 12px 25px; border-radius: 60px;">
            <div><h2>🖥️ ERTIQA SOFT</h2></div>
            <div class="user-menu">
                <div style="background: #1f2f4f; border-radius: 40px; padding: 8px 18px; display: flex; gap: 10px; cursor: pointer;" onclick="toggleUserMenu()">
                    <span>👤</span><span id="topUsername">${loggedUser?.username || ''}</span><span>▼</span>
                </div>
                <div id="userDropdown" class="user-dropdown">
                    <a href="#" onclick="showUserData()">📋 بيانات المستخدم</a>
                    <a href="#" onclick="logout()">🚪 تسجيل الخروج</a>
                </div>
            </div>
        </div>
    `;
}

function renderIndexPage() {
    return `
        ${renderTopBar()}
        <div class="hero">
            <h1>الارتقاء سوفت</h1>
            <p>أفضل دعم لتكنولوجيا المعلومات لنجاح الأعمال</p>
        </div>
        <div class="section">
            <h2>🌟 من نحن</h2>
            <p>شركة يمنية متخصصة في تقديم حلول تقنية متكاملة.</p>
        </div>
    `;
}

function renderDashboardPage() {
    // بطاقات الأقراص
    let drivesHtml = '';
    drives.forEach(d => {
        const percent = getPercentage(d.used, d.total).toFixed(1);
        const free = (d.total - d.used).toFixed(1);
        const ledColor = getLedColor(percent);
        drivesHtml += `
            <div class="drive-card">
                <div class="drive-header">
                    <span class="drive-name">${d.name}</span>
                    <div class="led-indicator" style="background: ${ledColor}; box-shadow: 0 0 8px ${ledColor};"></div>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-fill" style="width: ${percent}%; background: ${ledColor};"></div>
                </div>
                <div class="drive-stats">
                    <span>📀 ${d.total} GB</span>
                    <span>💾 مستخدم: ${d.used} GB</span>
                    <span>🆓 حر: ${free} GB</span>
                </div>
                <div style="font-size:0.7rem; margin-top: 8px;">نسبة الإشغال ${percent}%</div>
            </div>
        `;
    });

    const cpuPercent = systemStats.cpu;
    const ramPercent = (systemStats.ramUsed / systemStats.ramTotal) * 100;
    let tempColor = systemStats.temp <= 50 ? "#2ecc71" : (systemStats.temp <= 75 ? "#f39c12" : "#e74c3c");
    let batteryColor = systemStats.battery > 60 ? "#2ecc71" : (systemStats.battery > 25 ? "#f39c12" : "#e74c3c");

    return `
        ${renderTopBar()}
        <h1>🖥️ لوحة تحكم النظام الذكية</h1>
        <p>حالة الأجهزة والموارد</p>
        <div id="lastLoginInfo" style="font-size: 0.8rem; color: #7aa9ff; margin-top: 5px;"></div>

        <!-- مؤشرات الحالة -->
        <div style="display: flex; gap: 20px; justify-content: flex-end; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px; background: #0f1420aa; padding: 6px 18px; border-radius: 40px;">
                <span style="width: 12px; height: 12px; background: #2ecc71; border-radius: 50%; box-shadow: 0 0 6px #2ecc71;"></span><span>نشط</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; background: #0f1420aa; padding: 6px 18px; border-radius: 40px;">
                <span style="width: 12px; height: 12px; background: #f39c12; border-radius: 50%; box-shadow: 0 0 6px #f39c12;"></span><span>تحذير</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; background: #0f1420aa; padding: 6px 18px; border-radius: 40px;">
                <span style="width: 12px; height: 12px; background: #e74c3c; border-radius: 50%; box-shadow: 0 0 6px #e74c3c;"></span><span>حرج</span>
            </div>
        </div>

        <div class="section-title">💿 وحدات التخزين (الأقراص)</div>
        <div class="cards-grid">${drivesHtml}</div>

        <div class="section-title">⚙️ أداء النظام الحي</div>
        <div class="cards-grid">
            <div class="resource-card">
                <div class="resource-title"><span>🧠</span> المعالج CPU</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${cpuPercent}%; background: #3b6eff;"></div></div>
                <div class="value-big">${cpuPercent}%</div>
                <div>⚡ التردد: 3.6 جيجاهرتز</div>
            </div>
            <div class="resource-card">
                <div class="resource-title"><span>📀</span> الذاكرة RAM</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${ramPercent}%; background: #9b59b6;"></div></div>
                <div class="value-big">${systemStats.ramUsed} / ${systemStats.ramTotal} GB</div>
                <div>📌 النسبة: ${Math.floor(ramPercent)}%</div>
            </div>
            <div class="resource-card">
                <div class="resource-title"><span>🌡️</span> الحرارة</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${systemStats.temp}%; background: ${tempColor};"></div></div>
                <div class="value-big">${systemStats.temp}°C</div>
                <div>🔆 ${systemStats.temp > 70 ? "ارتفاع حاد" : (systemStats.temp > 50 ? "معتدل" : "ممتاز")}</div>
            </div>
            <div class="resource-card">
                <div class="resource-title"><span>🔋</span> الطاقة / البطارية</div>
                <div class="progress-bar-bg"><div class="progress-fill" style="width: ${systemStats.battery}%; background: ${batteryColor};"></div></div>
                <div class="value-big">${systemStats.battery}%</div>
                <div>⚡ ${systemStats.charging ? "موصول بالشاحن 🔌" : "بطارية فقط"}</div>
            </div>
            <div class="resource-card">
                <div class="resource-title"><span>🔋</span> البطارية (حقيقية)</div>
                <div class="progress-bar-bg"><div class="progress-fill" id="realBatteryFill" style="width: 0%; background: #2ecc71;"></div></div>
                <div class="value-big" id="realBatteryPercent">-- %</div>
                <div id="realBatteryStatus">⏳ جاري التحميل...</div>
            </div>
        </div>

        <div style="display: flex; justify-content: center; margin: 30px 0;">
            <button onclick="refreshAllData()">⟳ تحديث شامل للبيانات</button>
        </div>
        <footer>⚡ بيانات تفاعلية – لوحة تحكم احترافية | الارتقاء سوفت</footer>
    `;
}

function renderStatsPage() {
    return `
        ${renderTopBar()}
        <h1>📊 الإحصائيات</h1>
        <canvas id="cpuChart" width="400" height="200"></canvas>
        <canvas id="ramChart" width="400" height="200"></canvas>
        <p>⏳ سيتم إضافة الرسوم البيانية قريباً...</p>
    `;
}

function renderAdminPage() {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    let usersHtml = '<table><thead>运转<th>المستخدم</th><th>البريد</th><th>الصلاحية</th><th>آخر دخول</th><th>حذف</th></tr></thead><tbody>';
    users.forEach((user, idx) => {
        usersHtml += `<tr><td>${user.username}</td><td>${user.email}</td><td>${user.role === 'admin' ? 'مدير' : 'مستخدم'}</td><td>${user.lastLogin || '—'}</td><td><button onclick="deleteUser(${idx})">حذف</button></td></tr>`;
    });
    usersHtml += '</tbody></table>';
    return `
        ${renderTopBar()}
        <h1>👑 لوحة المدير</h1>
        ${usersHtml}
        <h3>➕ إضافة مستخدم جديد</h3>
        <input type="text" id="newUsername" placeholder="اسم المستخدم" autocomplete="off">
        <input type="email" id="newEmail" placeholder="البريد" autocomplete="off">
        <input type="password" id="newPassword" placeholder="كلمة المرور" autocomplete="off">
        <button onclick="addUser()">إضافة مستخدم</button>
    `;
}

// ========================
// 4. دوال التحكم
// ========================
window.navigateTo = function(page) {
    currentPage = page;
    renderCurrentPage();
};

function renderCurrentPage() {
    const app = document.getElementById('app');
    if (!app) return;
    let content = '';
    
    if (!loggedUser && currentPage !== 'register' && currentPage !== 'forgot') {
        currentPage = 'login';
        content = renderLoginPage();
    } else {
        switch(currentPage) {
            case 'login': content = renderLoginPage(); break;
            case 'register': content = renderRegisterPage(); break;
            case 'forgot': content = renderForgotPage(); break;
            case 'index': content = renderSidebar() + '<div class="main-content">' + renderIndexPage() + '</div>'; break;
            case 'dashboard': content = renderSidebar() + '<div class="main-content">' + renderDashboardPage() + '</div>'; break;
            case 'stats': content = renderSidebar() + '<div class="main-content">' + renderStatsPage() + '</div>'; break;
            case 'admin': content = renderSidebar() + '<div class="main-content">' + renderAdminPage() + '</div>'; break;
            default: content = renderLoginPage();
        }
    }
    app.innerHTML = content;
    attachGlobalEvents();
    
    // تحديث وقت آخر دخول
    if (loggedUser && loggedUser.loginTime) {
        const infoDiv = document.getElementById('lastLoginInfo');
        if (infoDiv) infoDiv.innerHTML = `🕓 آخر تسجيل دخول: ${loggedUser.loginTime}`;
    }
    
    // تحديث البطارية الحقيقية بعد تحميل الصفحة
    if (currentPage === 'dashboard') {
        updateRealBattery();
    }
}

function attachGlobalEvents() {
    const dropdownBtn = document.querySelector('.user-menu > div');
    if (dropdownBtn) {
        dropdownBtn.onclick = (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        };
    }
    document.onclick = () => {
        const dd = document.getElementById('userDropdown');
        if (dd) dd.style.display = 'none';
    };
}

window.toggleUserMenu = function() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

// ========================
// 5. دوال تسجيل الدخول والإدارة
// ========================
window.handleLogin = function() {
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username === username && u.password === password);
    const errorDiv = document.getElementById('loginError');
    if (user) {
        const now = new Date().toLocaleString("ar-EG", { hour12: false });
        user.lastLogin = now;
        localStorage.setItem('users', JSON.stringify(users));
        loggedUser = { username: user.username, role: user.role, loginTime: now };
        localStorage.setItem('loggedInUser', JSON.stringify(loggedUser));
        if (errorDiv) errorDiv.innerHTML = '<span style="color:#2ecc71">✅ تم الدخول بنجاح</span>';
        setTimeout(() => navigateTo('dashboard'), 1000);
    } else {
        if (errorDiv) errorDiv.innerHTML = '❌ خطأ في الاسم أو كلمة المرور';
    }
};

window.handleRegister = function() {
    const username = document.getElementById('regUsername')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim();
    const pass = document.getElementById('regPassword')?.value.trim();
    const confirm = document.getElementById('regConfirm')?.value.trim();
    if (!username || !email || !pass) { alert('❌ جميع الحقول مطلوبة'); return; }
    if (pass !== confirm) { alert('❌ كلمة المرور غير متطابقة'); return; }
    let users = JSON.parse(localStorage.getItem('users'));
    if (users.find(u => u.username === username)) { alert('❌ المستخدم موجود'); return; }
    users.push({ username, email, password: pass, role: 'user', lastLogin: null });
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم التسجيل بنجاح');
    navigateTo('login');
};

window.handleForgot = function() {
    const username = document.getElementById('forgotUsername')?.value.trim();
    const email = document.getElementById('forgotEmail')?.value.trim();
    const newPass = document.getElementById('newPassword')?.value.trim();
    let users = JSON.parse(localStorage.getItem('users'));
    const idx = users.findIndex(u => u.username === username && u.email === email);
    if (idx === -1 || !newPass) { alert('❌ بيانات غير صحيحة'); return; }
    users[idx].password = newPass;
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم تغيير كلمة المرور');
    navigateTo('login');
};

window.addUser = function() {
    const username = document.getElementById('newUsername')?.value.trim();
    const email = document.getElementById('newEmail')?.value.trim();
    const password = document.getElementById('newPassword')?.value.trim();
    if (!username || !email || !password) { alert('❌ جميع الحقول مطلوبة'); return; }
    let users = JSON.parse(localStorage.getItem('users'));
    if (users.find(u => u.username === username)) { alert('❌ المستخدم موجود'); return; }
    users.push({ username, email, password, role: 'user', lastLogin: null });
    localStorage.setItem('users', JSON.stringify(users));
    alert('✅ تم إضافة المستخدم');
    renderCurrentPage();
};

window.deleteUser = function(idx) {
    let users = JSON.parse(localStorage.getItem('users'));
    if (users[idx].username === loggedUser?.username) { alert('❌ لا يمكن حذف حسابك'); return; }
    users.splice(idx, 1);
    localStorage.setItem('users', JSON.stringify(users));
    renderCurrentPage();
};

window.showUserData = function() {
    alert(`📋 بيانات المستخدم\nالاسم: ${loggedUser?.username}\nالصلاحية: ${loggedUser?.role === 'admin' ? 'مدير' : 'مستخدم'}`);
};

window.logout = function() {
    loggedUser = null;
    localStorage.removeItem('loggedInUser');
    navigateTo('login');
};

// ========================
// 6. بدء التشغيل
// ========================
(async function init() {
    loggedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    await updateRealBattery();
    updateSystemLoad();
    setInterval(async () => { await updateRealBattery(); }, 30000);
    navigateTo(loggedUser ? 'dashboard' : 'login');
})();