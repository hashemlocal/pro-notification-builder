// ==================== إدارة الحالة ====================
let state = {
    currentType: 'info',
    currentIcon: '🔔',
    currentFunction: 'showNotification',
    customVariables: {},
    testValues: {},
    codeCount: 0
};

let customVars = [];

// تحميل الحالة المحفوظة
loadState();

// ==================== إدارة المتغيرات ====================

function addCustomVariable() {
    document.getElementById('variableForm').classList.remove('hidden');
}

function cancelVariableForm() {
    document.getElementById('variableForm').classList.add('hidden');
    document.getElementById('newVarName').value = '';
    document.getElementById('newVarValue').value = '';
}

function saveCustomVariable() {
    const name = document.getElementById('newVarName').value.trim();
    const value = document.getElementById('newVarValue').value.trim();
    
    if (!name) {
        alert('الرجاء إدخال اسم المتغير');
        return;
    }
    
    customVars.push({
        name: name,
        value: value || 'قيمة تجريبية'
    });
    
    renderVariables();
    cancelVariableForm();
    updatePreview();
}

function renderVariables() {
    const list = document.getElementById('variablesList');
    list.innerHTML = '';
    
    customVars.forEach((v, index) => {
        const varElement = document.createElement('div');
        varElement.className = 'flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 bg-gray-50 rounded-lg group gap-2';
        varElement.innerHTML = `
            <div class="flex items-center gap-2 flex-wrap">
                <i class="fas fa-code text-blue-500"></i>
                <span class="font-mono text-sm">\${${v.name}}</span>
                <span class="text-xs text-gray-500">= "${v.value}"</span>
            </div>
            <div class="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition self-end sm:self-auto">
                <button onclick="insertVariableToText('\${${v.name}}')" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-plus"></i>
                </button>
                <button onclick="editVariable(${index})" class="text-green-600 hover:text-green-800">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteVariable(${index})" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(varElement);
    });
}

function insertVariableToText(variable) {
    const textarea = document.getElementById('notificationText');
    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPos);
    const textAfter = textarea.value.substring(cursorPos);
    
    textarea.value = textBefore + variable + textAfter;
    updatePreview();
}

function deleteVariable(index) {
    customVars.splice(index, 1);
    renderVariables();
    updatePreview();
}

function editVariable(index) {
    const v = customVars[index];
    document.getElementById('newVarName').value = v.name;
    document.getElementById('newVarValue').value = v.value;
    document.getElementById('variableForm').classList.remove('hidden');
    
    customVars.splice(index, 1);
}

function addSuggestedVar(name, value) {
    customVars.push({ name, value });
    renderVariables();
    insertVariableToText(`\${${name}}`);
}

// ==================== معاينة وتوليد الكود ====================

function updatePreview() {
    const textarea = document.getElementById('notificationText');
    let text = textarea.value;
    const previewText = document.getElementById('previewText');
    const previewIcon = document.getElementById('previewIcon');
    const charCount = document.getElementById('charCount');
    const varCount = document.getElementById('varCount');
    
    charCount.textContent = text.length;
    
    const varMatches = text.match(/\$\{[^}]+\}/g) || [];
    varCount.textContent = varMatches.length;
    
    let previewContent = text;
    customVars.forEach(v => {
        const regex = new RegExp('\\$\\{' + v.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
        previewContent = previewContent.replace(regex, v.value);
    });
    
    // استبدال \n المتبقية (غير المعروفة) برمز سطر جديد فعلي
    previewContent = previewContent.replace(/\\n/g, '\n');
    
    // للمتغيرات غير المعروفة
    previewContent = previewContent.replace(/\$\{[^}]+\}/g, '?');
    
    previewText.textContent = previewContent || 'نص التنبيه هنا';
    previewIcon.textContent = state.currentIcon;
    
    const previewBox = document.getElementById('previewBox');
    const colors = {
        'success': 'from-green-500 to-green-600',
        'error': 'from-red-500 to-red-600',
        'warning': 'from-yellow-500 to-yellow-600',
        'info': 'from-blue-500 to-purple-600'
    };
    previewBox.className = `p-4 sm:p-6 rounded-xl text-white text-center transition-all duration-300 bg-gradient-to-r ${colors[state.currentType]}`;
    
    generateCode(text);
}

function generateCode(text) {
    let code = '';
    const functionType = state.currentFunction || 'showNotification';
    
    if (customVars.length > 0) {
        code += '// المتغيرات المستخدمة:\n';
        customVars.forEach(v => {
            code += `// const ${v.name} = ${JSON.stringify(v.value)};\n`;
        });
        code += '\n';
    }
    
    const icon = state.currentIcon ? `${state.currentIcon} ` : '';
    const message = `\`${icon}${text}\``;
    const type = state.currentType;
    
    switch(functionType) {
        case 'showNotification':
            code += `showNotification(${message}, '${type}');`;
            break;
        case 'addNotification':
            code += `addNotification(${message}, '${type}');`;
            break;
        case 'showNotificationCenter':
            code += `showNotificationCenter(${message}, '${type}');`;
            break;
         case 'showNotificationCenterPersistent':
            code += `showNotificationCenterPersistent(${message}, '${type}');`;
            break;
        case 'console':
            if (type === 'error') {
                code += `console.error(${message});`;
            } else {
                code += `console.log(${message});`;
            }
            break;
        case 'toast':
            code += `toast.${type}(${message}, {\n`;
            code += `    position: "top-center",\n`;
            code += `    autoClose: 3000,\n`;
            code += `    rtl: true\n`;
            code += `});`;
            break;
        case 'swal':
            code += `Swal.fire({\n`;
            code += `    icon: '${type}',\n`;
            code += `    title: '${icon.trim()}',\n`;
            code += `    text: ${message},\n`;
            code += `    confirmButtonText: 'موافق'\n`;
            code += `});`;
            break;
        case 'notyf':
            code += `const notyf = new Notyf();\n`;
            code += `notyf.${type === 'error' ? 'error' : 'success'}(${message});`;
            break;
        case 'custom':
            const customName = document.getElementById('customFunctionName').value || 'myNotification';
            code += `${customName}(${message}, '${type}');`;
            break;
        default:
            code += `showNotification(${message}, '${type}');`;
    }
    
    if (functionType === 'showNotification' || functionType === 'addNotification') {
        code = `// تأكد من تعريف دالة ${functionType} في مشروعك\n` + code;
    }
    
    const codeElement = document.getElementById('generatedCode').querySelector('code');
    codeElement.textContent = code;
    
    if (typeof Prism !== 'undefined') {
        Prism.highlightElement(codeElement);
    }
    
    state.codeCount++;
    document.getElementById('statsCount').textContent = state.codeCount;
    
    saveState();
}

