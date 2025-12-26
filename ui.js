import { STATE } from './constants.js';

export class UIManager {
    constructor(game) {
        this.game = game;

        // --- Element References ---
        this.scoreDisplay = document.getElementById('score');
        this.levelDisplay = document.getElementById('level');
        this.lifeDisplay = document.getElementById('life-display');
        this.highScoreDisplay = document.getElementById('high-score');
        this.finalScoreDisplay = document.getElementById('final-score');
        this.deathReasonDisplay = document.getElementById('death-reason');
        this.rankDisplay = document.getElementById('rank-display');
        this.levelUpMsg = document.getElementById('level-up-msg');
        this.pauseBtn = document.getElementById('pause-btn');
        this.warningMsg = document.getElementById('warning-msg');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('gameover-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.achievementNotification = document.getElementById('achievement-notification');
        this.achievementText = document.getElementById('achievement-text');
        this.badgeContainer = document.getElementById('badge-container');
        this.comboDisplay = document.getElementById('combo-display');
        this.invincibleUsedMsg = document.getElementById('invincible-used-msg');
        this.titleKari = document.getElementById('title-kari');

        // Gallery UI
        this.galleryUI = document.getElementById('gallery-ui');
        this.galleryName = document.getElementById('gallery-name');
        this.galleryDesc = document.getElementById('gallery-desc');
        this.galleryStats = document.getElementById('gallery-stats');
        this.galleryList = document.getElementById('gallery-list');

        // Replay UI
        this.replayUI = document.getElementById('replay-ui');

        // --- Input properties for gallery ---
        this.isDraggingInGallery = false;
        this.galleryDragStartX = 0;
        this.galleryRotationAngle = 0;
        this.galleryBaseAngle = 0;
        this.galleryZoomLevel = 2.0;
        this.galleryPinchStartDist = 0;

        this.cheatBuffer = "";
        this.setupEventListeners();
        this.initCheatUI();
    }

    setupEventListeners() {
        // --- Game Buttons ---
        const startHandler = (diff) => (e) => {
            e.stopPropagation();
            if (this.game.state !== STATE.START) return;
            this.game.sound.init();
            this.game.startGame(diff);
        };
        document.getElementById('btn-easy').addEventListener('click', startHandler('EASY'));
        document.getElementById('btn-normal').addEventListener('click', startHandler('NORMAL'));
        document.getElementById('btn-hard').addEventListener('click', startHandler('HARD'));

        // --- Replay Button ---
        document.getElementById('replay-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.replaySystem.start();
        });
        document.getElementById('skip-replay-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.gameOver(this.game.deathReason);
        });

