// ============================================
// НАСТРОЙКИ - ИЗМЕНИТЕ ПОД СЕБЯ
// ============================================
const GIST_ID = '80781749dc4028146d5876ba3e15c665/raw/ba818e2c9b5deda9a6d92d4a5129490866e66951';
const GIST_FILENAME = 'status.txt';
const REDIRECT_URL = 'pc/main.html'; 
const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 часа

// ============================================
// ОСНОВНАЯ ЛОГИКА (login.html)
// ============================================

// DOM элементы
const surnameInput = document.getElementById('surnameInput');
const loginBtn = document.getElementById('loginBtn');
const messageEl = document.getElementById('message');
const loadingEl = document.getElementById('loading');

// Обработчик кнопки
loginBtn.addEventListener('click', handleLogin);

// Обработчик Enter
surnameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
    }
});

// Автофокус на поле ввода и очистка старой сессии
window.addEventListener('load', () => {
    // Очищаем старую сессию при загрузке страницы входа
    sessionStorage.removeItem('user_surname');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('login_time');
    surnameInput.focus();
});

// ============================================
// ФУНКЦИЯ ГЕНЕРАЦИИ ТОКЕНА
// ============================================
function generateToken() {
    const part1 = Math.random().toString(36).substring(2, 10);
    const part2 = Math.random().toString(36).substring(2, 10);
    const part3 = Math.random().toString(36).substring(2, 10);
    return part1 + part2 + part3;
}

// ============================================
// ФУНКЦИЯ ПРОВЕРКИ ДОСТУПА
// ============================================
async function handleLogin() {
    // Получаем фамилию, приводим к нижнему регистру и обрезаем пробелы
    const surname = surnameInput.value.trim().toLowerCase();
    
    // Валидация
    if (!surname) {
        showMessage('Пожалуйста, введите вашу фамилию', 'error');
        return;
    }

    // Блокируем кнопку и показываем загрузку
    setLoading(true);
    hideMessage();

    try {
        // Запрос к GitHub Gist API
        const response = await fetch(`https://api.github.com/gists/${GIST_ID}`);
        
        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const gistData = await response.json();
        
        // Получаем содержимое файла
        const fileContent = gistData.files[GIST_FILENAME];
        
        if (!fileContent) {
            throw new Error(`Файл ${GIST_FILENAME} не найден в Gist`);
        }
        
        // Содержимое файла разбиваем на строки
        const content = fileContent.content;
        const lines = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        console.log('Загружено записей:', lines.length);
        
        // Ищем фамилию в файле
        let found = false;
        let status = null;
        
        for (const line of lines) {
            // Разбиваем строку на части (фамилия и статус через пробел)
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                const fileSurname = parts[0].toLowerCase();
                const fileStatus = parts[1];
                
                // Проверяем совпадение фамилии
                if (fileSurname === surname) {
                    found = true;
                    status = fileStatus;
                    break;
                }
            }
        }
        
        // Обработка результата
        if (!found) {
            showMessage('❌ Фамилия не найдена в списке доступа', 'error');
            setLoading(false);
            return;
        }
        
        if (status === '+') {
            showMessage('✅ Доступ разрешен! Перенаправление...', 'success');
            
            // ============================================
            // ГЕНЕРАЦИЯ ТОКЕНА И СОХРАНЕНИЕ СЕССИИ
            // ============================================
            const token = generateToken();
            const currentTime = Date.now();
            
            // Сохраняем все данные в sessionStorage
            sessionStorage.setItem('user_surname', surname);
            sessionStorage.setItem('access_token', token);
            sessionStorage.setItem('login_time', currentTime.toString());
            
            console.log('✅ Сессия создана для:', surname);
            console.log('🔑 Токен:', token);
            
            setLoading(false);
            
            // Перенаправление через секунду с токеном в URL
            setTimeout(() => {
                window.location.href = `${REDIRECT_URL}?token=${token}`;
            }, 1000);
            
        } else if (status === '-') {
            showMessage('⛔ Доступ запрещен. Обратитесь к администратору.', 'error');
            setLoading(false);
        } else {
            showMessage(`⚠️ Неизвестный статус: "${status}". Допустимые: + или -`, 'error');
            setLoading(false);
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        showMessage('❌ Ошибка проверки доступа. Попробуйте позже.', 'error');
        setLoading(false);
    }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove('hidden');
}

function hideMessage() {
    messageEl.classList.add('hidden');
}

function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loadingEl.classList.remove('hidden');
    } else {
        loginBtn.disabled = false;
        loadingEl.classList.add('hidden');
    }
}