function setType(type) {
    state.currentType = type;
    
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('border-4', 'border-green-600', 'border-red-600', 'border-yellow-600', 'border-blue-600');
    });
    
    const activeBtn = document.querySelector(`[data-type="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.add('border-4');
        
        const borderColor = {
            'success': 'border-green-600',
            'error': 'border-red-600',
            'warning': 'border-yellow-600',
            'info': 'border-blue-600'
        };
        activeBtn.classList.add(borderColor[type]);
    }
    
    updatePreview();
}

function setIcon(icon) {
    state.currentIcon = icon;
    updatePreview();
}

function setFunctionType(type) {
    state.currentFunction = type;
    
    document.querySelectorAll('.function-btn').forEach(btn => {
        btn.classList.remove('border-4', 'border-indigo-600', 'border-purple-600', 'border-blue-600', 
                           'border-gray-600', 'border-green-600', 'border-red-600', 'border-yellow-600', 
                           'border-pink-600');
    });
    
    const activeBtn = document.querySelector(`[data-function="${type}"]`);
    if (activeBtn) {
        activeBtn.classList.add('border-4');
        
        const colors = {
            'showNotification': 'border-indigo-600',
            'addNotification': 'border-purple-600',
            'showNotificationCenter': 'border-blue-600',
            'showNotificationCenterPersistent': 'border-purple-900',
            'console': 'border-gray-600',
            'toast': 'border-green-600',
            'swal': 'border-red-600',
            'notyf': 'border-yellow-600',
            'custom': 'border-pink-600'
        };
        activeBtn.classList.add(colors[type]);
    }
    
    const customField = document.getElementById('customFunctionField');
    if (type === 'custom') {
        customField.classList.remove('hidden');
    } else {
        customField.classList.add('hidden');
    }
    
    updatePreview();
}

// ==================== أدوات مساعدة ====================

function formatText(type) {
    const textarea = document.getElementById('notificationText');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (type === 'bold') {
        textarea.value = textarea.value.substring(0, start) + 
                        '**' + selectedText + '**' + 
                        textarea.value.substring(end);
    } else if (type === 'italic') {
        textarea.value = textarea.value.substring(0, start) + 
                        '*' + selectedText + '*' + 
                        textarea.value.substring(end);
    }
    
    updatePreview();
}
// دالة لإدراج \n في موضع المؤشر
function insertNewLine() {
    const textarea = document.getElementById('notificationText');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    // إدراج \n في موضع المؤشر
    textarea.value = textarea.value.substring(0, start) + '\\n' + textarea.value.substring(end);
    
    // إعادة وضع المؤشر بعد \n مباشرة
    textarea.selectionStart = textarea.selectionEnd = start + 2;
    
    // تحديث المعاينة
    updatePreview();
}

function insertVariable() {
    const varName = prompt('أدخل اسم المتغير (مثال: user.name):');
    if (varName) {
        insertVariableToText(`\${${varName}}`);
        
        if (!customVars.some(v => v.name === varName)) {
            customVars.push({
                name: varName,
                value: 'قيمة'
            });
            renderVariables();
        }
    }
}

function clearEditor() {
    if (confirm('هل أنت متأكد من مسح كل النص؟')) {
        document.getElementById('notificationText').value = '';
        updatePreview();
    }
}

// ==================== نسخ وتحميل ====================

function copyCode() {
    const code = document.getElementById('generatedCode').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showNotification('تم نسخ الكود بنجاح!', 'success');
    }).catch(() => {
        alert('تم نسخ الكود بنجاح!');
    });
}

function downloadCode() {
    const code = document.getElementById('generatedCode').querySelector('code').textContent;
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notification-code.js';
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== حفظ وتحميل المشروع ====================

function saveState() {
    const project = {
        text: document.getElementById('notificationText').value,
        type: state.currentType,
        icon: state.currentIcon,
        function: state.currentFunction,
        variables: customVars,
        codeCount: state.codeCount
    };
    localStorage.setItem('notificationProject', JSON.stringify(project));
}

function loadState() {
    const saved = localStorage.getItem('notificationProject');
    if (saved) {
        try {
            const project = JSON.parse(saved);
            document.getElementById('notificationText').value = project.text || '';
            state.currentType = project.type || 'info';
            state.currentIcon = project.icon || '🔔';
            state.currentFunction = project.function || 'showNotification';
            customVars = project.variables || [];
            state.codeCount = project.codeCount || 0;
            
            renderVariables();
            setType(state.currentType);
            setFunctionType(state.currentFunction);
            updatePreview();
            document.getElementById('statsCount').textContent = state.codeCount;
        } catch (e) {
            console.error('خطأ في تحميل المشروع', e);
        }
    }
}

function saveProject() {
    saveState();
    showNotification('تم حفظ المشروع بنجاح!', 'success');
}

function loadProject() {
    if (confirm('هل تريد تحميل آخر مشروع محفوظ؟')) {
        loadState();
    }
}

// ==================== قوالب جاهزة ====================

function loadTemplate(type) {
    const textarea = document.getElementById('notificationText');
    
    switch(type) {
        case 'products':
            textarea.value = 'تم تحديث (${count} منتج) بنجاح';
            setType('success');
            break;
        case 'invoice':
            textarea.value = 'فشل تحميل الفاتورة: ${error}';
            setType('error');
            break;
        case 'user':
            textarea.value = 'مرحباً ${user.name}، لديك ${messages} رسائل';
            setType('info');
            break;
        case 'payment':
            textarea.value = 'تم الدفع: ${amount} ريال (${payment.method})';
            setType('success');
            break;
    }
    
    updatePreview();
}

// ==================== إشعارات ====================

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-4 sm:px-6 py-3 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } animate-slide z-50 text-sm sm:text-base`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==================== دوال مساعدة إضافية ====================

function copyHelper(type) {
    let code = '';
    
    if (type === 'showNotification') {
        code = `const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = \`fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white \${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }\`;
    notification.textContent = message;
    notification.setAttribute('role', 'alert');
    notification.style.zIndex = '9999';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
};`;
    } else if (type === 'addNotification') {
        code = `// للإصدارات الحديثة من Vue
import { ref } from 'vue';

export function useNotifications() {
    const notifications = ref([]);
    
    const addNotification = (message, type = 'info') => {
        const id = Date.now();
        notifications.value.push({ id, message, type });
        
        setTimeout(() => {
            notifications.value = notifications.value.filter(n => n.id !== id);
        }, 3000);
    };
    
    return { notifications, addNotification };
}`;
    }
    
    navigator.clipboard.writeText(code).then(() => {
        showNotification('تم نسخ الدالة المساعدة!', 'success');
    });
}

// ==================== تبديل السمة ====================

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// ==================== مراقبة التغييرات ====================

document.getElementById('notificationText').addEventListener('input', updatePreview);
document.getElementById('themeToggle').addEventListener('change', toggleTheme);

// تحديث عند التحميل
window.onload = function() {
    updatePreview();
    renderVariables();
    setType(state.currentType);
    setFunctionType(state.currentFunction);
};

// حفظ الحالة كل 5 ثواني
setInterval(saveState, 5000);