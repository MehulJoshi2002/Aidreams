// DreamDiary.AI - Complete Version with Supabase Integration
let memories = [];
let selectedMemories = new Set();
let currentUser = null;

// Groq API Configuration - Hardcoded for client-side use
const GROQ_API_KEY = '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';
const GROQ_CHAT_API = 'https://api.groq.com/openai/v1/chat/completions';

// ======== SUPABASE CONFIGURATION ========
// Using the global supabase client from your index.html

// ======== SUPABASE FUNCTIONS ========
async function testSupabase() {
    console.log('🧪 Testing Supabase connection...');
    
    if (!window.supabase) {
        console.error('❌ Supabase client not available');
        return false;
    }
    
    try {
        const { data, error } = await window.supabase.from('memories').select('*').limit(1);
        
        if (error) {
            console.error('❌ Supabase error:', error);
            return false;
        } else {
            console.log('✅ Supabase connected! Memories table is ready.');
            return true;
        }
    } catch (err) {
        console.error('❌ Connection failed:', err);
        return false;
    }
}

async function checkAuth() {
    if (!window.supabase) {
        console.error('❌ Supabase not available');
        showAuth();
        return;
    }
    
    try {
        console.log('🔐 Checking authentication...');
        const { data: { session }, error } = await window.supabase.auth.getSession();
        
        if (error) {
            console.error('Auth session error:', error);
            showAuth();
            return;
        }
        
        if (session && session.user) {
            console.log('✅ User authenticated:', session.user.email);
            currentUser = session.user;
            showApp();
            loadMemories();
        } else {
            console.log('❌ No active session');
            showAuth();
        }
    } catch (error) {
        console.error('❌ Auth check failed:', error);
        showAuth();
    }
}

async function signup() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (!window.supabase) {
        alert('Service temporarily unavailable. Please try again later.');
        return;
    }
    
    const authBtn = document.querySelector('#signup-form .auth-btn');
    const originalText = authBtn.textContent;
    
    try {
        authBtn.textContent = 'Creating account...';
        authBtn.disabled = true;
        
        console.log('📝 Attempting signup for:', email);
        
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) {
            console.error('❌ Signup error:', error);
            
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                alert('Network error: Please check your internet connection and try again.');
            } else if (error.message?.includes('email')) {
                alert('Invalid email format. Please check your email address.');
            } else if (error.message?.includes('password')) {
                alert('Password should be at least 6 characters long.');
            } else {
                alert('Sign up error: ' + error.message);
            }
        } else {
            console.log('✅ Signup successful:', data);
            alert('Sign up successful! Please check your email for verification. You can now login.');
            showAuthTab('login');
            
            // Clear form
            document.getElementById('signup-email').value = '';
            document.getElementById('signup-password').value = '';
        }
        
    } catch (error) {
        console.error('❌ Signup exception:', error);
        alert('Service temporarily unavailable. Please try again later.');
    } finally {
        authBtn.textContent = originalText;
        authBtn.disabled = false;
    }
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (!window.supabase) {
        alert('Service temporarily unavailable. Please try again later.');
        return;
    }
    
    const authBtn = document.querySelector('#login-form .auth-btn');
    const originalText = authBtn.textContent;
    
    try {
        authBtn.textContent = 'Signing in...';
        authBtn.disabled = true;
        
        console.log('🔑 Attempting login for:', email);
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            console.error('❌ Login error:', error);
            
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                alert('Network error: Please check your internet connection and try again.');
            } else if (error.message?.includes('Invalid login credentials')) {
                alert('Invalid email or password. Please try again.');
            } else if (error.message?.includes('Email not confirmed')) {
                alert('Please verify your email address before logging in.');
            } else {
                alert('Login error: ' + error.message);
            }
        } else {
            console.log('✅ Login successful:', data);
            currentUser = data.user;
            showApp();
            loadMemories();
            
            // Clear form
            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
        }
        
    } catch (error) {
        console.error('❌ Login exception:', error);
        alert('Service temporarily unavailable. Please try again later.');
    } finally {
        authBtn.textContent = originalText;
        authBtn.disabled = false;
    }
}

async function logout() {
    if (!window.supabase) {
        console.error('Supabase not available for logout');
        return;
    }
    
    try {
        const { error } = await window.supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        currentUser = null;
        memories = [];
        showAuth();
        console.log('✅ Logged out successfully');
    } catch (error) {
        console.error('Logout exception:', error);
    }
}

function showAuth() {
    document.getElementById('auth-section').style.display = 'flex';
    document.querySelector('.app-container').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
}

function showApp() {
    document.getElementById('auth-section').style.display = 'none';
    document.querySelector('.app-container').style.display = 'block';
    document.getElementById('user-info').style.display = 'flex';
    if (currentUser) {
        document.getElementById('user-email').textContent = currentUser.email;
    }
}

function showAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-content').forEach(c => c.style.display = 'none');
    
    document.querySelector(`.auth-tab:nth-child(${tab === 'login' ? '1' : '2'})`).classList.add('active');
    document.getElementById(tab === 'login' ? 'login-form' : 'signup-form').style.display = 'block';
}