        // --- Gallery Buttons ---
        document.getElementById('btn-gallery').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showGallery();
        });
        document.getElementById('gallery-prev').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.gallery.prev();
            this.updateGalleryUI();
        });
        document.getElementById('gallery-next').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.gallery.next();
            this.updateGalleryUI();
        });
        document.getElementById('gallery-back').addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideGallery();
        });

        // --- Pause Screen Buttons ---
        document.getElementById('resume-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.togglePause();
        });
        document.getElementById('retry-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.togglePause();
            this.game.startGame(this.game.difficulty);
        });
        document.getElementById('title-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.togglePause();
            this.game.resetGame();
        });

        // --- Sound Sliders ---
        document.getElementById('bgm-slider').addEventListener('input', (e) => this.game.sound.bgmVolume = parseFloat(e.target.value));
        document.getElementById('se-slider').addEventListener('input', (e) => this.game.sound.seVolume = parseFloat(e.target.value));

        // --- Other ---
        this.titleKari.addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.sound.playItem();
            this.game.startGame('NORMAL', 1750);
        });

        // --- Gallery Input ---
        const canvas = this.game.canvas;
        const dragStart = (e) => {
            if (this.game.state !== STATE.GALLERY) return;
            this.isDraggingInGallery = true;
            this.galleryDragStartX = e.clientX || e.touches[0].clientX;
            this.galleryBaseAngle = this.galleryRotationAngle;
        };
        const dragEnd = () => {
            this.isDraggingInGallery = false;
            this.galleryPinchStartDist = 0;
        };

        canvas.addEventListener('wheel', (e) => {
            if (this.game.state !== STATE.GALLERY) return;
            e.preventDefault();
            this.galleryZoomLevel *= 1 - e.deltaY * 0.001;
            this.galleryZoomLevel = Math.max(0.5, Math.min(this.galleryZoomLevel, 10.0));
        }, { passive: false });

        canvas.addEventListener('mousedown', dragStart);
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDraggingInGallery) return;
            const currentX = e.clientX;
            const dx = currentX - this.dragStartX;
            this.galleryRotationAngle = this.baseAngle + dx * 0.01;
        });
        canvas.addEventListener('mouseup', dragEnd);
        canvas.addEventListener('mouseleave', dragEnd);

        canvas.addEventListener('touchstart', (e) => {
            if (this.game.state === STATE.GALLERY) {
                e.preventDefault();
                if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    this.galleryPinchStartDist = Math.sqrt(dx * dx + dy * dy);
                    this.isDraggingInGallery = false;
                } else if (e.touches.length === 1) {
                    dragStart(e);
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (this.game.state === STATE.GALLERY) {
                e.preventDefault();
                if (e.touches.length === 2 && this.galleryPinchStartDist > 0) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.galleryZoomLevel *= dist / this.galleryPinchStartDist;
                    this.galleryZoomLevel = Math.max(0.5, Math.min(this.galleryZoomLevel, 10.0));
                    this.galleryPinchStartDist = dist;
                } else if (e.touches.length === 1 && this.isDraggingInGallery) {
                    const currentX = e.touches[0].clientX;
                    const dx = currentX - this.dragStartX;
                    this.galleryRotationAngle = this.baseAngle + dx * 0.01;
                }
            }
        }, { passive: false });
        canvas.addEventListener('touchend', dragEnd);
    }

    initCheatUI() {
        if (!this.scoreDisplay) return;
        const parent = this.scoreDisplay.parentNode;
        if (!parent) return;

        // 既存のDISTANCEテキストがあれば削除（重複防止）
        // index.htmlで <span id="trigger-sludge">D</span>ISTANCE: のように分かれている場合に対応
        const triggerSludge = parent.querySelector('#trigger-sludge');
        if (triggerSludge) triggerSludge.remove();

        for (let i = 0; i < parent.childNodes.length; i++) {
            const node = parent.childNodes[i];
            // スコア表示要素自体や、作成済みのラベルは除外
            if (node === this.scoreDisplay || (node.classList && node.classList.contains('distance-label'))) continue;

            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.includes('DISTANCE')) {
                    node.textContent = node.textContent.replace(/DISTANCE\s*:?/, '');
                } else if (node.textContent.includes('ISTANCE')) {
                    node.textContent = node.textContent.replace(/ISTANCE\s*:?/, '');
                }
            }
            // 要素ノード（<span>DISTANCE</span>など）の場合も考慮して削除
            else if (node.nodeType === Node.ELEMENT_NODE && node.textContent.includes('DISTANCE')) {
                node.innerHTML = node.innerHTML.replace(/DISTANCE\s*:?/, '');
            }
        }

        // 既に作成済みなら何もしない
        if (parent.querySelector('.distance-label')) return;

        // DISTANCEラベルを作成してスコアの前に挿入
        const container = document.createElement('span');
        container.className = 'distance-label';
        container.style.marginRight = '10px';
        container.style.fontWeight = 'bold';
        container.style.color = 'white';
        container.style.pointerEvents = 'auto';
        container.style.position = 'relative';
        container.style.zIndex = '1000';

        const text = "DISTANCE";
        for (let char of text) {
            const span = document.createElement('span');
            span.innerText = char;
            span.style.cursor = 'pointer';
            span.style.display = 'inline-block';
            span.style.transition = 'transform 0.1s';
            // 文字ごとのクリックイベント
            span.onclick = (e) => {
                e.stopPropagation();
                span.style.transform = 'scale(1.5)';
                span.style.color = '#FFFF00';
                setTimeout(() => { span.style.transform = 'scale(1.0)'; span.style.color = 'white'; }, 200);
                this.handleCheatInput(char);
            };
            container.appendChild(span);
        }

        container.appendChild(document.createTextNode(': '));
        parent.insertBefore(container, this.scoreDisplay);
    }

    handleCheatInput(char) {
        // D -> ヘドロゾーン (3000m)
        if (char === 'D') {
            this.game.sound.playItem();
            this.game.startGame('NORMAL', 3000);
        }
        // S -> 宇宙ゾーン (5000m)
        else if (char === 'S') {
            this.game.sound.playItem();
            this.game.startGame('NORMAL', 5000);
        }
        
        // ICE -> 流氷ゾーン (4000m)
        this.cheatBuffer += char;
        if (this.cheatBuffer.endsWith('ICE')) {
            this.game.sound.playItem();
            this.game.startGame('NORMAL', 4000);
            this.cheatBuffer = "";
        }
        
        if (this.cheatBuffer.length > 10) this.cheatBuffer = this.cheatBuffer.slice(-5);
    }

    // --- UI Update Methods ---
    updateScore(score) { this.scoreDisplay.innerText = Math.floor(score); }
    updateLevel(level) { this.levelDisplay.innerText = level; }
    updateLife(lives) {
        let hearts = '';
        for (let i = 0; i < lives; i++) hearts += '❤';
        this.lifeDisplay.innerText = hearts;
    }
    updateHighScore(score) { this.highScoreDisplay.innerText = score; }
    updateCombo(count) {
        this.comboDisplay.innerText = count > 1 ? `${count} COMBO!` : '';
        this.comboDisplay.classList.toggle('show', count > 1);
    }

    showLevelUp() {
        this.levelUpMsg.classList.remove('animate');
        void this.levelUpMsg.offsetWidth;
        this.levelUpMsg.classList.add('animate');
    }

    showNotification(icon, text) {
        this.achievementText.innerText = `${icon} ${text}`;
        this.achievementNotification.classList.add('show');
        setTimeout(() => this.achievementNotification.classList.remove('show'), 3000);
    }

    // --- Screen Management ---
    showStartScreen() {
        this.startScreen.style.display = 'block';
        this.gameOverScreen.style.display = 'none';
        this.pauseScreen.style.display = 'none';
        this.galleryUI.style.display = 'none';
    }

    hideStartScreen() {
        this.startScreen.style.display = 'none';
    }

    showGameOverScreen(score, rank, reason, achievements, unlockedAchievements, sessionAchievements, invincibleUsed) {
        this.gameOverScreen.style.display = 'block';
        this.finalScoreDisplay.innerText = Math.floor(score);
        this.rankDisplay.innerText = `称号: ${rank}`;
        this.deathReasonDisplay.innerText = reason;
        this.invincibleUsedMsg.style.display = invincibleUsed ? 'block' : 'none';

        this.badgeContainer.innerHTML = '';
        achievements.forEach(ach => {
            const badge = document.createElement('div');
            const isUnlocked = unlockedAchievements.includes(ach.id);
            const isNew = sessionAchievements.includes(ach.id);
            badge.className = `badge ${isUnlocked ? '' : 'locked'} ${isNew ? 'new' : ''}`;
            badge.innerText = ach.icon;
            badge.title = ach.title;
            badge.setAttribute('data-title', `${ach.title}\n${ach.description}`);
            this.badgeContainer.appendChild(badge);

            // スマホ向けタップでツールチップ表示
            badge.addEventListener('click', (e) => {
                e.stopPropagation(); // リトライイベントを発火させない
                
                // 既にアクティブなら閉じる、そうでなければ開く
                const wasActive = badge.classList.contains('active');
                // 他のバッジを閉じる
                this.badgeContainer.querySelectorAll('.badge').forEach(b => b.classList.remove('active'));
                
                if (!wasActive) badge.classList.add('active');
            });
        });

        document.getElementById('replay-btn').style.display = this.game.replaySystem.buffer.length > 0 ? 'block' : 'none';
    }

    togglePauseScreen(show) {
        this.pauseScreen.style.display = show ? 'block' : 'none';
        this.pauseBtn.style.display = show ? 'none' : 'flex';
    }

    // --- Gallery Methods ---
    showGallery() {
        this.game.state = STATE.GALLERY;
        this.startScreen.style.display = 'none';
        this.galleryUI.style.display = 'block';
        this.galleryRotationAngle = 0;
        this.galleryZoomLevel = 2.0;
        this.game.gallery.renderList();
        this.updateGalleryUI();
    }

    hideGallery() {
        this.game.state = STATE.START;
        this.startScreen.style.display = 'block';
        this.galleryUI.style.display = 'none';
    }

    updateGalleryUI() {
        const item = this.game.gallery.getCurrentItem();
        this.galleryName.innerText = item.name;
        this.galleryDesc.innerText = item.desc;
        this.galleryStats.innerText = `出現深度: ${item.depth} / 危険度: ${item.danger}`;

        const icons = this.galleryList.querySelectorAll('.gallery-icon');
        icons.forEach((icon, idx) => {
            if (idx === this.game.gallery.currentIndex) {
                icon.classList.add('selected');
                icon.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                icon.classList.remove('selected');
            }
        });
    }

    drawGallery(ctx) {
        ctx.fillStyle = '#203040';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        ctx.beginPath();
        for (let x = 0; x < this.game.width; x += gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, this.game.height);
        }
        for (let y = 0; y < this.game.height; y += gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(this.game.width, y);
        }
        ctx.stroke();

        const item = this.game.gallery.getCurrentItem();
        const cls = item.cls;
        const dummy = this.game.replaySystem.dummies[cls.name];

        if (dummy) {
            ctx.save();
            ctx.translate(this.game.width / 2, this.game.height / 2 - 50);
            ctx.scale(this.galleryZoomLevel, this.galleryZoomLevel);
            ctx.rotate(this.galleryRotationAngle);

            dummy.x = 0;
            dummy.y = 0;

            // アニメーション用パラメータの更新
            if (dummy.timer !== undefined) dummy.timer += 0.1;
            if (dummy.moveTimer !== undefined) dummy.moveTimer += 0.1;
            if (dummy.walkTimer !== undefined) dummy.walkTimer += 0.2;
            if (dummy.electricTimer !== undefined) dummy.electricTimer++;
            if (dummy.angle !== undefined) dummy.angle += 0.05;

            const name = cls.name;

            // 個別のアニメーションロジック
            if (name === 'Jellyfish') {
                if (dummy.electricTimer > 30) {
                    dummy.isElectric = !dummy.isElectric;
                    dummy.electricTimer = 0;
                }
            } else if (name === 'Porcupinefish') {
                const t = this.game.frameCount % 120;
                dummy.scale = (t > 60 && t < 100) ? 1.0 + Math.sin((t - 60) * 0.1) * 0.2 : 1.0;
            } else if (name === 'Whale') {
                dummy.isSucking = (this.game.frameCount % 240 > 180);
                if (dummy.isSucking) dummy.suckTimer++; else dummy.suckTimer = 0;
            }

            // 泳ぐ動作（上下移動など）
            if (['Fish', 'Sardine', 'Tuna', 'Shark', 'Seal', 'Walrus', 'Whale', 'Architeuthis', 'Penguin', 'MorayEel'].includes(name)) {
                dummy.y = Math.sin(this.game.frameCount * 0.05) * 5;
            }
            if (name === 'Penguin') {
                dummy.vy = Math.sin(this.game.frameCount * 0.1) * 2;
            }
            if (['Squid', 'Jellyfish', 'Octopus', 'Plankton', 'FriendShrimp', 'Clownfish'].includes(name)) {
                dummy.y = Math.sin(this.game.frameCount * 0.05) * 3;
            }
            
            dummy.draw(ctx, this.game.frameCount);
            ctx.restore();
        }
    }
}
