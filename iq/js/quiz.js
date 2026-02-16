// State Management
let questions = [];
let currentIdx = 0;
let score = 0;
let timer = null;
let timeLeft = 30;
let startTime = null;
let totalTime = 0;
let darkMode = false;

// Initialize Quiz
function initQuiz(jsonPath, partNumber) {
    showSkeleton(true);

    fetch(jsonPath)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            questions = data;
            currentIdx = 0;
            score = 0;
            totalTime = 0;

            // Update UI
            document.getElementById('part-selector').style.display = 'none';
            document.getElementById('quiz-header-info').style.display = 'block';
            document.getElementById('question-card').style.display = 'block';
            document.getElementById('current-part-label').innerText = `Part ${partNumber}`;
            document.querySelector('.question-total').innerText = `/${questions.length}`;

            showSkeleton(false);
            loadQuestion();
            showToast('Quiz started! Good luck! 🎯', 'info');
        })
        .catch(err => {
            showSkeleton(false);
            showToast('Failed to load questions. Please try again.', 'error');
            console.error('Error:', err);
        });
}

// Skeleton Loader
function showSkeleton(show) {
    const skeleton = document.getElementById('skeleton-loader');
    const questionCard = document.getElementById('question-card');

    if (show) {
        skeleton.style.display = 'block';
        questionCard.style.display = 'none';
    } else {
        skeleton.style.display = 'none';
        questionCard.style.display = 'block';
    }
}

// Load Question
function loadQuestion() {
    const q = questions[currentIdx];

    // Reset UI
    document.getElementById('solution-panel').classList.add('hidden');
    document.getElementById('next-btn').style.display = 'none';
    document.getElementById('show-ans-btn').disabled = true;

    // Update progress
    document.getElementById('current-q-num').innerText = currentIdx + 1;
    updateProgressBar();

    // Set question text
    document.getElementById('question-text').innerText = q.question;

    // Reset and start timer
    resetTimer();
    startTimer();

    // Render options
    renderOptions(q);
}

// Render Options with Animation
function renderOptions(q) {
    const grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.innerText = opt;
        btn.className = 'opt-btn';
        btn.setAttribute('data-index', index);
        btn.setAttribute('aria-label', `Option ${index + 1}: ${opt}`);

        btn.onclick = () => checkAnswer(btn, index, q.correctIndex);

        // Add animation delay
        btn.style.animation = `slideUp 0.3s ease ${index * 0.1}s both`;
        grid.appendChild(btn);
    });
}

// Check Answer
function checkAnswer(selectedBtn, selectedIdx, correctIdx) {
    // Stop timer
    if (timer) clearInterval(timer);

    // Disable all options
    const allBtns = document.querySelectorAll('.opt-btn');
    allBtns.forEach(b => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
    });

    // Show correct/wrong
    if (selectedIdx === correctIdx) {
        selectedBtn.classList.add('correct');
        score++;
        showToast('✅ Correct! Well done!', 'success');
    } else {
        selectedBtn.classList.add('wrong');
        allBtns[correctIdx].classList.add('correct');
        showToast('❌ Not quite. Check the solution!', 'error');
    }

    // Update score
    updateScore();

    // Enable solution button
    document.getElementById('show-ans-btn').disabled = false;
    document.getElementById('next-btn').style.display = 'inline-block';
}

// Update Score Display
function updateScore() {
    document.getElementById('score-value').innerText = score;
    document.querySelector('.score-total').innerText = `/${questions.length}`;
}

