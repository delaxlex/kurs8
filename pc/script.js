// ============================================
// НАСТРОЙКИ
// ============================================
const GIST_ID = 'cab13aea931be6989a1c2ac9fa48717a';
const GIST_FILENAME = 'status.txt';
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 часа

// ============================================
// ФУНКЦИЯ ВЫХОДА
// ============================================
function logout() {
    sessionStorage.removeItem('user_surname');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('login_time');
    window.location.href = '../index.html';
}

// ============================================
// ПРОВЕРКА ДОСТУПА
// ============================================
function validateAccess() {
    // Получаем данные из sessionStorage и URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const savedToken = sessionStorage.getItem('access_token');
    const surname = sessionStorage.getItem('user_surname');
    const loginTime = parseInt(sessionStorage.getItem('login_time') || '0');
    const currentTime = Date.now();
    
    // Проверка 1: есть ли фамилия
    if (!surname) {
        console.log('❌ Нет фамилии в сессии');
        return false;
    }
    
    // Проверка 2: есть ли токен в URL
    if (!urlToken) {
        console.log('❌ Нет токена в URL');
        return false;
    }
    
    // Проверка 3: совпадает ли токен
    if (urlToken !== savedToken) {
        console.log('❌ Токен не совпадает');
        return false;
    }
    
    // Проверка 4: не истек ли сеанс
    if (currentTime - loginTime > SESSION_DURATION) {
        console.log('❌ Сеанс истек');
        return false;
    }
    
    console.log('✅ Локальная проверка пройдена для:', surname);
    return true;
}

async function checkGistAccess(surname) {
    try {
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки Gist');
        }
        
        const gistData = await response.json();
        const fileContent = gistData.files[GIST_FILENAME];
        
        if (!fileContent) {
            throw new Error('Файл не найден');
        }
        
        const lines = fileContent.content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        for (const line of lines) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const fileSurname = parts[0].toLowerCase();
                const fileStatus = parts[1];
                if (fileSurname === surname.toLowerCase() && fileStatus === '+') {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Ошибка проверки Gist:', error);
        return false;
    }
}

function showBlockedPage(message) {
    const blockedPage = document.getElementById('blocked-page');
    const appContent = document.getElementById('app-content');
    const messageEl = document.getElementById('blocked-message');
    
    if (messageEl) {
        messageEl.textContent = message || 'Пожалуйста, пройдите авторизацию.';
    }
    
    if (blockedPage) {
        blockedPage.style.display = 'block';
    }
    
    if (appContent) {
        appContent.style.display = 'none';
    }
}

function showContent() {
    const blockedPage = document.getElementById('blocked-page');
    const appContent = document.getElementById('app-content');
    
    if (blockedPage) {
        blockedPage.style.display = 'none';
    }
    
    if (appContent) {
        appContent.style.display = 'block';
    }
}

// ============================================
// ГЛАВНАЯ ФУНКЦИЯ ЗАГРУЗКИ
// ============================================
async function init() {
    // Шаг 1: Проверяем локальные данные
    if (!validateAccess()) {
        showBlockedPage('Доступ запрещен. Пожалуйста, войдите заново.');
        return;
    }
    
    // Шаг 2: Проверяем через Gist (активна ли фамилия)
    const surname = sessionStorage.getItem('user_surname');
    const isActive = await checkGistAccess(surname);
    
    if (!isActive) {
        showBlockedPage('Ваш доступ был отозван. Обратитесь к администратору.');
        // Очищаем сессию
        sessionStorage.removeItem('user_surname');
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('login_time');
        return;
    }
    
    // Шаг 3: Все проверки пройдены - показываем страницу
    showContent();
    
    // Шаг 4: Запускаем навигацию по урокам
    initNavigation();
}

// ============================================
// НАВИГАЦИЯ ПО УРОКАМ
// ============================================
function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const lessonContents = document.querySelectorAll('.lesson-content');

    function switchLesson(lessonId) {
        lessonContents.forEach(content => {
            content.classList.remove('active');
        });

        menuItems.forEach(item => {
            item.classList.remove('active');
        });

        const targetLesson = document.getElementById(`lesson-${lessonId}`);
        if (targetLesson) {
            targetLesson.classList.add('active');
        }

        const targetButton = document.querySelector(`.menu-item[data-lesson="${lessonId}"]`);
        if (targetButton) {
            targetButton.classList.add('active');
        }

        const content = document.querySelector('.content');
        if (content) {
            content.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    }

    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const lessonId = this.getAttribute('data-lesson');
            switchLesson(lessonId);
        });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const lessonParam = urlParams.get('lesson');
    
    if (lessonParam !== null) {
        const lessonId = parseInt(lessonParam);
        if (lessonId >= 0 && lessonId <= 15) {
            switchLesson(lessonId);
            return;
        }
    }
    
    switchLesson('0');
}

