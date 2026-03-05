// State
let dashboardData = JSON.parse(localStorage.getItem('dashboardData'));

if (!dashboardData) {
    dashboardData = { categories: [] };
}

// Migrate from multiple panels if necessary
if (dashboardData.panels) {
    dashboardData = { categories: dashboardData.panels[0].categories || [] };
    saveData();
}

// DOM Elements
const categoriesContainer = document.getElementById('categories-container');
const timeEl = document.getElementById('time');
const greetingEl = document.getElementById('greeting');
const overlay = document.getElementById('modal-overlay');

// Modals
const linkModal = document.getElementById('link-modal');
const categoryModal = document.getElementById('category-modal');
const deleteModal = document.getElementById('delete-modal');
const settingsModal = document.getElementById('settings-modal');
const authModal = document.getElementById('auth-modal');

// Forms
const linkForm = document.getElementById('link-form');
const categoryForm = document.getElementById('category-form');
const settingsForm = document.getElementById('settings-form');
const authForm = document.getElementById('auth-form');

// Inputs
const linkIdInput = document.getElementById('link-id');
const linkNameInput = document.getElementById('link-name');
const linkUrlInput = document.getElementById('link-url');
const linkDescInput = document.getElementById('link-desc');
const linkCategorySelect = document.getElementById('link-category');
const categoryNameInput = document.getElementById('category-name');
const canvasDomainInput = document.getElementById('canvas-domain');
const canvasTokenInput = document.getElementById('canvas-token');
const authPasswordInput = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');
const authBtn = document.getElementById('auth-btn');

// State for deletion and drag/drop
let itemToDelete = null;
let draggedItemInfo = null;

// Auth State
let isUnlocked = localStorage.getItem('dashboard_unlocked') === 'true';

// Initialize
function init() {
    if (dashboardData.categories.length === 0 && !localStorage.getItem('Dashboard_Init')) {
        dashboardData.categories = [
            {
                id: generateId(),
                name: 'Socials',
                links: [
                    { id: generateId(), name: 'Instagram', url: 'https://instagram.com' },
                    { id: generateId(), name: 'Twitter', url: 'https://twitter.com' }
                ]
            },
            {
                id: generateId(),
                name: 'Work',
                links: [
                    { id: generateId(), name: 'GitHub', desc: 'My code repositories', url: 'https://github.com' },
                    { id: generateId(), name: 'LinkedIn', url: 'https://linkedin.com' },
                    { id: generateId(), name: 'Slack', url: 'https://slack.com' }
                ]
            },
            {
                id: generateId(),
                name: 'Schedule',
                links: [
                    { id: generateId(), name: 'Calendar', url: 'https://calendar.google.com' }
                ]
            }
        ];
        saveData();
        localStorage.setItem('Dashboard_Init', 'true');
    }

    updateTime();
    setInterval(updateTime, 60000);

    renderCategories();
    setupEventListeners();
    setupThemeToggle();
    initGlitter();
    fetchCanvasAssignments();
    applyAuthState();
}

function applyAuthState() {
    const authIcon = document.getElementById('auth-icon');
    if (isUnlocked) {
        document.body.classList.add('edit-mode');
        authIcon.textContent = 'lock_open';
    } else {
        document.body.classList.remove('edit-mode');
        authIcon.textContent = 'lock';
    }
}