// ======== MEMORY FUNCTIONS WITH SUPABASE ========
async function loadMemories() {
    if (!currentUser || !window.supabase) {
        console.log('No user or Supabase not available');
        memories = getLocalMemories();
        renderMemories();
        return;
    }
    
    try {
        console.log('📚 Loading memories for user:', currentUser.id);
        
        const { data, error } = await window.supabase
            .from('memories')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error loading memories:', error);
            memories = getLocalMemories();
        } else {
            memories = data || [];
            console.log('✅ Loaded memories from Supabase:', memories.length);
            // Also save to local storage as backup
            saveLocalMemories(memories);
        }
        
        renderMemories();
    } catch (error) {
        console.error('❌ Load memories failed:', error);
        memories = getLocalMemories();
        renderMemories();
    }
}

async function saveMemoryToSupabase(memoryData) {
    if (!currentUser) {
        alert('Please login to save memories');
        return null;
    }
    
    // First save locally for immediate feedback
    const localMemory = {
        ...memoryData,
        id: 'local_' + Date.now(),
        user_id: currentUser.id,
        created_at: new Date().toISOString()
    };
    
    memories.unshift(localMemory);
    saveLocalMemories(memories);
    renderMemories();
    
    if (!window.supabase) {
        console.warn('Supabase not available, saving locally only');
        return localMemory;
    }
    
    try {
        const memoryWithUser = {
            ...memoryData,
            user_id: currentUser.id,
            created_at: new Date().toISOString()
        };
        
        console.log('💾 Saving memory to Supabase...');
        
        const { data, error } = await window.supabase
            .from('memories')
            .insert([memoryWithUser])
            .select();
        
        if (error) {
            console.error('Error saving memory to Supabase:', error);
            console.log('Memory saved locally only');
            return localMemory;
        }
        
        console.log('✅ Memory saved to Supabase successfully');
        
        // Replace local memory with server memory
        if (data && data[0]) {
            const serverMemory = data[0];
            const localIndex = memories.findIndex(m => m.id === localMemory.id);
            if (localIndex !== -1) {
                memories[localIndex] = serverMemory;
                saveLocalMemories(memories);
            }
            return serverMemory;
        }
        
        return localMemory;
    } catch (error) {
        console.error('❌ Save memory exception:', error);
        console.log('Memory saved locally only');
        return localMemory;
    }
}

// Local storage fallback functions
function getLocalMemories() {
    try {
        const localMemories = localStorage.getItem('dreamdiary_local_memories');
        return localMemories ? JSON.parse(localMemories) : [];
    } catch (error) {
        console.error('Error loading local memories:', error);
        return [];
    }
}

function saveLocalMemories(memoriesArray) {
    try {
        localStorage.setItem('dreamdiary_local_memories', JSON.stringify(memoriesArray));
    } catch (error) {
        console.error('Error saving local memories:', error);
    }
}

// ======== MODIFIED EXISTING FUNCTIONS ========
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Please login to save memories');
        showAuth();
        return;
    }
    
    const memoryTextElement = document.getElementById('memory-text');
    
    const memoryText = memoryTextElement.value.trim();
    const photoData = localStorage.getItem('dreamdiary_current_photo') || '';
    
    if (!memoryText) {
        alert('Please write about your day before saving.');
        return;
    }
    
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    
    try {
        saveBtn.textContent = '🤖 AI Analyzing...';
        saveBtn.disabled = true;
        
        console.log('🤖 Analyzing your memory...');
        
        // Detect emotion using smart text analysis
        const emotionData = analyzeTextForEmotion(memoryText);
        console.log('✅ Emotion detected:', emotionData);
        
        // Get AI reflection from Groq API
        let aiReflection;
        try {
            aiReflection = await generateWithGroq(memoryText, emotionData.emotion, emotionData.intensity);
            console.log('✅ Groq AI reflection generated');
        } catch (groqError) {
            console.warn('🤖 Groq failed, using enhanced reflection:', groqError.message);
            aiReflection = generateEnhancedReflection(memoryText, emotionData.emotion, emotionData.intensity);
        }
        
        const newMemory = {
            memory_text: memoryText,
            photo_url: photoData,
            emotion: emotionData.emotion,
            intensity: emotionData.intensity,
            reflection: aiReflection
        };
        
        // Save to Supabase (with local fallback)
        const savedMemory = await saveMemoryToSupabase(newMemory);
        
        if (savedMemory) {
            console.log('✅ Memory saved:', savedMemory);
            
            // Show AI reflection
            showReflectionModal({
                emotion: { label: emotionData.emotion, intensity: emotionData.intensity },
                reflection: aiReflection
            });
            
            // Reset form
            e.target.reset();
            localStorage.removeItem('dreamdiary_current_photo');
            const photoPreview = document.getElementById('photo-preview');
            if (photoPreview) photoPreview.style.display = 'none';
            
            // Reload memories
            loadMemories();
        }
        
    } catch (error) {
        console.error('❌ Analysis failed:', error);
        // Fallback: Save with basic reflection
        const fallbackMemory = {
            memory_text: memoryText,
            photo_url: photoData,
            emotion: 'neutral',
            intensity: 75,
            reflection: "Thank you for sharing this moment. Your words create space for reflection and growth. 📖"
        };
        
        const savedMemory = await saveMemoryToSupabase(fallbackMemory);
        if (savedMemory) {
            showReflectionModal({
                emotion: { label: 'neutral', intensity: 75 },
                reflection: "Thank you for sharing this moment. Your words create space for reflection and growth. 📖"
            });
            loadMemories();
        }
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

// Update delete functions to use Supabase
async function deleteSingleMemory(memoryId, event) {
    event.stopPropagation();
    
    if (!currentUser) {
        alert('Please login to delete memories');
        return;
    }
    
    if (confirm('Are you sure you want to delete this memory?')) {
        // Remove from local memories first
        memories = memories.filter(memory => memory.id !== memoryId);
        selectedMemories.delete(memoryId);
        saveLocalMemories(memories);
        renderMemories();
        
        // Try to delete from Supabase if available
        if (window.supabase && !memoryId.startsWith('local_')) {
            const success = await deleteMemoryFromSupabase(memoryId);
            if (!success) {
                console.log('Memory deleted locally but not from server');
            }
        }
        
        console.log('🗑️ Memory deleted:', memoryId);
    }
}

async function deleteMemoryFromSupabase(memoryId) {
    if (!window.supabase) return false;
    
    try {
        const { error } = await window.supabase
            .from('memories')
            .delete()
            .eq('id', memoryId)
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('Error deleting memory from Supabase:', error);
            return false;
        }
        
        console.log('✅ Memory deleted from Supabase:', memoryId);
        return true;
    } catch (error) {
        console.error('❌ Delete memory exception:', error);
        return false;
    }
}

