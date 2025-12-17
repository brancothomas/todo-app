// ===== App State =====
const state = {
    tasks: [],
    settings: {
        notificationsEnabled: false,
        theme: 'pastelPink'
    }
};

// ===== Theme Colors =====
const themes = {
    pastelBlue: { color: '#A8D5E5', bg: 'rgba(168, 213, 229, 0.3)' },
    pastelPink: { color: '#F5C1CB', bg: 'rgba(245, 193, 203, 0.3)' },
    pastelGreen: { color: '#C1EDC1', bg: 'rgba(193, 237, 193, 0.3)' },
    pastelPurple: { color: '#CCC1ED', bg: 'rgba(204, 193, 237, 0.3)' },
    pastelPeach: { color: '#FAD9B8', bg: 'rgba(250, 217, 184, 0.3)' },
    pastelMint: { color: '#CCF2DC', bg: 'rgba(204, 242, 220, 0.3)' }
};

// ===== DOM Elements =====
const elements = {
    homeScreen: document.getElementById('home-screen'),
    settingsScreen: document.getElementById('settings-screen'),
    emptyState: document.getElementById('empty-state'),
    taskList: document.getElementById('task-list'),
    taskCount: document.getElementById('task-count'),
    fabAdd: document.getElementById('fab-add'),
    btnAddEmpty: document.getElementById('btn-add-empty'),
    modal: document.getElementById('add-task-modal'),
    taskInput: document.getElementById('task-input'),
    dateToggle: document.getElementById('date-toggle'),
    datePickerContainer: document.getElementById('date-picker-container'),
    taskDatetime: document.getElementById('task-datetime'),
    btnCancel: document.getElementById('btn-cancel'),
    btnConfirm: document.getElementById('btn-confirm'),
    notificationsToggle: document.getElementById('notifications-toggle'),
    navButtons: document.querySelectorAll('.nav-btn'),
    colorButtons: document.querySelectorAll('.color-btn')
};

// ===== Initialize =====
function init() {
    loadState();
    applyTheme(state.settings.theme);
    renderTasks();
    setupEventListeners();
    updateTaskCount();
}

// ===== State Management =====
function loadState() {
    const savedTasks = localStorage.getItem('todo-tasks');
    const savedSettings = localStorage.getItem('todo-settings');

    if (savedTasks) {
        state.tasks = JSON.parse(savedTasks);
    }
    if (savedSettings) {
        state.settings = JSON.parse(savedSettings);
        elements.notificationsToggle.checked = state.settings.notificationsEnabled;
    }
}

function saveState() {
    localStorage.setItem('todo-tasks', JSON.stringify(state.tasks));
    localStorage.setItem('todo-settings', JSON.stringify(state.settings));
}

// ===== Theme =====
function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;

    document.documentElement.style.setProperty('--theme-color', theme.color);
    document.documentElement.style.setProperty('--theme-bg', theme.bg);

    // Update active color button
    elements.colorButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === themeName);
    });

    state.settings.theme = themeName;
    saveState();
}

// ===== Tasks =====
function renderTasks() {
    const incompleteTasks = state.tasks.filter(t => !t.completed);

    if (incompleteTasks.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.taskList.classList.add('hidden');
        elements.fabAdd.style.display = 'none';
    } else {
        elements.emptyState.classList.add('hidden');
        elements.taskList.classList.remove('hidden');
        elements.fabAdd.style.display = 'flex';

        elements.taskList.innerHTML = incompleteTasks.map(task => createTaskHTML(task)).join('');
        setupDragAndDrop();
    }

    updateTaskCount();
}