// ============================================
// ЗАПУСК
// ============================================
document.addEventListener('DOMContentLoaded', init);

// Автоматическое продление сессии
setInterval(() => {
    const loginTime = parseInt(sessionStorage.getItem('login_time') || '0');
    if (loginTime > 0) {
        sessionStorage.setItem('login_time', Date.now().toString());
        console.log('🔄 Сессия продлена');
    }
}, 5 * 60 * 1000);

console.log('🛡️ Защита страницы активна');

// ============================================
// УПРАВЛЕНИЕ ПАНЕЛЬЮ С АНИМАЦИЕЙ
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebarClose = document.getElementById('sidebarClose');
    const mainContent = document.getElementById('mainContent');

    // Создаем оверлей для мобильных
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Функция скрытия панели с анимацией
    function hideSidebar() {
        sidebar.classList.add('hidden');
        
        // Показываем кнопку открытия слева с анимацией
        sidebarOpen.classList.remove('hidden-btn');
        sidebarOpen.classList.add('visible');
        
        overlay.classList.remove('active');
        localStorage.setItem('sidebarHidden', 'true');
        document.body.style.overflow = '';
    }

    // Функция показа панели с анимацией
    function showSidebar() {
        sidebar.classList.remove('hidden');
        
        // Прячем кнопку открытия
        sidebarOpen.classList.add('hidden-btn');
        setTimeout(() => {
            sidebarOpen.classList.remove('visible');
            sidebarOpen.classList.remove('hidden-btn');
        }, 300);
        
        if (window.innerWidth <= 768) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        localStorage.setItem('sidebarHidden', 'false');
    }

    // Обработчик закрытия
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function(e) {
            e.stopPropagation();
            hideSidebar();
        });
    }

    // Обработчик открытия
    if (sidebarOpen) {
        sidebarOpen.addEventListener('click', function(e) {
            e.stopPropagation();
            showSidebar();
        });
    }

    // Клик по оверлею - закрываем панель
    overlay.addEventListener('click', function() {
        if (!sidebar.classList.contains('hidden')) {
            hideSidebar();
        }
    });

    // Восстанавливаем состояние при загрузке
    const isHidden = localStorage.getItem('sidebarHidden') === 'true';
    if (isHidden) {
        sidebar.classList.add('hidden');
        sidebarOpen.classList.add('visible');
        if (window.innerWidth <= 768) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    } else {
        setTimeout(() => {
            sidebar.classList.remove('hidden');
        }, 100);
    }

    // Закрываем панель при клике вне её (для мобильных)
    document.addEventListener('click', function(e) {
        const isMobile = window.innerWidth <= 768;
        if (!isMobile) return;
        
        const isSidebar = sidebar.contains(e.target);
        const isOpenBtn = sidebarOpen.contains(e.target);
        const isOverlay = overlay.contains(e.target);
        
        if (!isSidebar && !isOpenBtn && !isOverlay && !sidebar.classList.contains('hidden')) {
            hideSidebar();
        }
    });

    // При изменении размера окна
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            const isHidden = sidebar.classList.contains('hidden');
            
            if (!isMobile && !isHidden) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
            
            if (isMobile && !isHidden) {
                overlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
            
            if (isMobile && isHidden) {
                overlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        }, 250);
    });

    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !sidebar.classList.contains('hidden')) {
            hideSidebar();
        }
    });

    // Функции для внешнего использования
    window.isSidebarOpen = function() {
        return !sidebar.classList.contains('hidden');
    };

    window.toggleSidebar = function() {
        if (sidebar.classList.contains('hidden')) {
            showSidebar();
        } else {
            hideSidebar();
        }
    };
});

// ============================================
// ПРИНУДИТЕЛЬНАЯ ДЕСКТОПНАЯ ВЕРСИЯ
// ============================================
(function forceDesktop() {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile|webOS/i.test(navigator.userAgent);
    
    if (isMobile) {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=1024, initial-scale=1.0, user-scalable=yes';
        }
        
        document.body.classList.add('force-desktop');
        
        document.addEventListener('touchend', function(e) {
            if (e.target.closest('.menu-item, .logout-btn, .sidebar-close, .sidebar-open')) {
                e.preventDefault();
                e.target.click();
            }
        }, { passive: false });
        
        document.addEventListener('gesturestart', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        document.documentElement.style.zoom = '1';
        
        console.log('📱 Мобильное устройство обнаружено, включена десктопная версия');
    }
})();