async function deleteSelectedMemoriesFromSupabase(memoryIds) {
    if (!window.supabase) return false;
    
    try {
        const { error } = await window.supabase
            .from('memories')
            .delete()
            .in('id', Array.from(memoryIds))
            .eq('user_id', currentUser.id);
        
        if (error) {
            console.error('Error deleting memories from Supabase:', error);
            return false;
        }
        
        console.log(`✅ ${memoryIds.size} memories deleted from Supabase`);
        return true;
    } catch (error) {
        console.error('❌ Delete memories exception:', error);
        return false;
    }
}

async function deleteSelectedMemories() {
    if (!currentUser) {
        alert('Please login to delete memories');
        return;
    }
    
    if (selectedMemories.size === 0) {
        alert('Please select memories to delete.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedMemories.size} ${selectedMemories.size === 1 ? 'memory' : 'memories'}?`)) {
        // Remove from local memories first
        memories = memories.filter(memory => !selectedMemories.has(memory.id));
        saveLocalMemories(memories);
        
        // Try to delete from Supabase if available
        if (window.supabase) {
            const serverMemoryIds = Array.from(selectedMemories).filter(id => !id.startsWith('local_'));
            if (serverMemoryIds.length > 0) {
                const success = await deleteSelectedMemoriesFromSupabase(serverMemoryIds);
                if (!success) {
                    console.log('Memories deleted locally but not from server');
                }
            }
        }
        
        selectedMemories.clear();
        renderMemories();
        console.log(`🗑️ ${selectedMemories.size} memories deleted`);
    }
}

async function clearAllMemories() {
    if (!currentUser) {
        alert('Please login to clear memories');
        return;
    }
    
    if (memories.length === 0) {
        alert('No memories to clear.');
        closeClearModal();
        return;
    }
    
    try {
        // Clear local memories
        memories = [];
        selectedMemories.clear();
        saveLocalMemories(memories);
        renderMemories();
        
        // Try to clear from Supabase if available
        if (window.supabase) {
            const { error } = await window.supabase
                .from('memories')
                .delete()
                .eq('user_id', currentUser.id);
            
            if (error) {
                console.error('Error clearing memories from Supabase:', error);
            }
        }
        
        closeClearModal();
        alert('All memories have been cleared successfully!');
        console.log('🗑️ All memories cleared');
    } catch (error) {
        console.error('❌ Clear memories exception:', error);
        alert('Network error: Could not clear memories. Please try again.');
    }
}

// Update renderMemories to use Supabase data structure
function renderMemories() {
    const memoriesList = document.getElementById('memories-list');
    const selectionActions = document.getElementById('selection-actions');
    
    if (!memoriesList) return;
    
    if (memories.length === 0) {
        memoriesList.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                <p style="font-size: 1.1rem;">No memories yet. Start with a moment — big or small.</p>
            </div>
        `;
        if (selectionActions) selectionActions.style.display = 'none';
        return;
    }
    
    memoriesList.innerHTML = memories.map(memory => `
        <div class="memory-card" onclick="toggleMemoryExpand('${memory.id}')">
            <div class="memory-header">
                <div class="memory-date">${formatShortDate(new Date(memory.created_at))} ${memory.id.startsWith('local_') ? '📱' : '☁️'}</div>
                <div class="memory-actions">
                    <input type="checkbox" class="select-checkbox" id="select-${memory.id}" 
                           onchange="toggleMemorySelection('${memory.id}')" 
                           ${selectedMemories.has(memory.id) ? 'checked' : ''}>
                    <button class="delete-btn" onclick="deleteSingleMemory('${memory.id}', event)">🗑️</button>
                </div>
            </div>
            <div class="emotion-badge ${memory.emotion}">
                ${getEmoji(memory.emotion)} ${memory.emotion} · ${memory.intensity}%
            </div>
            <div class="memory-preview">${memory.reflection}</div>
            <button class="expand-btn">▸ Read more</button>
            <div class="memory-full" id="memory-full-${memory.id}">
                <div class="memory-content">
                    <p>${memory.memory_text}</p>
                </div>
                ${memory.photo_url ? `
                <div class="photo-section">
                    <h4>Photo</h4>
                    <img src="${memory.photo_url}" alt="Memory photo" class="memory-photo">
                </div>
                ` : ''}
                ${memory.id.startsWith('local_') ? `
                <div class="local-notice" style="margin-top: 1rem; padding: 0.5rem; background: rgba(255, 193, 7, 0.1); border-radius: 8px; font-size: 0.8rem; color: #ff9800;">
                    📱 Stored locally only
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    updateSelectionActions();
}

// ======== SHARE & DOWNLOAD FUNCTIONS ========
function shareMonthlyWrap() {
    if (memories.length === 0) {
        alert("No memories to share yet! Start writing to create your monthly wrap.");
        return;
    }
    
    const summary = generateAISummary();
    const shareText = `My DreamDiary Monthly Wrap 📖\n\n${summary.title}\n${summary.summary}\n\nCheck out DreamDiary: https://your-app-url.com`;
    
    if (navigator.share) {
        navigator.share({
            title: 'My DreamDiary Monthly Wrap',
            text: shareText,
            url: 'https://your-app-url.com'
        });
    } else {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Monthly wrap copied to clipboard! 📋');
        });
    }
}

function downloadMonthlyWrap() {
    if (memories.length === 0) {
        alert("No memories to download yet! Start writing to create your monthly wrap.");
        return;
    }
    
    alert('Monthly wrap download feature coming soon! 🚀');
    // This would generate and download an image file
}

// ======== INITIALIZATION ========
function initializeApp() {
    // Set current date
    const now = new Date();
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        currentDateElement.textContent = formatDate(now);
    }
    
    // Form setup
    const memoryForm = document.getElementById('memory-form');
    if (memoryForm) {
        memoryForm.addEventListener('submit', handleFormSubmit);
    }
    
    // Photo upload
    const photoUpload = document.getElementById('photo-upload');
    if (photoUpload) {
        photoUpload.addEventListener('change', handlePhotoUpload);
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            this.textContent = newTheme === 'dark' ? '☀️' : '🌙';
            
            if (newTheme === 'dark') {
                createStars();
            }
            
            localStorage.setItem('dreamdiary_theme', newTheme);
        });
    }
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DreamDiary.AI with Supabase & Groq AI');
    
    // Load theme
    const savedTheme = localStorage.getItem('dreamdiary_theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }
        if (savedTheme === 'dark') {
            createStars();
        }
    }
    
    initializeApp();
    
    // Check authentication with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    function attemptAuthCheck() {
        setTimeout(() => {
            if (!window.supabase) {
                console.error('Supabase not initialized, showing auth screen');
                showAuth();
                return;
            }
            
            checkAuth().then(() => {
                testSupabase();
            }).catch(error => {
                console.error('Auth check failed:', error);
                retryCount++;
                if (retryCount < maxRetries) {
                    console.log(`Retrying auth check... (${retryCount}/${maxRetries})`);
                    attemptAuthCheck();
                } else {
                    console.error('Max retries reached. Showing auth screen.');
                    showAuth();
                }
            });
        }, 1000);
    }
    
    attemptAuthCheck();
});