// Update Progress Bar
function updateProgressBar() {
    const progress = ((currentIdx) / questions.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;
}

// Timer Functions
function resetTimer() {
    if (timer) clearInterval(timer);
    timeLeft = 30;
    document.getElementById('timer-display').innerText = formatTime(timeLeft);
    document.getElementById('timer-display').classList.remove('warning');
}

function startTimer() {
    startTime = Date.now();
    timer = setInterval(() => {
        timeLeft--;
        document.getElementById('timer-display').innerText = formatTime(timeLeft);

        // Warning when 10 seconds left
        if (timeLeft <= 10) {
            document.getElementById('timer-display').classList.add('warning');
        }

        // Time's up
        if (timeLeft <= 0) {
            clearInterval(timer);
            handleTimeout();
        }
    }, 1000);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function handleTimeout() {
    const q = questions[currentIdx];
    const allBtns = document.querySelectorAll('.opt-btn');

    allBtns.forEach(b => {
        b.disabled = true;
        if (b.getAttribute('data-index') == q.correctIndex) {
            b.classList.add('correct');
        }
    });

    document.getElementById('show-ans-btn').disabled = false;
    document.getElementById('next-btn').style.display = 'inline-block';

    showToast('⏰ Time\'s up! Check the solution.', 'info');
}
// --- REWRITTEN MEDIA HANDLER START ---

function displayMedia(mediaUrl, mediaType, container) {
    // १. यदि डेटा छैन भने कन्टेनर लुकाउने
    if (!mediaUrl || mediaUrl.trim() === "" || mediaUrl === "none" || mediaUrl.trim() === " ") {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    container.innerHTML = '';

    // २. VIDEO (YouTube Iframe, YouTube Link, or MP4)
    if (mediaType === 'video') {
        // क) यदि JSON मै पूरा <iframe> ट्याग छ भने
        if (mediaUrl.includes('<iframe')) {
            container.innerHTML = `<div class="video-resp-container">${mediaUrl}</div>`;
        }
        // ख) यदि युट्युब लिङ्क मात्र छ भने
        else if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
            const videoId = extractYouTubeId(mediaUrl);
            container.innerHTML = `
                <div class="video-resp-container">
                    <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                </div>`;
        }
        // ग) यदि डाइरेक्ट भिडियो पाथ छ भने
        else {
            const videoPath = mediaUrl.trim().replace(/^\.?\/+/, '');
            container.innerHTML = `
                <video controls class="resp-video">
                    <source src="${videoPath}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`;
        }
    }

    // ३. AUDIO
    else if (mediaType === 'audio') {
        container.innerHTML = `
            <div class="audio-player">
                <p style="margin-bottom:8px; font-size:14px;">🔊 Audio Solution:</p>
                <audio controls style="width: 100%;">
                    <source src="${mediaUrl.trim()}" type="audio/mpeg">
                </audio>
            </div>`;
    }

    // ४. IMAGE
    else if (mediaType === 'image') {
        const cleanPath = mediaUrl.trim().replace(/^\.?\/+/, '');
        container.innerHTML = '<div class="media-loading">🖼️ Loading...</div>';

        const img = document.createElement('img');
        img.className = 'resp-img';
        img.onload = () => { container.innerHTML = ''; container.appendChild(img); };
        img.onerror = () => {
            img.onerror = null;
            container.innerHTML = '';
        };
        img.src = cleanPath;
    }
}

// YouTube ID निकाल्ने एउटा मात्र सफा फङ्सन
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// --- REWRITTEN MEDIA HANDLER END ---

// Solution Display - OPTIMIZED VERSION
document.getElementById('show-ans-btn').onclick = () => {
    const q = questions[currentIdx];
    const solPanel = document.getElementById('solution-panel');
    const mediaDiv = document.getElementById('sol-media');
    const solText = document.getElementById('sol-text-en');

    // Show solution panel
    solPanel.classList.remove('hidden');

    // Display solution text (prefer alt_lang if available)
    if (q.solution.alt_lang) {
        solText.innerText = q.solution.alt_lang + ' | ' + q.solution.text;
    } else {
        solText.innerText = q.solution.text;
    }

    // Handle media display with optimized function
    displayMedia(q.solution.mediaUrl, q.solution.mediaType, mediaDiv);
};

// Hide Solution
document.getElementById('hide-ans-btn').onclick = () => {
    document.getElementById('solution-panel').classList.add('hidden');
};

// Next Question
document.getElementById('next-btn').onclick = () => {
    // Add time spent
    if (startTime) {
        totalTime += (30 - timeLeft);
    }

    currentIdx++;
    if (currentIdx < questions.length) {
        loadQuestion();
    } else {
        showResults();
    }
};

// Show Results
function showResults() {
    if (timer) clearInterval(timer);

    const percentage = (score / questions.length) * 100;
    const accuracy = percentage.toFixed(1);

    // Update circular progress
    const progressCircle = document.getElementById('circularProgress');
    const degrees = (percentage * 360) / 100;
    progressCircle.style.background = `conic-gradient(var(--primary) ${degrees}deg, var(--border-color) ${degrees}deg)`;

    // Update stats
    document.getElementById('correct-count').innerText = score;
    document.getElementById('total-count').innerText = questions.length;
    document.getElementById('time-spent').innerText = formatTime(totalTime);
    document.getElementById('accuracy').innerText = `${accuracy}%`;
    document.querySelector('.progress-value').innerText = `${accuracy}%`;

    // Show modal
    document.getElementById('resultModal').style.display = 'block';

    // Show result message
    if (percentage >= 80) {
        showToast('🏆 Excellent work! You\'re a genius!', 'success');
    } else if (percentage >= 50) {
        showToast('👍 Good job! Keep practicing!', 'info');
    } else {
        showToast('💪 Keep learning! You\'ll get better!', 'info');
    }
}

function closeResultModal() {
    document.getElementById('resultModal').style.display = 'none';
}

// Practice Modal
document.getElementById('open-practice-btn').onclick = () => {
    const q = questions[currentIdx];
    const practiceFrame = document.getElementById('practice-frame');

    const params = new URLSearchParams({
        q: q.question,
        opts: q.options.join(', '),
        ans: q.solution.text,
        media: q.solution.mediaUrl || ''
    });

    practiceFrame.src = `userPractice/userNotes.php?${params.toString()}`;
    document.getElementById('practiceModal').style.display = 'block';
};

document.getElementById('close-practice').onclick = () => {
    document.getElementById('practiceModal').style.display = 'none';
};

// Toast Notification System
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || '📢'}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Dark Mode Toggle
document.getElementById('theme-switch').onclick = () => {
    darkMode = !darkMode;
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    showToast(`${darkMode ? '🌙' : '☀️'} Dark mode ${darkMode ? 'enabled' : 'disabled'}`, 'info');
};

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
darkMode = savedTheme === 'dark';

// Close modals on outside click
window.onclick = (event) => {
    const practiceModal = document.getElementById('practiceModal');
    const resultModal = document.getElementById('resultModal');

    if (event.target === practiceModal) {
        practiceModal.style.display = 'none';
    }
    if (event.target === resultModal) {
        resultModal.style.display = 'none';
    }
};

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('practiceModal').style.display = 'none';
        document.getElementById('resultModal').style.display = 'none';
    }

    if (e.key === 'Enter' && document.getElementById('next-btn').style.display === 'inline-block') {
        document.getElementById('next-btn').click();
    }
});