function createTaskHTML(task) {
    const reminderHTML = task.datetime ? `
        <div class="task-reminder">
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
            <span>${formatDateTime(task.datetime)}</span>
        </div>
    ` : '';

    return `
        <div class="task-item" data-id="${task.id}" draggable="true">
            <div class="task-checkbox" onclick="completeTask('${task.id}')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            <div class="task-content">
                <div class="task-title">${escapeHTML(task.title)}</div>
                ${reminderHTML}
            </div>
            <div class="task-handle">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
}

function addTask(title, datetime) {
    const task = {
        id: Date.now().toString(),
        title,
        datetime: datetime || null,
        completed: false,
        order: state.tasks.length
    };

    state.tasks.push(task);
    saveState();
    renderTasks();

    // Schedule notification if enabled and datetime set
    if (state.settings.notificationsEnabled && datetime) {
        scheduleNotification(task);
    }
}

function completeTask(id) {
    const taskElement = document.querySelector(`[data-id="${id}"]`);
    if (taskElement) {
        taskElement.classList.add('completing');

        setTimeout(() => {
            const task = state.tasks.find(t => t.id === id);
            if (task) {
                task.completed = true;
                saveState();
                renderTasks();
            }
        }, 400);
    }
}

function updateTaskCount() {
    const count = state.tasks.filter(t => !t.completed).length;
    if (count === 0) {
        elements.taskCount.textContent = 'No tasks yet';
    } else if (count === 1) {
        elements.taskCount.textContent = '1 task';
    } else {
        elements.taskCount.textContent = `${count} tasks`;
    }
}

// ===== Drag and Drop =====
let draggedItem = null;

function setupDragAndDrop() {
    const items = document.querySelectorAll('.task-item');

    items.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();

    if (draggedItem !== this) {
        const items = [...document.querySelectorAll('.task-item')];
        const fromIndex = items.indexOf(draggedItem);
        const toIndex = items.indexOf(this);

        // Reorder in DOM
        if (fromIndex < toIndex) {
            this.parentNode.insertBefore(draggedItem, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedItem, this);
        }

        // Reorder in state
        const taskIds = [...document.querySelectorAll('.task-item')].map(el => el.dataset.id);
        const incompleteTasks = state.tasks.filter(t => !t.completed);
        const completedTasks = state.tasks.filter(t => t.completed);

        const reorderedTasks = taskIds.map(id => incompleteTasks.find(t => t.id === id)).filter(Boolean);
        state.tasks = [...reorderedTasks, ...completedTasks];

        saveState();
    }
}

// ===== Modal =====
function openModal() {
    elements.modal.classList.add('active');
    elements.taskInput.value = '';
    elements.taskDatetime.value = '';
    elements.datePickerContainer.style.display = 'none';
    elements.dateToggle.classList.remove('active');
    elements.btnConfirm.disabled = true;

    setTimeout(() => elements.taskInput.focus(), 100);
}

function closeModal() {
    elements.modal.classList.remove('active');
}

function toggleDatePicker() {
    const isVisible = elements.datePickerContainer.style.display !== 'none';
    elements.datePickerContainer.style.display = isVisible ? 'none' : 'block';
    elements.dateToggle.classList.toggle('active', !isVisible);

    if (!isVisible) {
        // Set default to tomorrow at 9am
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        elements.taskDatetime.value = formatDateTimeLocal(tomorrow);
    }
}

// ===== Navigation =====
function switchScreen(screenName) {
    elements.homeScreen.classList.toggle('active', screenName === 'home');
    elements.settingsScreen.classList.toggle('active', screenName === 'settings');

    elements.navButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.screen === screenName);
    });
}

// ===== Notifications =====
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}

function scheduleNotification(task) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const now = new Date().getTime();
    const taskTime = new Date(task.datetime).getTime();
    const delay = taskTime - now;

    if (delay > 0) {
        setTimeout(() => {
            if (!state.tasks.find(t => t.id === task.id)?.completed) {
                new Notification('Task Reminder', {
                    body: task.title,
                    icon: 'icon-192.png'
                });
            }
        }, delay);
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Add task buttons
    elements.btnAddEmpty.addEventListener('click', openModal);
    elements.fabAdd.addEventListener('click', openModal);

    // Modal
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });
    elements.btnCancel.addEventListener('click', closeModal);
    elements.btnConfirm.addEventListener('click', () => {
        const title = elements.taskInput.value.trim();
        const datetime = elements.dateToggle.classList.contains('active') ? elements.taskDatetime.value : null;

        if (title) {
            addTask(title, datetime);
            closeModal();
        }
    });

    // Task input
    elements.taskInput.addEventListener('input', () => {
        elements.btnConfirm.disabled = !elements.taskInput.value.trim();
    });
    elements.taskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && elements.taskInput.value.trim()) {
            elements.btnConfirm.click();
        }
    });

    // Date toggle
    elements.dateToggle.addEventListener('click', toggleDatePicker);

    // Navigation
    elements.navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchScreen(btn.dataset.screen));
    });

    // Settings - Notifications
    elements.notificationsToggle.addEventListener('change', async () => {
        if (elements.notificationsToggle.checked) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                elements.notificationsToggle.checked = false;
                alert('Please enable notifications in your browser settings.');
                return;
            }
        }
        state.settings.notificationsEnabled = elements.notificationsToggle.checked;
        saveState();
    });

    // Settings - Color theme
    elements.colorButtons.forEach(btn => {
        btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
}

// ===== Utilities =====
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDateTime(datetime) {
    const date = new Date(datetime);
    const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ===== Start App =====
document.addEventListener('DOMContentLoaded', init);