// ======== UTILITY FUNCTIONS ========
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

function formatShortDate(date) {
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

function getEmoji(emotion) {
    const emojis = {
        joy: '😊', sadness: '😢', anger: '😠', fear: '😨',
        surprise: '😮', neutral: '😐'
    };
    return emojis[emotion] || '✨';
}

function toggleMemoryExpand(memoryId) {
    const memoryFull = document.getElementById(`memory-full-${memoryId}`);
    if (!memoryFull) return;
    
    const expandBtn = memoryFull.previousElementSibling;
    if (!expandBtn) return;
    
    if (memoryFull.classList.contains('active')) {
        memoryFull.classList.remove('active');
        expandBtn.innerHTML = '▸ Read more';
    } else {
        memoryFull.classList.add('active');
        expandBtn.innerHTML = '▾ Show less';
    }
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('dreamdiary_current_photo', e.target.result);
            const preview = document.getElementById('photo-preview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Memory photo">`;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

function toggleCalendar() {
    const sidebar = document.getElementById('calendar-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

// Selection functionality
function toggleMemorySelection(memoryId) {
    if (selectedMemories.has(memoryId)) {
        selectedMemories.delete(memoryId);
    } else {
        selectedMemories.add(memoryId);
    }
    updateSelectionActions();
}

function toggleSelectAll() {
    const allSelected = selectedMemories.size === memories.length;
    
    if (allSelected) {
        // Deselect all
        selectedMemories.clear();
    } else {
        // Select all
        memories.forEach(memory => {
            selectedMemories.add(memory.id);
        });
    }
    
    // Update checkboxes
    memories.forEach(memory => {
        const checkbox = document.getElementById(`select-${memory.id}`);
        if (checkbox) {
            checkbox.checked = !allSelected;
        }
    });
    
    updateSelectionActions();
}

function updateSelectionActions() {
    const selectionActions = document.getElementById('selection-actions');
    const selectionInfo = document.getElementById('selection-info');
    
    if (selectionActions && selectionInfo) {
        if (selectedMemories.size > 0) {
            selectionActions.style.display = 'flex';
            selectionInfo.textContent = `${selectedMemories.size} ${selectedMemories.size === 1 ? 'memory' : 'memories'} selected`;
        } else {
            selectionActions.style.display = 'none';
        }
    }
}

// Modal functions
function showReflectionModal(aiInsights) {
    const reflectionText = document.getElementById('ai-reflection-text');
    const intensityElement = document.getElementById('emotion-intensity');
    const modal = document.getElementById('reflection-modal');
    
    if (reflectionText) {
        reflectionText.textContent = aiInsights.reflection;
    }
    
    if (intensityElement) {
        intensityElement.textContent = aiInsights.emotion.intensity + '%';
    }
    
    const emotionBadge = document.querySelector('#reflection-modal .emotion-badge');
    if (emotionBadge) {
        emotionBadge.className = `emotion-badge ${aiInsights.emotion.label}`;
        emotionBadge.innerHTML = `${getEmoji(aiInsights.emotion.label)} ${aiInsights.emotion.label} · ${aiInsights.emotion.intensity}%`;
    }
    
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal() {
    const modal = document.getElementById('reflection-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    showScreen('home-screen');
}

function showClearConfirmation() {
    const clearModal = document.getElementById('clear-modal');
    const memoriesCount = document.getElementById('memories-count');
    
    if (clearModal && memoriesCount) {
        memoriesCount.textContent = memories.length;
        clearModal.classList.add('active');
    }
}

function closeClearModal() {
    const clearModal = document.getElementById('clear-modal');
    if (clearModal) {
        clearModal.classList.remove('active');
    }
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    if (screenId === 'memories-screen') {
        loadMemories();
    }
    
    if (screenId === 'summary-screen') {
        updateSummaryScreen();
    }
}

// Background animations
function createStars() {
    const starsContainer = document.getElementById('stars-container');
    if (!starsContainer) return;
    
    starsContainer.innerHTML = '';
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        const size = Math.random() * 2 + 1;
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.animationDelay = Math.random() * 4 + 's';
        starsContainer.appendChild(star);
    }
}

// AI Summary functions
function generateAISummary() {
    if (memories.length === 0) {
        return {
            title: "📖 Your Journal Awaits",
            summary: "Start writing your first memory to unlock personalized insights and emotional patterns.",
            emotionGraph: {
                calm: 0,
                hopeful: 0,
                reflective: 0,
                creative: 0
            }
        };
    }
    
    // Calculate emotion statistics
    const emotionCounts = {};
    let totalIntensity = 0;
    
    memories.forEach(memory => {
        emotionCounts[memory.emotion] = (emotionCounts[memory.emotion] || 0) + 1;
        totalIntensity += memory.intensity;
    });
    
    // Find dominant emotion
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, 'neutral'
    );
    
    const avgIntensity = Math.round(totalIntensity / memories.length);
    const memoryCount = memories.length;
    
    // Generate summary based on data
    const summaries = {
        joy: [
            `Your ${getTimeframe()} has been filled with beautiful moments of joy and positivity! You've shown wonderful consistency in capturing happy memories.`,
            `Happiness radiates through your ${getTimeframe()} - so many wonderful moments to cherish! Your positive outlook is truly inspiring.`,
            `Your ${getTimeframe()} shines with positive energy and joyful experiences! You've created a beautiful collection of happy memories.`
        ],
        sadness: [
            `Your ${getTimeframe()} has been a journey of emotional depth and reflection. You've shown remarkable strength in navigating complex feelings.`,
            `You've demonstrated incredible emotional awareness throughout your ${getTimeframe()}. Your willingness to sit with difficult emotions shows true courage.`,
            `Your ${getTimeframe()} reveals deep emotional growth through challenges. Your honest reflections create space for meaningful healing.`
        ],
        anger: [
            `Your ${getTimeframe()} shows powerful emotional energy and strong personal boundaries. You've channeled intensity into self-awareness beautifully.`,
            `You've demonstrated clear values and emotional authenticity this ${getTimeframe()}. Your strong reactions highlight important personal boundaries.`,
            `Your ${getTimeframe()} shows you standing firmly in your truth. The intensity you've expressed often precedes important personal growth.`
        ],
        fear: [
            `Your ${getTimeframe()} has been a courageous journey facing fears and anxieties. You've shown incredible bravery in acknowledging vulnerabilities.`,
            `You've navigated uncertainties with remarkable strength this ${getTimeframe()}. Your awareness of fears is actually a sign of deep self-knowledge.`,
            `Your ${getTimeframe()} reveals growing confidence in facing life's challenges. Each anxious moment acknowledged is a step toward empowerment.`
        ],
        neutral: [
            `Your ${getTimeframe()} has been a time of calm observation and steady reflection. You've maintained beautiful equilibrium throughout.`,
            `You've shown consistent mindfulness and emotional balance this ${getTimeframe()}. Your calm presence creates space for genuine insight.`,
            `Your ${getTimeframe()} demonstrates wonderful self-awareness and thoughtful presence. There's great wisdom in your steady observations.`
        ]
    };
    
    const title = `🎭 Your ${getTimeframe(true)} of ${getEmotionAdjective(dominantEmotion)}`;
    const summary = summaries[dominantEmotion]?.[Math.floor(Math.random() * summaries[dominantEmotion].length)] || 
                   `Your ${getTimeframe()} has been a meaningful journey of self-discovery and emotional awareness. You've created ${memoryCount} precious memories.`;
    
    // Calculate emotion graph percentages based on actual data
    const emotionGraph = calculateEmotionGraph();
    
    return {
        title,
        summary,
        emotionGraph,
        memoryCount,
        dominantEmotion,
        avgIntensity
    };
}

function getTimeframe(capitalize = false) {
    if (memories.length === 0) return capitalize ? "Journey" : "journey";
    
    const memoryDates = memories.map(m => new Date(m.created_at));
    const oldest = new Date(Math.min(...memoryDates));
    const newest = new Date(Math.max(...memoryDates));
    const diffTime = Math.abs(newest - oldest);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return capitalize ? "Week" : "week";
    if (diffDays <= 30) return capitalize ? "Month" : "month";
    if (diffDays <= 90) return capitalize ? "Season" : "season";
    return capitalize ? "Journey" : "journey";
}

function getEmotionAdjective(emotion) {
    const adjectives = {
        joy: "Joyful Moments",
        sadness: "Quiet Reflection", 
        anger: "Powerful Insights",
        fear: "Courageous Growth",
        neutral: "Peaceful Awareness",
        surprise: "Unexpected Discoveries"
    };
    return adjectives[emotion] || "Meaningful Insights";
}

function calculateEmotionGraph() {
    const emotionTotals = {
        calm: 0,
        hopeful: 0,
        reflective: 0,
        creative: 0
    };
    
    if (memories.length === 0) {
        return {
            calm: 0,
            hopeful: 0,
            reflective: 0,
            creative: 0
        };
    }
    
    memories.forEach(memory => {
        // Map detected emotions to summary categories
        switch(memory.emotion) {
            case 'joy':
                emotionTotals.calm += memory.intensity * 0.7;
                emotionTotals.hopeful += memory.intensity * 0.8;
                break;
            case 'sadness':
                emotionTotals.reflective += memory.intensity * 0.9;
                break;
            case 'neutral':
                emotionTotals.calm += memory.intensity * 0.8;
                emotionTotals.reflective += memory.intensity * 0.6;
                break;
            case 'surprise':
                emotionTotals.creative += memory.intensity * 0.7;
                break;
            case 'anger':
                emotionTotals.reflective += memory.intensity * 0.8;
                break;
            case 'fear':
                emotionTotals.reflective += memory.intensity * 0.7;
                break;
        }
    });
    
    // Convert to percentages
    const maxPossible = memories.length * 100;
    return {
        calm: Math.round((emotionTotals.calm / maxPossible) * 100),
        hopeful: Math.round((emotionTotals.hopeful / maxPossible) * 100),
        reflective: Math.round((emotionTotals.reflective / maxPossible) * 100),
        creative: Math.round((emotionTotals.creative / maxPossible) * 100)
    };
}

function updateSummaryScreen() {
    const summary = generateAISummary();
    
    // Update title
    const titleElement = document.getElementById('summary-title');
    if (titleElement) {
        titleElement.textContent = summary.title;
    }
    
    // Update summary text
    const summaryElement = document.getElementById('ai-summary-text');
    if (summaryElement) {
        summaryElement.textContent = summary.summary;
    }
    
    // Update emotion graph
    const emotionBars = document.querySelectorAll('.emotion-bar');
    emotionBars.forEach(bar => {
        const label = bar.querySelector('.bar-label').textContent.toLowerCase();
        const fill = bar.querySelector('.bar-fill');
        const percentage = bar.querySelector('.bar-percentage');
        
        if (fill && percentage && summary.emotionGraph[label] !== undefined) {
            const width = summary.emotionGraph[label];
            fill.style.width = width + '%';
            percentage.textContent = width + '%';
        }
    });
    
    // Update countdown based on memory frequency
    updateCountdown();
}

function updateCountdown() {
    const countdownElement = document.getElementById('countdown-days');
    if (!countdownElement) return;
    
    if (memories.length === 0) {
        countdownElement.textContent = '7';
        return;
    }
    
    // Calculate average days between entries
    const memoryDates = memories.map(m => new Date(m.created_at).getTime()).sort();
    let totalGap = 0;
    
    for (let i = 1; i < memoryDates.length; i++) {
        totalGap += (memoryDates[i] - memoryDates[i-1]) / (1000 * 60 * 60 * 24);
    }
    
    const avgGap = totalGap / (memoryDates.length - 1) || 7;
    const nextSummaryIn = Math.max(1, Math.min(7, Math.round(avgGap)));
    
    countdownElement.textContent = nextSummaryIn;
}

// AI Functions (Groq integration)
async function generateWithGroq(memoryText, emotion, intensity) {
    try {
        console.log('🚀 Calling Groq API...');
        
        const response = await fetch(GROQ_CHAT_API, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192', // Fast and free model from Groq
                messages: [
                    {
                        role: 'system',
                        content: `You are DreamDiary AI - a warm, compassionate journal assistant. Create a brief, personalized reflection (2-3 sentences) that responds specifically to what the person wrote. Be genuine, caring, and insightful. Use 1-2 emojis naturally.`
                    },
                    {
                        role: 'user',
                        content: `The person wrote this in their journal: "${memoryText}"
Based on their writing, they seem to be feeling ${emotion} (${intensity}% intensity).

Please write a reflection that shows you truly understand their experience and offers gentle insight:`
                    }
                ],
                temperature: 0.8,
                max_tokens: 150,
                stream: false
            })
        });

        console.log('📊 Groq response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Groq API error:', errorData);
            throw new Error(`Groq API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('✅ Groq response received:', data);
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content.trim();
        } else {
            throw new Error('Invalid response format from Groq API');
        }
        
    } catch (error) {
        console.error('❌ Groq API call failed:', error);
        throw new Error('Groq AI service is currently unavailable. Using enhanced reflection system instead.');
    }
}

function analyzeTextForEmotion(text) {
    const lowerText = text.toLowerCase();
    
    const emotionScores = {
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        neutral: 3
    };

    const keywords = {
        joy: [
            {word: 'happy', weight: 2}, {word: 'joy', weight: 2}, {word: 'good', weight: 1}, 
            {word: 'great', weight: 1}, {word: 'amazing', weight: 2}, {word: 'wonderful', weight: 2},
            {word: 'love', weight: 2}, {word: 'excited', weight: 2}, {word: 'perfect', weight: 2},
            {word: 'beautiful', weight: 1}, {word: 'grateful', weight: 2}, {word: 'smile', weight: 1},
            {word: 'laugh', weight: 1}, {word: 'fantastic', weight: 2}, {word: 'bliss', weight: 2},
            {word: 'delighted', weight: 2}, {word: 'ecstatic', weight: 3}, {word: 'thrilled', weight: 2}
        ],
        sadness: [
            {word: 'sad', weight: 2}, {word: 'bad', weight: 1}, {word: 'hard', weight: 1},
            {word: 'difficult', weight: 1}, {word: 'tough', weight: 1}, {word: 'struggle', weight: 2},
            {word: 'hurt', weight: 2}, {word: 'miss', weight: 2}, {word: 'lost', weight: 2},
            {word: 'alone', weight: 2}, {word: 'cry', weight: 2}, {word: 'tears', weight: 2},
            {word: 'depressed', weight: 3}, {word: 'heartbroken', weight: 3}, {word: 'miserable', weight: 2},
            {word: 'lonely', weight: 2}, {word: 'grief', weight: 3}, {word: 'unhappy', weight: 2}
        ],
        anger: [
            {word: 'angry', weight: 2}, {word: 'mad', weight: 2}, {word: 'hate', weight: 2},
            {word: 'frustrated', weight: 2}, {word: 'upset', weight: 1}, {word: 'annoyed', weight: 1},
            {word: 'rage', weight: 3}, {word: 'furious', weight: 3}, {word: 'irritated', weight: 1},
            {word: 'outraged', weight: 3}, {word: 'livid', weight: 3}, {word: 'bitter', weight: 2},
            {word: 'resentful', weight: 2}
        ],
        fear: [
            {word: 'scared', weight: 2}, {word: 'afraid', weight: 2}, {word: 'worry', weight: 1},
            {word: 'anxious', weight: 2}, {word: 'nervous', weight: 1}, {word: 'stress', weight: 1},
            {word: 'overwhelmed', weight: 2}, {word: 'panic', weight: 3}, {word: 'terrified', weight: 3},
            {word: 'fearful', weight: 2}, {word: 'worried', weight: 1}, {word: 'dread', weight: 2},
            {word: 'apprehensive', weight: 2}
        ],
        surprise: [
            {word: 'surprise', weight: 2}, {word: 'shocked', weight: 2}, {word: 'unexpected', weight: 1},
            {word: 'wow', weight: 1}, {word: 'amazing', weight: 1}, {word: 'astonished', weight: 2},
            {word: 'stunned', weight: 2}, {word: 'astounded', weight: 2}, {word: 'speechless', weight: 2}
        ]
    };

    for (const [emotion, words] of Object.entries(keywords)) {
        words.forEach(({word, weight}) => {
            if (lowerText.includes(word)) {
                emotionScores[emotion] += weight;
            }
        });
    }

    let dominantEmotion = 'neutral';
    let highestScore = 0;

    for (const [emotion, score] of Object.entries(emotionScores)) {
        if (score > highestScore) {
            highestScore = score;
            dominantEmotion = emotion;
        }
    }

    const intensity = Math.min(40 + (highestScore * 12), 95);

    return {
        emotion: dominantEmotion,
        intensity: intensity
    };
}

function generateEnhancedReflection(memoryText, emotion, intensity) {
    const text = memoryText.toLowerCase();
    
    const contexts = {
        work: /(work|job|office|meeting|boss|colleague|project|deadline|career|salary|promotion|team)/.test(text),
        family: /(family|mom|dad|parent|child|son|daughter|wife|husband|partner|sibling|brother|sister)/.test(text),
        friends: /(friend|buddy|pal|hang out|together|group|social|party|dinner|coffee)/.test(text),
        nature: /(walk|park|outside|sun|nature|tree|sky|beach|mountain|hike|garden|fresh air)/.test(text),
        achievement: /(finished|completed|achieved|accomplished|succeeded|won|award|milestone|goal)/.test(text),
        health: /(sick|ill|pain|doctor|hospital|health|recovery|medicine|therapy|wellness)/.test(text),
        creative: /(write|paint|draw|create|music|art|poem|story|design|build|craft|project)/.test(text),
        learning: /(learn|study|read|book|course|knowledge|skill|education)/.test(text)
    };

    const context = Object.keys(contexts).find(key => contexts[key]) || 'general';

    const reflections = {
        joy: {
            work: `Your work satisfaction is wonderful! ${intensity > 80 ? "The sheer joy in your professional life is truly inspiring!" : "Finding happiness in work makes such a difference."} 🌟`,
            family: `The love in family moments creates precious memories. ${text.includes('laugh') ? "The laughter and connection you shared is beautiful!" : "These bonds are truly special."} 💕`,
            friends: `Friendship joy is pure magic! ${text.includes('together') ? "Time spent with loved ones creates the best memories." : "These connections nourish the soul."} 😊`,
            nature: `Nature's beauty combined with your joyful spirit is perfect. ${text.includes('sun') ? "The sunshine seems to mirror your inner light!" : "The peace you found is palpable."} 🌿`,
            achievement: `Celebrating achievements with genuine happiness is important! ${intensity > 85 ? "Your well-deserved success radiates through your words!" : "You've earned this joyful moment."} 🎉`,
            health: `Finding joy in health and recovery is powerful! ${text.includes('better') ? "Your improving wellbeing shines through beautifully!" : "Your positive outlook is inspiring."} 💪`,
            creative: `Creative joy is so fulfilling! ${text.includes('create') ? "The satisfaction of bringing something new into the world is magical!" : "Your artistic expression is wonderful."} 🎨`,
            learning: `Learning with joy is incredible! ${text.includes('discover') ? "The thrill of discovery is absolutely wonderful!" : "Your curiosity and growth are inspiring."} 📚`,
            general: `Your happiness is contagious! ${intensity > 75 ? "This radiant joy truly lights up the page!" : "These positive moments are precious gifts."} ✨`
        },
        sadness: {
            work: `Work challenges can be heavy. ${intensity > 70 ? "The weight of this professional struggle is palpable, but your resilience shines through." : "Your awareness of these difficulties shows emotional intelligence."} 💪`,
            family: `Family emotions run deep. ${text.includes('miss') ? "The ache of missing someone shows how much you care." : "Your willingness to feel these complex emotions is brave."} 🫂`,
            health: `Health struggles are incredibly difficult. ${text.includes('pain') ? "The physical or emotional pain you're experiencing is valid and real." : "Your strength in facing health challenges is admirable."} 🏥`,
            general: `There's courage in honoring sad moments. ${intensity > 80 ? "The depth of this sadness speaks to your capacity for deep feeling." : "Your emotional honesty creates space for healing."} 💙`
        },
        anger: {
            work: `Work frustrations are completely valid. ${intensity > 75 ? "The intensity of your reaction shows how much you care about fairness and respect." : "Your strong boundaries in professional settings are important."} 🔥`,
            general: `Your powerful emotions highlight important values. ${text.includes('unfair') ? "Your sense of justice is clear and deserves to be heard." : "This intensity often precedes meaningful change."} 💎`
        },
        fear: {
            work: `Work anxieties are real. ${intensity > 70 ? "The overwhelming nature of these worries is completely understandable." : "Your awareness of workplace stress is actually protective."} 🛡️`,
            health: `Health worries can be consuming. ${text.includes('scared') ? "The fear you're experiencing is valid and human." : "Your vigilance about wellbeing comes from self-care."} 💊`,
            general: `Facing fears takes remarkable courage. ${intensity > 75 ? "The magnitude of what you're facing is real, and so is your strength." : "Your emotional awareness is your greatest asset here."} 🌟`
        },
        surprise: {
            work: `Unexpected moments at work! ${intensity > 70 ? "This surprise really shook things up in your professional world!" : "Your adaptability in unexpected situations is impressive."} ⚡`,
            general: `Life's surprises keep us growing! ${intensity > 70 ? "The sheer unexpectedness of this moment is electrifying!" : "Your openness to surprises shows wonderful adaptability."} 🎊`
        },
        neutral: {
            general: `Your calm observation creates space for insight. ${text.includes('think') ? "Your thoughtful reflection shows wonderful self-awareness." : "There's wisdom in quiet moments of awareness."} 🕊️`
        }
    };

    const reflection = reflections[emotion]?.[context] || 
                      reflections[emotion]?.general || 
                      "Thank you for sharing this meaningful moment. Your self-awareness creates space for insight and growth. 📖";

    return reflection;
}