function initGlitter() {
    const container = document.getElementById('glitter-container');
    if (!container) return;

    const glitterCount = 30; // Reduced number of sparkles for better performance

    for (let i = 0; i < glitterCount; i++) {
        const glitter = document.createElement('div');
        glitter.className = 'glitter';

        const size = Math.random() * 4 + 2;
        glitter.style.width = `${size}px`;
        glitter.style.height = `${size}px`;

        glitter.style.left = `${Math.random() * 100}vw`;
        glitter.style.top = `${Math.random() * 100}vh`;

        glitter.style.animationDelay = `${Math.random() * 4}s`;
        glitter.style.animationDuration = `${Math.random() * 2 + 2}s`;

        container.appendChild(glitter);
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const currentTheme = localStorage.getItem('dashboard_theme') || 'system';
    themeToggle.value = currentTheme;

    themeToggle.addEventListener('change', (e) => {
        const theme = e.target.value;
        localStorage.setItem('dashboard_theme', theme);
        applyTheme(theme);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const activeTheme = localStorage.getItem('dashboard_theme') || 'system';
        if (activeTheme === 'system') {
            applyTheme('system');
        }
    });

    function applyTheme(theme) {
        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function saveData() {
    localStorage.setItem('dashboardData', JSON.stringify(dashboardData));
}

function updateTime() {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const hour = now.getHours();
    if (hour < 12) greetingEl.textContent = 'Good morning.';
    else if (hour < 18) greetingEl.textContent = 'Good afternoon.';
    else greetingEl.textContent = 'Good evening.';
}

function getDomain(urlStr) {
    try {
        return new URL(urlStr).hostname;
    } catch (e) {
        return '';
    }
}



function renderCategories() {
    categoriesContainer.innerHTML = '';


    if (dashboardData.categories.length === 0) {
        categoriesContainer.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; font-size: 1.1rem;">You don't have any categories yet. Create a category to start adding links!</div>`;
        return;
    }

    dashboardData.categories.forEach(category => {
        const card = document.createElement('div');
        card.className = 'category-card';
        if (isUnlocked) card.draggable = true;
        card.dataset.id = category.id;
        card.dataset.type = 'category';

        let linksHtml = category.links.length === 0
            ? `<div class="empty-state" style="padding: 1rem 0; font-size: 0.9rem;">Drop links here!</div>`
            : category.links.map(link => {
                const domain = getDomain(link.url);
                return `
                <a href="${link.url}" class="link-item" target="_self" ${isUnlocked ? 'draggable="true"' : ''} data-id="${link.id}" data-category="${category.id}" data-type="link">
                    <div class="link-info">
                        <div class="drag-handle"><span class="material-symbols-rounded" style="font-size: 18px;">drag_indicator</span></div>
                        <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=128" alt="" class="link-icon" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOGI5NDllIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwIDEzYTUgNSAwIDAgMCA3LjU0LjU0bDMtM2E1IDUgMCAwIDAtNy4wNy03LjA3bC0xLjcyIDEuNzEiPjwvcGF0aD48cGF0aCBkPSJNMTQgMTFhNSA1IDAgMCAwLTcuNTQtLjU0bC0zIDNhNSA1IDAgMCAwIDcuMDcgNy4wN2wxLjcxLTEuNzEiPjwvcGF0aD48L3N2Zz4='">
                        <div style="display: flex; flex-direction: column;">
                            <span class="link-name">${escapeHtml(link.name)}</span>
                            ${link.desc ? `<span class="link-desc">${escapeHtml(link.desc)}</span>` : ''}
                        </div>
                    </div>
                    <div class="link-actions" onclick="event.preventDefault();">
                        <button class="icon-btn" onclick="openEditLink('${category.id}', '${link.id}')" title="Edit Link">
                            <span class="material-symbols-rounded" style="font-size: 18px;">edit</span>
                        </button>
                        <button class="icon-btn danger-icon" onclick="openDeleteModal('link', '${link.id}', '${category.id}')" title="Delete Link">
                            <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                        </button>
                    </div>
                </a>
                `}).join('');

        card.innerHTML = `
            <div class="category-header">
                <div style="display: flex; align-items: center;">
                    <div class="drag-handle"><span class="material-symbols-rounded" style="font-size: 22px;">drag_indicator</span></div>
                    <h3 class="category-title">${escapeHtml(category.name)}</h3>
                </div>
                <div class="category-actions">
                    <button class="icon-btn danger-icon" onclick="openDeleteModal('category', '${category.id}')" title="Delete Category">
                        <span class="material-symbols-rounded" style="font-size: 18px;">delete</span>
                    </button>
                </div>
            </div>
            <div class="link-list" style="min-height: 40px;" data-category="${category.id}" data-type="list">
                ${linksHtml}
            </div>
        `;

        categoriesContainer.appendChild(card);
    });

    setupDragAndDrop();
}

function updateCategorySelect() {
    linkCategorySelect.innerHTML = dashboardData.categories.map(c =>
        `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join('');
}

function setupEventListeners() {
    authBtn.addEventListener('click', () => {
        if (isUnlocked) {
            isUnlocked = false;
            localStorage.setItem('dashboard_unlocked', 'false');
            applyAuthState();
            renderCategories();
        } else {
            authForm.reset();
            authError.classList.add('hidden');
            openModal(authModal);
            setTimeout(() => authPasswordInput.focus(), 100);
        }
    });

    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = authPasswordInput.value;
        if (pwd === 'password') {
            isUnlocked = true;
            localStorage.setItem('dashboard_unlocked', 'true');
            applyAuthState();
            renderCategories();
            closeModals();
        } else {
            authError.classList.remove('hidden');
        }
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        canvasDomainInput.value = localStorage.getItem('canvas_domain') || 'canvas.ewu.edu';
        canvasTokenInput.value = localStorage.getItem('canvas_token') || '';
        openModal(settingsModal);
    });

    document.getElementById('refresh-canvas-btn').addEventListener('click', fetchCanvasAssignments);

    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let domain = canvasDomainInput.value.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
        const token = canvasTokenInput.value.trim();
        localStorage.setItem('canvas_domain', domain);
        localStorage.setItem('canvas_token', token);
        closeModals();
        fetchCanvasAssignments();
    });

    document.getElementById('add-category-btn').addEventListener('click', () => {
        categoryForm.reset();
        openModal(categoryModal);
        setTimeout(() => categoryNameInput.focus(), 100);
    });

    document.getElementById('add-link-btn').addEventListener('click', () => {
        if (dashboardData.categories.length === 0) {
            alert('Please create a category first.');
            return;
        }
        linkForm.reset();
        linkIdInput.value = '';
        document.getElementById('link-modal-title').textContent = 'Add Link';
        updateCategorySelect();
        openModal(linkModal);
        setTimeout(() => linkNameInput.focus(), 100);
    });

    overlay.addEventListener('click', closeModals);

    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = categoryNameInput.value.trim();
        if (name) {
            dashboardData.categories.push({ id: generateId(), name, links: [] });
            saveData();
            renderCategories();
            closeModals();
        }
    });

    linkForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let name = linkNameInput.value.trim();
        let url = linkUrlInput.value.trim();
        let desc = linkDescInput.value.trim();
        const catId = linkCategorySelect.value;
        const linkId = linkIdInput.value;

        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const targetCategory = dashboardData.categories.find(c => c.id === catId);
        if (!targetCategory) return;

        if (linkId) {
            let oldCategory = null;
            let existingLinkIndex = -1;

            for (let c of dashboardData.categories) {
                const idx = c.links.findIndex(l => l.id === linkId);
                if (idx !== -1) {
                    oldCategory = c;
                    existingLinkIndex = idx;
                    break;
                }
            }

            if (oldCategory && oldCategory.id !== catId) {
                const [linkToMove] = oldCategory.links.splice(existingLinkIndex, 1);
                linkToMove.name = name;
                linkToMove.url = url;
                linkToMove.desc = desc;
                targetCategory.links.push(linkToMove);
            } else if (oldCategory) {
                oldCategory.links[existingLinkIndex].name = name;
                oldCategory.links[existingLinkIndex].url = url;
                oldCategory.links[existingLinkIndex].desc = desc;
            }
        } else {
            targetCategory.links.push({ id: generateId(), name, url, desc });
        }

        saveData();
        renderCategories();
        closeModals();
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDelete);
}

// DRAG AND DROP LOGIC
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('[draggable="true"]');
    const lists = document.querySelectorAll('.link-list');
    const categories = document.querySelectorAll('.category-card');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', (e) => {
            e.stopPropagation();

            const type = draggable.dataset.type;
            const id = draggable.dataset.id;
            const categoryId = draggable.dataset.category;

            draggedItemInfo = { type, id, categoryId };
            draggable.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            draggedItemInfo = null;
        });
    });

    lists.forEach(list => {
        list.addEventListener('dragover', e => {
            e.preventDefault();
            if (!draggedItemInfo || draggedItemInfo.type !== 'link') return;

            const draggingEl = document.querySelector('.link-item.dragging');
            if (!draggingEl) return;

            const afterElement = getDragAfterElement(list, e.clientY);
            if (afterElement == null) {
                list.appendChild(draggingEl);
            } else {
                list.insertBefore(draggingEl, afterElement);
            }
        });

        list.addEventListener('drop', e => {
            e.preventDefault();
            if (!draggedItemInfo || draggedItemInfo.type !== 'link') return;


            const targetCategoryId = list.dataset.category;
            const linkNodes = Array.from(list.querySelectorAll('.link-item'));
            const newLinkIndexes = linkNodes.map(node => node.dataset.id);

            const oldCategory = dashboardData.categories.find(c => c.id === draggedItemInfo.categoryId);
            const targetCategory = dashboardData.categories.find(c => c.id === targetCategoryId);

            const linkObjIndex = oldCategory.links.findIndex(l => l.id === draggedItemInfo.id);
            const [movedLink] = oldCategory.links.splice(linkObjIndex, 1);

            targetCategory.links.push(movedLink);

            targetCategory.links.sort((a, b) => {
                return newLinkIndexes.indexOf(a.id) - newLinkIndexes.indexOf(b.id);
            });

            saveData();
            renderCategories();
        });
    });

    categoriesContainer.addEventListener('dragover', e => {
        e.preventDefault();
        if (!draggedItemInfo || draggedItemInfo.type !== 'category') return;

        const draggingCategory = document.querySelector('.category-card.dragging');
        if (!draggingCategory) return;

        const afterElement = getDragAfterCategory(categoriesContainer, e.clientX, e.clientY);
        if (afterElement == null) {
            categoriesContainer.appendChild(draggingCategory);
        } else {
            categoriesContainer.insertBefore(draggingCategory, afterElement);
        }
    });

    categoriesContainer.addEventListener('drop', e => {
        e.preventDefault();
        if (!draggedItemInfo || draggedItemInfo.type !== 'category') return;


        const categoryNodes = Array.from(categoriesContainer.querySelectorAll('.category-card'));
        const newCategoryOrder = categoryNodes.map(node => node.dataset.id);

        dashboardData.categories.sort((a, b) => {
            return newCategoryOrder.indexOf(a.id) - newCategoryOrder.indexOf(b.id);
        });

        saveData();
        renderCategories();
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.link-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child }
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function getDragAfterCategory(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.category-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const centerX = box.left + box.width / 2;

        if (y < box.bottom && y > box.top && x < centerX) {
            return { offset: -1, element: child };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function openModal(modal) {
    closeModals();
    overlay.classList.remove('hidden');
    modal.classList.remove('hidden');
}

function closeModals() {
    overlay.classList.add('hidden');
    linkModal.classList.add('hidden');
    categoryModal.classList.add('hidden');
    deleteModal.classList.add('hidden');
    settingsModal.classList.add('hidden');
    authModal.classList.add('hidden');
    itemToDelete = null;
}

window.openEditLink = function (categoryId, linkId) {

    const category = dashboardData.categories.find(c => c.id === categoryId);
    if (!category) return;
    const link = category.links.find(l => l.id === linkId);
    if (!link) return;

    updateCategorySelect();
    linkIdInput.value = link.id;
    linkNameInput.value = link.name;
    linkUrlInput.value = link.url;
    linkDescInput.value = link.desc || '';
    linkCategorySelect.value = category.id;
    document.getElementById('link-modal-title').textContent = 'Edit Link';

    openModal(linkModal);
    setTimeout(() => linkNameInput.focus(), 100);
};

window.openDeleteModal = function (type, id, categoryId = null) {
    openModal(deleteModal);
    itemToDelete = { type, id, categoryId };
    const msgEl = document.getElementById('delete-msg');

    if (type === 'category') {
        const cat = dashboardData.categories.find(c => c.id === id);
        msgEl.innerHTML = `Are you sure you want to delete the category <strong>${escapeHtml(cat.name)}</strong> and all its links?`;
    } else {
        const cat = dashboardData.categories.find(c => c.id === categoryId);
        const link = cat.links.find(l => l.id === id);
        msgEl.innerHTML = `Are you sure you want to delete the link <strong>${escapeHtml(link.name)}</strong>?`;
    }
};

function confirmDelete() {
    if (!itemToDelete) return;


    if (itemToDelete.type === 'category') {
        dashboardData.categories = dashboardData.categories.filter(c => c.id !== itemToDelete.id);
    } else if (itemToDelete.type === 'link') {
        const cat = dashboardData.categories.find(c => c.id === itemToDelete.categoryId);
        if (cat) {
            cat.links = cat.links.filter(l => l.id !== itemToDelete.id);
        }
    }

    saveData();
    renderCategories();
    closeModals();
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModals();
        return;
    }
});

async function fetchCanvasAssignments() {
    const domain = localStorage.getItem('canvas_domain');
    const token = localStorage.getItem('canvas_token');
    const section = document.getElementById('canvas-section');
    const list = document.getElementById('canvas-assignments');
    const err = document.getElementById('canvas-error');

    if (!domain || !token) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    list.innerHTML = '<div style="color:var(--text-secondary); width: 100%; text-align: center; font-size: 0.9rem;">Fetching assignments...</div>';
    err.classList.add('hidden');

    try {
        const res = await fetch(`https://${domain}/api/v1/users/self/todo`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            throw new Error(`Connection Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        if (data.length === 0) {
            list.innerHTML = '<div style="color:var(--text-secondary); width: 100%; text-align: center; font-size: 0.9rem;">No upcoming tasks in Canvas! 🎉</div>';
            return;
        }

        list.innerHTML = data.map(item => {
            const assignment = item.assignment || item.quiz || {};
            const title = assignment.name || item.ignore_url.split('/').pop() || 'Assignment';
            // Determine due date vs general created logic fallback
            const dueDateString = assignment.due_at || item.created_at;
            const date = new Date(dueDateString);
            const formattedDate = isNaN(date.getTime()) ? 'No due date' : date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            const courseMatch = item.html_url.match(/courses\/(\d+)/);
            const courseName = courseMatch ? `Course ID: ${courseMatch[1]}` : item.context_type || 'Class';

            return `
            <a href="${escapeHtml(item.html_url)}" target="_blank" class="canvas-item">
                <div class="canvas-item-course">${escapeHtml(courseName)}</div>
                <div class="canvas-item-title">${escapeHtml(title)}</div>
                <div class="canvas-item-due">
                    <span class="material-symbols-rounded" style="font-size: 16px;">calendar_today</span>
                    Due: ${formattedDate}
                </div>
            </a>
            `;
        }).join('');

    } catch (error) {
        list.innerHTML = '';
        err.classList.remove('hidden');
        err.innerHTML = `<strong>Failed to load Canvas data.</strong><br>This usually happens due to browser CORS security restrictions when hitting Canvas APIs locally, or an invalid token.<br><br><span style="font-family: monospace; font-size: 0.85em;">${escapeHtml(error.message)}</span><br><br>Tip: Use an extension like "Allow CORS: Access-Control-Allow-Origin" when running this dashboard from your local files.`;
    }
}

init();
