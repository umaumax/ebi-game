class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.scaleFactor = 1.0; // 画面サイズによるスケール係数
        this.state = STATE.START;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem(
            'ebi_highscore')) || 0;
        this.frameCount = 0;
        this.lives = 1;
        this.level = 0;
        this.scrollSpeed = CONSTANTS.SCROLL_SPEED;
        this.difficulty = 'NORMAL';
        this.scrollOffset = 0;
        this.isRapidCurrent = false;
        this.rapidCurrentY = 0; // 激流の中心Y座標
        this.inRapidCurrentZone = false; // プレイヤーが激流に巻き込まれているか
        this.rapidCurrentTimer = 0;
        this.isKelpZone = false; // 昆布ゾーン
        this.kelpZoneTimer = 0;
        this.isSludgeZone = false;
        this.isIceZone = false;
        this.isSpaceZone = false;
        this.streamLines = []; // 激流のエフェクト
        this.lastBossDistance = 0;
        this.caughtNet = null; // 捕まっている網
        this.escapeClicks = 0; // 脱出連打数
        this.requiredClicks = 5; // 脱出に必要な連打数
        this.damageTaken = false; // ダメージを受けたか（実績用）
        this.currentRank = ""; // 現在のランク
        this.sound = new SoundManager();

        this.player = new Shrimp(this.width / 3, this.height / 2);
        this.enemies = [];
        this.items = []; // パールなど
        this.backgroundObjects = []; // 背景（魚のシルエット、沈没船）
        this.decorations = []; // わかめ、岩、サンゴ
        this.particles = [];
        this.floatingTexts = []; // フローティングテキスト
        this.screenshotTaken = false;

        // サブシステムの初期化
        this.spawner = new Spawner(this);
        this.replaySystem = new ReplaySystem(this);
        this.gallery = new Gallery(this);
        this.uiManager = new UIManager(this);

        // UI要素の参照をUIManagerから取得（互換性のため）
        this.uiScore = this.uiManager.scoreDisplay;
        this.uiLife = this.uiManager.lifeDisplay;
        this.uiHighScore = this.uiManager.highScoreDisplay;
        this.uiFinalScore = this.uiManager.finalScoreDisplay;
        this.uiDeathReason = this.uiManager.deathReasonDisplay;
        this.uiRank = this.uiManager.rankDisplay;
        this.uiWarning = this.uiManager.warningMsg;
        this.screenStart = this.uiManager.startScreen;
        this.screenGameOver = this.uiManager.gameOverScreen;
        this.screenPause = this.uiManager.pauseScreen;
        this.uiPauseBtn = this.uiManager.pauseBtn;
        this.uiAchievement = this.uiManager.achievementNotification;
        this.uiAchievementText = this.uiManager.achievementText;
        this.uiBadgeContainer = this.uiManager.badgeContainer;
        this.uiComboDisplay = this.uiManager.comboDisplay;
        this.uiInvincibleUsedMsg = this.uiManager.invincibleUsedMsg;
        this.uiReplay = this.uiManager.replayUI;
        this.btnNormal = document.getElementById('btn-normal');
        this.btnReplay = document.getElementById('replay-btn');
        this.uiInvincibleToggle = document.getElementById('invincible-toggle');

        // 実績データの初期化
        this.achievements = [
            {
                id: 'reach_500',
                title: '冒険の始まり',
                description: '500m到達',
                icon: '🚩',
                condition: (g) => g.score >= 500
            },
            {
                id: 'reach_1000',
                title: '深海への到達',
                description: '1000m到達',
                icon: '🌊',
                condition: (g) => g.score >= 1000
            },
            {
                id: 'reach_2000',
                title: '深淵の目撃者',
                description: '2000m到達',
                icon: '👁️',
                condition: (g) => g.score >= 2000
            },
            {
                id: 'no_damage_1000',
                title: '華麗なる回避',
                description: 'ノーダメージで1000m到達',
                icon: '✨',
                condition: (g) => g.score >= 1000 && !g.damageTaken
            },
            {
                id: 'survive_boss',
                title: '巨大生物との遭遇',
                description: 'ボスを回避して生き延びる',
                icon: '🐋',
                condition: (g) => g.enemies.some(e => (e instanceof Whale ||
                    e instanceof Architeuthis) && e.x <
                    g.player.x)
            },
            {
                id: 'collector',
                title: 'トレジャーハンター',
                description: '宝箱を1個獲得',
                icon: '💎',
                condition: (g) => g.treasureChestsCollected >= 1
            }];
        this.sessionAchievements = [];
        this.unlockedAchievements = JSON.parse(localStorage.getItem(
            'ebi_achievements')) || [];
        this.itemsCollected = 0;
        this.treasureChestsCollected = 0;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.setupInput();

        this.updateLifeDisplay();
        this.uiHighScore.innerText = this.highScore;
        this.loop = this.loop.bind(this);

        // ページの準備が完了したらフェードインさせる
        requestAnimationFrame(() => {
            document.body.style.opacity = 1;
            this.loop();
        });
    }

    initReplayDummies() {
        // クラス名からインスタンスを引けるようにマップを作成
        const classes = [
            Fish, Sardine, Tuna, Shark, Anglerfish, Hook, Net,
            Squid, Flatfish,
            SeaUrchin, Octopus, Porcupinefish, Needle,
            Whirlpool, Whale, Architeuthis, GiantTentacle,
            WaterSpout, WaterDrop, Jellyfish, Crab,
            SeaAnemone, Starfish, ElectricEel,
            Pearl, Plankton, FriendShrimp, Clownfish,
            GardenEel, TreasureChest,
            Shipwreck,
            Seaweed, RuggedTerrain, Coral, StreamLine, Bubble
        ];
        classes.forEach(cls => {
            try {
                // 引数なし、あるいは適当な引数でインスタンス化
                // 一部のクラスは引数が必要だが、描画に使うプロパティは後で上書きするのでエラーにならなければOK
                if (cls === Shark) this.replayDummies[cls
                    .name] = new cls(0, 0, null);
                else if (cls === Porcupinefish) this.replayDummies[
                    cls.name] = new cls(0, 0, this);
                else if (cls === Architeuthis) this.replayDummies[
                    cls.name] = new cls(0, 0, this);
                else if (cls === GiantTentacle) this.replayDummies[
                    cls.name] = new cls(0, 0, this);
                else this.replayDummies[cls.name] = new cls(
                    0, 0);
            }
            catch (e) {
                console.error("Dummy init failed for",
                    cls.name, e);
            }
        });
        this.replayDummies['Shrimp'] = new Shrimp(0, 0);
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // 画面サイズに応じたスケール計算
        // PC基準幅を1000px程度と想定し、スマホ縦(375px)なら0.6倍程度にする
        const isPortrait = this.height > this.width;
        const baseWidth = isPortrait ? 600 : 1000;
        this.scaleFactor = Math.min(1.0, Math.max(0.6, this.width /
            baseWidth));

        // スクロール速度の再調整（画面幅に合わせて）
        let baseSpeed = 3.5;
        if (this.difficulty === 'EASY') baseSpeed = 3.0;
        else if (this.difficulty === 'HARD') baseSpeed = 5.0;

        const widthRatio = Math.min(1.0, Math.max(0.6, this.width /
            1000));
        this.scrollSpeed = baseSpeed * widthRatio;
        if (isPortrait) this.scrollSpeed *= 0.8; // 縦画面は避けにくいのでさらに遅く

        this.updatePlayerSize();
    }

    setupInput() {
        const action = (e) => {
            // ゲームオーバー画面でバッジをタップした場合はリトライしない
            if (this.state === STATE.GAMEOVER && e.target.classList
                .contains('badge')) {
                e.stopPropagation();
                return;
            }

            this.sound.init(); // ユーザー操作でオーディオコンテキストを開始

            // ボタン操作時は何もしない（ボタンのハンドラに任せる）
            if (e.target.tagName === 'BUTTON' || e.target.closest(
                'button')) return;
            // スライダー操作時も何もしない
            if (e.target.tagName === 'INPUT' && e.target.type ===
                'range') return;
            // ラベル操作時も
            if (e.target.tagName === 'LABEL') return;

            // ポーズボタン
            if (e.target === this.uiPauseBtn) {
                this.togglePause();
                return;
            }

            // 網からの脱出連打
            if (this.state === STATE.CAUGHT) {
                this.escapeClicks++;
                this.sound.playTone(400 + this.escapeClicks *
                    50, 'square', 0.05, 0.1);
                if (this.escapeClicks >= this.requiredClicks) {
                    this.escapeFromNet();
                }
            }

            if (e.type === 'keydown' && !(e.code === 'Space'))
                return;
            if (e.type === 'touchstart') e.preventDefault(); // スクロール防止

            if (this.state === STATE.START) {
                // スペースキーでもNORMALで開始できるようにする
                if (e.type === 'keydown' && e.code ===
                    'Space') {
                    this.btnNormal.style.transform =
                        'scale(1.1)';
                    this.btnNormal.style.boxShadow =
                        '0 0 15px #2196F3';
                    this.btnNormal.style.transition =
                        'all 0.1s';
                    // エフェクトを見せるために少し遅延させる
                    setTimeout(() => {
                        this.btnNormal.style.transform =
                            '';
                        this.btnNormal.style.boxShadow =
                            '';
                        this.startGame('NORMAL');
                    }, 200);
                }
            }
            else if (this.state === STATE.PLAYING) {
                this.player.jump();
                this.sound.playJump();
            }
            else if (this.state === STATE.PAUSED) {
                this.togglePause();
            }
            else if (this.state === STATE.GAMEOVER) {
                // 少し待ってからリスタート可能に（誤操作防止）
                if (this.frameCount > 30) this.resetGame();
            }
            else if (this.state === STATE.REPLAY) {
                // リプレイ中はタップで終了
                this.gameOver(this.deathReason);
            }

            // スタート画面での隠し機能（エビタップで深海スタート）
            if (this.state === STATE.START) {
                let clientX, clientY;
                if (e.changedTouches && e.changedTouches.length >
                    0) {
                    clientX = e.changedTouches[0].clientX;
                    clientY = e.changedTouches[0].clientY;
                }
                else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }
                // プレイヤー（エビ）との距離判定
                const dx = clientX - this.player.x;
                const dy = clientY - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) < this.player
                    .radius * 3) {
                    this.sound.playItem(); // 音を鳴らす
                    this.startGame('NORMAL', 2000); // 深海(2000m)からスタート
                }
            }
        };

        window.addEventListener('keydown', action);
        window.addEventListener('touchstart', action,
            {
                passive: false
            });
        window.addEventListener('mousedown', action);
    }

    togglePause() {
        if (this.state === STATE.PLAYING) {
            this.state = STATE.PAUSED;
            this.screenPause.style.display = 'block';
            this.uiPauseBtn.style.display = 'none';
            this.uiInvincibleToggle.style.opacity = this.isInvincibleMode ?
                '1.0' : '0.5';
            this.sound.stopBGM();
        }
        else if (this.state === STATE.PAUSED) {
            this.state = STATE.PLAYING;
            this.screenPause.style.display = 'none';
            this.uiPauseBtn.style.display = 'flex';
            this.sound.startBGM();
        }
    }

    startGame(difficulty = 'NORMAL', startScore = 0) {
        this.difficulty = difficulty;
        this.state = STATE.PLAYING;
        this.screenStart.style.display = 'none';
        this.screenGameOver.style.display = 'none';
        this.score = 0;
        this.lives = 1;
        this.updateLifeDisplay();
        this.level = Math.floor(startScore / 100);

        // 初期化時にリサイズ処理を呼んでパラメータを確定させる
        this.resize();

        // スタート地点に合わせて前回のボス位置を調整（すぐにボスが出るように）
        this.lastBossDistance = Math.floor(startScore / CONSTANTS
            .BOSS_INTERVAL) * CONSTANTS.BOSS_INTERVAL;
        this.uiWarning.classList.remove('active');
        this.frameCount = 0;
        this.scrollOffset = 0;
        this.isRapidCurrent = false;
        this.rapidCurrentTimer = 0;
        this.isKelpZone = false;
        this.kelpZoneTimer = 0;
        this.streamLines = [];
        this.backgroundObjects = [];
        this.screenshotTaken = false;
        this.caughtNet = null;
        this.escapeClicks = 0;

        this.damageTaken = false;
        this.currentRank = this.getRank(0);
        this.sessionAchievements = [];
        this.pushedByRock = false;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.isInvincibleMode = false;
        this.invincibleModeUsed = false;
        this.itemsCollected = 0;
        this.treasureChestsCollected = 0;
        this.replaySystem.buffer = [];
        this.sound.startBGM();
        this.enemies = [];
        this.items = [];
        this.decorations = [];
        this.particles = [];
        this.floatingTexts = [];
        // スマホ向け調整: 画面が狭い場合はプレイヤーを左側に寄せて反応時間を稼ぐ
        const startX = this.width < 600 ? this.width * 0.15 :
            this.width / 3;
        this.player.reset(startX, this.height / 2);
        this.updatePlayerSize();

        // 深海スタートの場合
        if (startScore > 0) {
            this.score = startScore;
            this.addFloatingText(this.player.x, this.player.y -
                50, "DEEP SEA MODE!", "#FF00FF");
        }
    }

    resetGame() {
        this.state = STATE.START;
        this.screenStart.style.display = 'block';
        this.screenGameOver.style.display = 'none';
        this.sound.stopBGM();
    }

    updateLifeDisplay() {
        let hearts = '';
        for (let i = 0; i < this.lives; i++) hearts += '❤';
        this.uiLife.innerText = hearts;
    }

    updatePlayerSize() {
        // ライフが増えるとサイズ（当たり判定）が大きくなる仕様
        // ライフ3を基準(20px)とし、増減でサイズ変化
        if (this.player) {
            const base = CONSTANTS.SHRIMP_BASE_SIZE * this.scaleFactor;
            const size = base + (this.lives - 3) * 5 * this.scaleFactor;
            this.player.radius = Math.max(10, size); // 最小10pxは確保
        }
    }

    hitPlayer(reason = "不明") {
        if (this.player.isInvincible || this.isInvincibleMode)
            return;

        this.sound.playHit();
        this.lives--;
        this.updateLifeDisplay();
        this.updatePlayerSize();
        this.damageTaken = true;
        this.deathReason = reason;

        if (this.lives <= 0) {
            this.gameOver(reason);
        }
        else {
            // ダメージ演出と無敵時間
            this.player.setInvincible(60); // 60フレーム無敵
            // 画面を赤くフラッシュさせるなどの演出も可
            this.ctx.fillStyle = 'rgba(255,0,0,0.3)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    catchPlayer(net) {
        if (this.player.isInvincible || this.isInvincibleMode)
            return;
        this.state = STATE.CAUGHT;
        this.caughtNet = net;
        this.escapeClicks = 0;
        this.requiredClicks = 3; // 連打回数設定（5回から3回へ緩和）
        this.addFloatingText(this.player.x, this.player.y - 40,
            "連打で逃げろ！", "#FF4500");
    }

    escapeFromNet() {
        this.state = STATE.PLAYING;
        this.player.setInvincible(60); // 無敵時間付与
        this.player.jump(); // ジャンプして復帰
        if (this.caughtNet) {
            this.caughtNet.markedForDeletion = true; // 網を消す
            // 破片エフェクトなどを出しても良い
        }
        this.caughtNet = null;
        this.addFloatingText(this.player.x, this.player.y, "脱出！",
            "#FFFFFF");
        this.sound.playJump();
    }

    triggerFlatfishDeath(flatfish) {
        // ヒラメに食べられる演出開始
        if (this.isInvincibleMode) return;
        this.sound.playHit();
        this.state = STATE.BITTEN;
        this.bittenTimer = 0;
        this.killerEnemy = flatfish;
        // プレイヤーをヒラメの位置に固定（捕食された表現）
        this.player.x = flatfish.x;
        this.player.y = flatfish.y;
        this.deathReason = "ヒラメに食べられた";
    }

    getGroundY(x) {
        const base = this.height - 50;
        // うねうねさせる
        return base + Math.sin((x + this.scrollOffset) * 0.005) *
            20 + Math.sin((x + this.scrollOffset) * 0.02) * 10;
    }

    addFloatingText(x, y, text, color) {
        this.floatingTexts.push(new FloatingText(x, y, text,
            color));
    }

    getRank(score) {
        // お散歩判定: 地面を歩いた時間が長い（3秒以上）
        if (this.player && this.player.walkTimer > 180) {
            return "お散歩エビ";
        }

        if (score < 100) return "迷子のエビ";
        if (score < 300) return "新米エビ";
        if (score < 500) return "冒険者";
        if (score < 1000) return "深海の旅人";
        if (score < 2000) return "深淵を覗く者";
        if (score < 3000) return "深海の主";
        if (score < 5000) return "伝説の海老";
        return "深海の覇者";
    }

    showNotification(icon, text) {
        this.uiAchievementText.innerText = `${icon} ${text}`;
        this.uiAchievement.classList.add('show');
        setTimeout(() => this.uiAchievement.classList.remove(
            'show'), 3000);
        this.sound.playItem();
    }

    checkAchievements() {
        this.achievements.forEach(ach => {
            if (!this.unlockedAchievements.includes(ach.id)) {
                if (ach.condition(this)) {
                    this.unlockedAchievements.push(ach.id);
                    localStorage.setItem(
                        'ebi_achievements', JSON.stringify(
                            this.unlockedAchievements
                        ));
                    this.showNotification(ach.icon,
                        `実績解除！\n${ach.title}`);
                }
            }
            // セッション内で解除した実績を記録
            if (ach.condition(this) && !this.sessionAchievements
                .includes(ach.id)) {
                this.sessionAchievements.push(ach.id);
            }
        });
    }

    gameOver(reason) {
        if (reason) this.deathReason = reason;
        this.state = STATE.GAMEOVER;
        this.screenGameOver.style.display = 'block';

        // ゲームオーバーUIを描画した状態のCanvasを保存
        if (!this.screenshotTaken) {
            // 1. 文字なし（プレビュー用）を保存
            this.gameOverScreenshotURL = this.canvas.toDataURL(
                'image/png');

            // 2. 文字あり（ダウンロード用）を生成して保存
            this.ctx.save();

            // 半透明の黒背景を重ねて文字を見やすく
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#FF4500';
            this.ctx.font = 'bold 48px "M PLUS Rounded 1c"';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = 'white';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText("GAME OVER", this.width / 2, this.height /
                2 - 80);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 32px "M PLUS Rounded 1c"';
            this.ctx.fillText(`記録: ${Math.floor(this.score)}m`,
                this.width / 2, this.height / 2);

            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 24px "M PLUS Rounded 1c"';
            this.ctx.fillText(`称号: ${this.getRank(this.score)}`,
                this.width / 2, this.height / 2 + 40);

            this.ctx.fillStyle = '#FF6F61';
            this.ctx.font = 'bold 20px "M PLUS Rounded 1c"';
            this.ctx.fillText(`死因: ${reason || this.deathReason}`,
                this.width / 2, this.height / 2 + 80);

            this.ctx.restore();
            this.gameOverResultURL = this.canvas.toDataURL(
                'image/png');

            // 3. 画面を元に戻す（再描画）
            this.draw();

            this.screenshotTaken = true;
        }

        // スクリーンショット生成
        document.getElementById('screenshot').src = this.gameOverScreenshotURL;

        this.sound.stopBGM();
        this.uiReplay.style.display = 'none'; // スキップボタンを隠す
        this.uiFinalScore.innerText = Math.floor(this.score);
        this.uiRank.innerText = `称号: ${this.getRank(this.score)}`;
        this.uiDeathReason.innerText = reason || this.deathReason;
        this.uiInvincibleUsedMsg.style.display = this.invincibleModeUsed ?
            'block' : 'none';

        // バッジ表示
        this.uiBadgeContainer.innerHTML = '';
        this.achievements.forEach(ach => {
            const badge = document.createElement('div');
            const isUnlocked = this.unlockedAchievements.includes(
                ach.id);
            const isNew = this.sessionAchievements.includes(
                ach.id);
            badge.className =
                `badge ${isUnlocked ? '' : 'locked'} ${isNew ? 'new' : ''}`;
            badge.innerText = ach.icon;
            badge.title = ach.title; // ツールチップ用
            // スマホ等でタップした時に名前が見えるようにdata属性もセット
            badge.setAttribute('data-title',
                `${ach.title}\n${ach.description}`);
            this.uiBadgeContainer.appendChild(badge);
        });

        // リプレイボタンの表示制御（データがある場合のみ）
        if (this.replaySystem.buffer.length > 0) {
            this.btnReplay.style.display = 'block';
        }
        else {
            this.btnReplay.style.display = 'none';
        }

        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('ebi_highscore', this.highScore);
            this.uiHighScore.innerText = this.highScore;
        }
        this.frameCount = 0; // リスタート待ち時間用
    }

    update() {
        if (this.state === STATE.GALLERY) {
            this.frameCount++; // アニメーション用
            return;
        }

        if (this.state === STATE.REPLAY) {
            this.replaySystem.index++;
            if (this.replaySystem.index >= this.replaySystem.buffer.length) {
                // リプレイ終了
                this.gameOver(this.deathReason);
            }
            return;
        }

        if (this.state !== STATE.PLAYING && this.state !== STATE.CAUGHT) {
            if (this.state === STATE.GAMEOVER) this.frameCount++;
            return;
        }

        this.frameCount++;
        this.score += 0.1; // 距離加算
        this.scrollOffset += this.scrollSpeed;
        this.uiScore.innerText = Math.floor(this.score);

        // ゾーン判定
        this.isSludgeZone = (this.score >= 3000 && this.score < 4000);
        this.isIceZone = (this.score >= 4000 && this.score < 5000);
        this.isSpaceZone = (this.score >= 5000);

        // コンボタイマー更新
        if (this.comboTimer > 0) {
            this.comboTimer--;
        }
        else if (this.comboCount > 0) {
            this.comboCount = 0;
        }
        // コンボ表示更新
        this.uiComboDisplay.innerText = this.comboCount > 1 ?
            `${this.comboCount} COMBO!` : '';
        this.uiComboDisplay.classList.toggle('show', this.comboCount >
            1);

        // 状態記録（リプレイ用）
        this.replaySystem.recordState();

        // BGMパラメータ更新
        this.sound.setBGMParams(this.score, this.inRapidCurrentZone);

        // 実績チェック
        this.checkAchievements();

        // ランクアップチェック
        const newRank = this.getRank(this.score);
        if (newRank !== this.currentRank) {
            this.currentRank = newRank;
            this.showNotification('👑', `ランクアップ！\n${newRank}`);
        }

        // ボス出現判定
        if (this.score - this.lastBossDistance >= CONSTANTS.BOSS_INTERVAL) {
            this.lastBossDistance = Math.floor(this.score);
            // 警告表示
            this.uiWarning.classList.add('active');

            // 3秒後にボス出現
            setTimeout(() => {
                this.uiWarning.classList.remove('active');
                if (this.state === STATE.PLAYING) {
                    // ゾーンボス分岐
                    if (this.isSpaceZone) {
                        this.enemies.push(new Planet(this.width + 200, this.height / 2));
                    } else if (this.score >= 2000 && this.score < 3000) {
                        // 深海ボス
                        this.enemies.push(new Architeuthis(
                            this.width, this.height /
                        2, this));
                    }
                    else {
                        this.enemies.push(new Whale(this.width,
                            this.height / 2));
                    }
                }
            }, 3000);
        }

        // ヒラメ演出中は更新停止（演出用タイマーのみ動かす）
        if (this.state === STATE.BITTEN) return;

        // レベルアップ判定 (100mごと)
        const currentLevel = Math.floor(this.score / 100);
        if (currentLevel > this.level) {
            this.level = currentLevel;
            this.uiManager.updateLevel(this.level + 1);
            this.scrollSpeed += 0.5; // 速度アップ
            this.uiManager.showLevelUp();
        }

        // 激流ゾーンの制御
        this.rapidCurrentTimer++; // タイマーは常に進める
        this.kelpZoneTimer++;
        // 約20秒ごとに5秒間激流にする
        // 難易度が高いほど頻繁に
        const rapidCurrentInterval = this.difficulty === 'HARD' ?
            800 : 1200;
        if (!this.isRapidCurrent && !this.isKelpZone && this.rapidCurrentTimer >
            rapidCurrentInterval) {
            if (Math.random() < 0.02) { // ランダム性を持たせる
                this.isRapidCurrent = true;
                this.rapidCurrentTimer = 0;
                // 激流の高さを決定 (画面の20%〜80%の範囲)
                this.rapidCurrentY = this.height * 0.2 + Math.random() *
                    (this.height * 0.6);
                this.addFloatingText(this.width / 2, this.rapidCurrentY,
                    "激流注意！", "#FF4500");
            }
        }
        else if (this.isRapidCurrent) {
            if (this.rapidCurrentTimer > 300) {
                this.isRapidCurrent = false;
                this.inRapidCurrentZone = false;
                this.rapidCurrentTimer = 0;
            }

            // プレイヤーが激流ゾーン（上下100px）にいるか判定
            const range = 100;
            this.inRapidCurrentZone = Math.abs(this.player.y -
                this.rapidCurrentY) < range;

            if (this.inRapidCurrentZone) {
                this.player.vx -= 0.8; // 流される力をさらに強く
                // 激流音（頻度アップ・音量アップ）
                if (this.frameCount % 4 === 0) this.sound.playNoise(
                    0.25);
            }
            else {
                // ゾーン外でも少し音はする
                if (this.frameCount % 20 === 0) this.sound.playNoise(
                    0.05);
            }
        }

        // 昆布ゾーン（低速）の制御
        const kelpZoneInterval = 1000;
        if (!this.isKelpZone && !this.isRapidCurrent && this.kelpZoneTimer >
            kelpZoneInterval) {
            if (Math.random() < 0.02) {
                this.isKelpZone = true;
                this.kelpZoneTimer = 0;
                this.addFloatingText(this.width / 2, this.height /
                    2, "昆布の森", "#2E8B57");
            }
        }
        else if (this.isKelpZone) {
            if (this.kelpZoneTimer > 400) { // 持続時間
                this.isKelpZone = false;
                this.kelpZoneTimer = 0;
            }
            // プレイヤーの動きに抵抗をかける
            this.player.vx *= 0.95;
            // スクロール速度を落とす（ただし最低速度は保証）
            this.scrollSpeed = Math.max(1.0, this.scrollSpeed *
                0.8);
        }

        if (this.state === STATE.CAUGHT) {
            // 捕獲中の処理
            if (this.caughtNet) {
                // プレイヤーを網の位置に拘束
                this.player.x = this.caughtNet.x;
                this.player.y = this.caughtNet.y;

                // 暴れる演出（回転とバタつき）
                this.player.angle = (Math.random() - 0.5) * 0.8;
                this.player.isBending = (this.frameCount % 8 < 4);

                // 網が消滅していたら復帰（安全策）
                if (this.caughtNet.markedForDeletion) {
                    this.escapeFromNet();
                }
            }
            // 左端判定（網ごと流されて死ぬ）
            if (this.player.x < -this.player.radius) {
                this.lives = 0;
                const msg = this.inRapidCurrentZone ?
                    "激流で網ごと彼方へ..." : "網に捕まったまま流された";
                this.gameOver(msg);
                return;
            }
        }
        else {
            // 通常プレイ中の処理
            this.player.update(this);
            if (this.player.x < -this.player.radius) {
                this.lives = 0;
                const msg = this.inRapidCurrentZone ?
                    "激流に飲み込まれ、藻屑と消えた..." : "波に飲まれた";
                this.gameOver(msg);
                return;
            }
        }

        // 敵生成と更新
        this.spawner.spawnEnemy();
        this.spawner.spawnBackgroundObjects();
        this.spawner.spawnDecorations();

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.scrollSpeed, this); // Hookのためにthis(game)を渡す

            // クジラの吸い込み処理
            if (enemy instanceof Whale && enemy.isSucking) {
                // プレイヤーへの吸引力
                const dx = enemy.x - this.player.x;
                const dy = (enemy.y + 30) - this.player.y; // 口の位置へ
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 600) { // 影響範囲
                    const force = (600 - dist) / 600 * 2.0; // 近いほど強い
                    this.player.vx += (dx / dist) * force;
                    this.player.vy += (dy / dist) * force;
                    
                    // ザコ敵も吸い込む
                    this.enemies.forEach(other => {
                        if (other !== enemy && !(other instanceof Whale)) {
                            other.x += (enemy.x - other.x) * 0.05;
                            other.y += ((enemy.y + 30) - other.y) * 0.05;
                            // 口に入ったら消える
                            if (Math.abs(other.x - enemy.x) < 50 && Math.abs(other.y - (enemy.y + 30)) < 50) {
                                other.markedForDeletion = true;
                            }
                        }
                    });
                }
            }

            // 激流に流される処理
            if (this.isRapidCurrent && Math.abs(enemy.y - this.rapidCurrentY) <
                100) {
                enemy.x -= 5.0; // 敵も流される
            }

            // 削除フラグが立っている敵を削除
            if (enemy.markedForDeletion) {
                this.enemies.splice(i, 1);
                continue;
            }

            // 安全策: 座標がNaNになった敵は削除（フリーズ防止）
            if (!isFinite(enemy.x) || !isFinite(enemy.y)) {
                this.enemies.splice(i, 1);
                continue;
            }

            // 画面外判定
            if (enemy.isOffScreen(this.width, this.height)) {
                this.enemies.splice(i, 1);
                continue;
            }

            // 当たり判定
            if (this.state === STATE.PLAYING && enemy.checkCollision(
                this.player)) {
                if (enemy instanceof Flatfish) {
                    // ヒラメは即死演出
                    this.triggerFlatfishDeath(enemy);
                }
                else {
                    let reason = "敵にぶつかった";
                    if (enemy instanceof Fish) reason = "魚にぶつかった";
                    else if (enemy instanceof Sardine) reason =
                        "イワシの群れに巻き込まれた";
                    else if (enemy instanceof Tuna) reason =
                        "マグロに激突された";
                    else if (enemy instanceof Hook) reason =
                        "釣り針に引っかかった";
                    else if (enemy instanceof Anglerfish) reason =
                        "提灯鮟鱇に食べられた";
                    else if (enemy instanceof Shark) reason =
                        "サメに噛まれた";
                    else if (enemy instanceof Net) {
                        this.catchPlayer(enemy);
                        continue; // 捕獲処理へ
                    }
                    else if (enemy instanceof Squid) reason =
                        "イカにぶつかった";
                    else if (enemy instanceof Octopus) reason =
                        "タコに捕まった";
                    else if (enemy instanceof Jellyfish) reason =
                        "クラゲに刺された";
                    else if (enemy instanceof Porcupinefish ||
                        enemy instanceof Needle) reason =
                            "ハリセンボンの針が刺さった";
                    else if (enemy instanceof Whirlpool) reason =
                        "うずしおに巻き込まれた";
                    else if (enemy instanceof Whale) reason =
                        enemy.isSucking ? "クジラに吸い込まれた" : "巨大クジラに衝突した";
                    else if (enemy instanceof WaterSpout || enemy instanceof WaterDrop)
                        reason = "クジラの潮吹きにやられた";
                    else if (enemy instanceof Architeuthis ||
                        enemy instanceof GiantTentacle) reason =
                            "ダイオウイカに捕食された";
                    else if (enemy instanceof SeaUrchin) reason =
                        "うにに刺さった";
                    else if (enemy instanceof Crab) reason =
                        "カニに挟まれた";
                    else if (enemy instanceof SeaAnemone) reason =
                        "イソギンチャクに刺された";
                    else if (enemy instanceof Starfish) reason =
                        "ヒトデに張り付かれた";
                    else if (enemy instanceof ElectricEel) reason =
                        "電気ウナギに感電した";
                    else if (enemy instanceof Trash) reason = "ゴミにぶつかった";
                    else if (enemy instanceof MorayEel) reason = "ウツボに噛まれた";
                    else if (enemy instanceof Penguin) reason = "ペンギンと衝突した";
                    else if (enemy instanceof Seal || enemy instanceof Walrus) reason = "海獣にぶつかった";
                    else if (enemy instanceof Meteor || enemy instanceof SpaceDebris) reason = "宇宙の藻屑となった";
                    else if (enemy instanceof Planet) reason = "惑星に衝突した";

                    if (this.inRapidCurrentZone) {
                        reason = "激流で回避不能！" + reason;
                    }
                    this.hitPlayer(reason);
                }
            }
        }

        // アイテム更新
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(this.scrollSpeed, this); // gameを渡す

            // 安全策
            if (!isFinite(item.x) || !isFinite(item.y)) {
                this.items.splice(i, 1);
                continue;
            }

            if (item.isOffScreen(this.width, this.height)) {
                this.items.splice(i, 1);
                continue;
            }

            if (item.checkCollision(this.player)) {
                this.sound.playItem();
                this.itemsCollected++; // 実績用カウント
                if (item instanceof Pearl) {
                    this.score += 50;
                    this.addFloatingText(item.x, item.y, "+50",
                        "#FFD700");
                }
                else if (item instanceof TreasureChest) {
                    this.score += 500;
                    this.treasureChestsCollected++;
                    this.addFloatingText(item.x, item.y, "+500",
                        "#FFD700");
                }
                else if (item instanceof FriendShrimp) { // Planktonより先に判定する
                    if (this.lives < CONSTANTS.MAX_LIVES) {
                        this.lives++;
                        this.updateLifeDisplay();
                        this.updatePlayerSize();
                        this.addFloatingText(item.x, item.y,
                            "1UP!", "#FF69B4");
                    }
                    else {
                        // ライフ満タンならスコアボーナス
                        this.score += 100;
                        this.addFloatingText(item.x, item.y,
                            "+100", "#FFD700");
                    }
                }
                else if (item instanceof Plankton) {
                    this.score += 10;
                    this.addFloatingText(item.x, item.y, "+10",
                        "#90EE90");
                }
                else if (item instanceof Clownfish) {
                    this.score += 50;
                    this.addFloatingText(item.x, item.y, "+50",
                        "#FF4500");
                }
                else if (item instanceof GardenEel) {
                    this.score += 30;
                    this.addFloatingText(item.x, item.y, "+30",
                        "#FFFFFF");
                }
                this.items.splice(i, 1);
            }
        }

        // 装飾更新
        for (let i = this.decorations.length - 1; i >= 0; i--) {
            const deco = this.decorations[i];
            deco.update(this.scrollSpeed, this);

            // 画面外判定修正: 岩などが完全に消えてから削除
            const offscreenX = deco.width ? deco.x + deco.width :
                deco.x;
            if (offscreenX < 0) this.decorations.splice(i, 1);

            // 岩の当たり判定はShrimp.updateに移動
        }

        // 背景オブジェクト更新
        for (let i = this.backgroundObjects.length - 1; i >= 0; i--) {
            const obj = this.backgroundObjects[i];
            obj.update(this.scrollSpeed);
            if (obj.x < -300) this.backgroundObjects.splice(i, 1);
        }

        // 激流エフェクト（ストリームライン）
        if (this.isRapidCurrent && this.frameCount % 2 === 0) {
            // 激流の高さ周辺に生成
            const y = this.rapidCurrentY + (Math.random() - 0.5) *
                200;
            this.streamLines.push(new StreamLine(this.width, y));
        }
        for (let i = this.streamLines.length - 1; i >= 0; i--) {
            // 激流時はスクロールも速く見えるように
            this.streamLines[i].update(this.scrollSpeed + 10);
            if (this.streamLines[i].x < -200) this.streamLines.splice(
                i, 1);
        }

        // パーティクル（泡）
        if (this.frameCount % 20 === 0) {
            this.particles.push(new Bubble(this.player.x, this.player
                .y));
            if (Math.random() < 0.05) this.sound.playBubble(); // たまに音を鳴らす
        }

        // 背景の泡（スコアに応じて増える演出）
        // 深度(score)に応じて発生確率と数を上げる
        const bubbleDensity = Math.min(20, Math.floor(this.score /
            300));
        if (this.frameCount % 15 === 0) {
            // 基本確率 + スコアボーナス
            if (Math.random() < 0.2 + (bubbleDensity * 0.05)) {
                // 画面下部からランダムに発生
                this.particles.push(new Bubble(Math.random() * (
                    this.width + 100), this.height +
                10, true));
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(this.scrollSpeed);
            if (this.particles[i].life <= 0) this.particles.splice(
                i, 1);
        }

        // フローティングテキスト更新
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update();
            if (this.floatingTexts[i].life <= 0) this.floatingTexts
                .splice(i, 1);
        }
    }

    draw() {
        if (this.state === STATE.GALLERY) {
            this.uiManager.drawGallery(this.ctx);
            return;
        }

        if (this.state === STATE.REPLAY) {
            this.replaySystem.draw(this.ctx);
            return;
        }

        // ヒラメ捕食演出中の描画
        if (this.state === STATE.BITTEN) {
            this.bittenTimer++;

            // 画面シェイク演出
            const shakeX = (Math.random() - 0.5) * 20;
            const shakeY = (Math.random() - 0.5) * 20;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);

            // 背景などはそのまま
            // ヒラメを描画（口を閉じるアニメーションなど）
            this.killerEnemy.draw(this.ctx, true); // true = 捕食中

            this.ctx.restore();

            // 一定時間後にゲームオーバー
            if (this.bittenTimer > 60) {
                this.gameOver();
            }
            return;
        }

        // 背景クリア
        // スコアに応じて背景色を深海（暗く）にする演出
        const maxDepth = 2000; // 2000mで最も暗くなる
        const ratio = Math.min(this.score / maxDepth, 1);

        // #87CEEB (135, 206, 235) -> #001020 (0, 16, 32)
        const r = Math.floor(135 * (1 - ratio) + 0 * ratio);
        const g = Math.floor(206 * (1 - ratio) + 16 * ratio);
        const b = Math.floor(235 * (1 - ratio) + 32 * ratio);

        // 宇宙ゾーンの背景
        if (this.isSpaceZone) {
            this.ctx.fillStyle = '#0B0B3B';
            this.ctx.fillRect(0, 0, this.width, this.height);
            // 星を描画
            this.ctx.fillStyle = 'white';
            for(let i=0; i<50; i++) {
                const sx = (this.frameCount * 0.5 + i * 137) % this.width;
                const sy = (i * 93) % this.height;
                const size = (i % 3) + 1;
                this.ctx.fillRect(sx, sy, size, size);
            }
        } else {

        // 背景グラデーション (上から光が差し込む表現)
        const gradient = this.ctx.createLinearGradient(0, 0, 0,
            this.height);
        gradient.addColorStop(0,
            `rgb(${Math.min(255, r + 30)},${Math.min(255, g + 30)},${Math.min(255, b + 30)})`
        );
        gradient.addColorStop(1, `rgb(${r},${g},${b})`);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // 背景オブジェクト描画（地面より奥）
        this.backgroundObjects.forEach(o => o.draw(this.ctx));

        // 海底の描画（砂）
        // うねうねさせる
        this.ctx.fillStyle = '#E0C090'; // 砂っぽい色
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.height);
        for (let x = 0; x <= this.width; x += 10) {
            this.ctx.lineTo(x, this.getGroundY(x));
        }
        this.ctx.lineTo(this.width, this.height);
        this.ctx.fill();

        // 激流エフェクト描画
        this.streamLines.forEach(l => l.draw(this.ctx));
        if (this.isRapidCurrent) {
            // 激流ゾーンを可視化（薄い帯）
            const grad = this.ctx.createLinearGradient(0, this.rapidCurrentY -
                100, 0, this.rapidCurrentY + 100);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, this.rapidCurrentY - 100, this.width,
                200);
        }

        // 昆布ゾーンエフェクト
        if (this.isKelpZone) {
            this.ctx.fillStyle = 'rgba(46, 139, 87, 0.1)';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // アイテム描画
        this.items.forEach(i => {
            this.ctx.save();
            this.ctx.translate(i.x, i.y);
            this.ctx.scale(this.scaleFactor, this.scaleFactor);
            this.ctx.translate(-i.x, -i.y);
            i.draw(this.ctx);
            this.ctx.restore();
        });

        // フローティングテキスト描画
        this.floatingTexts.forEach(t => t.draw(this.ctx));

        // パーティクル描画
        this.particles.forEach(p => p.draw(this.ctx));

        // 敵描画
        this.enemies.forEach(e => {
            this.ctx.save();
            this.ctx.translate(e.x, e.y);
            this.ctx.scale(this.scaleFactor, this.scaleFactor);
            this.ctx.translate(-e.x, -e.y);
            e.draw(this.ctx);
            this.ctx.restore();
        });

        // 装飾描画
        this.decorations.forEach(d => d.draw(this.ctx, this.frameCount));

        // プレイヤー描画
        this.player.draw(this.ctx, this.lives, this.decorations);

        // 深海モード（暗闇演出）
        // スコア500mから徐々に暗くなり、プレイヤーの周りだけ明るくする
        if (this.score > 500) {
            const darknessStart = 500;
            const darknessEnd = 3000;
            const maxDarkness = 0.95;
            const ratio = Math.min(Math.max((this.score -
                darknessStart) / (darknessEnd -
                    darknessStart), 0), 1);
            const darknessAlpha = ratio * maxDarkness;

            if (darknessAlpha > 0.01) {
                const cx = this.player.x;
                const cy = this.player.y;
                const lightRadius = 120; // 明るい範囲
                const fadeRadius = lightRadius + (this.width <
                    600 ? 200 : 400); // グラデーションの広がり

                const grad = this.ctx.createRadialGradient(cx, cy,
                    lightRadius, cx, cy, fadeRadius);
                grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
                grad.addColorStop(1,
                    `rgba(0, 0, 0, ${darknessAlpha})`);

                this.ctx.fillStyle = grad;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
        }

        // ヘドロゾーン：視界不良（ヘドロオーバーレイ）
        if (this.isSludgeZone) {
            // 汚い緑のオーバーレイ
            this.ctx.fillStyle = 'rgba(85, 107, 47, 0.4)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            // 浮遊物（ゴミ）
            this.ctx.fillStyle = 'rgba(50, 50, 0, 0.2)';
            for(let i=0; i<20; i++) {
                const dx = (this.frameCount + i * 50) % this.width;
                const dy = (i * 40) % this.height;
                this.ctx.fillRect(dx, dy, 4, 4);
            }
        }

        // 流氷ゾーン：上部に氷
        if (this.isIceZone) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillRect(0, 0, this.width, 60); // 上部の氷
        }

        // 捕獲中のUI描画
        if (this.state === STATE.CAUGHT || (this.state === STATE.GAMEOVER &&
            this.caughtNet)) {
            // プレイヤーの上に網を描画して「捕まっている感」を出す
            this.ctx.save();
            this.ctx.translate(this.player.x, this.player.y);

            // 円形でクリッピング
            this.ctx.beginPath();
            this.ctx.arc(0, 0, this.player.radius + 8, 0, Math.PI * 2);
            this.ctx.clip();

            this.ctx.strokeStyle = 'rgba(80, 50, 20, 0.9)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            const r = this.player.radius + 10;
            for (let i = -r; i <= r; i += 8) {
                this.ctx.moveTo(i, -r);
                this.ctx.lineTo(i, r);
                this.ctx.moveTo(-r, i);
                this.ctx.lineTo(r, i);
            }
            this.ctx.stroke();
            this.ctx.restore();

        }
        if (this.state === STATE.CAUGHT) {
            this.ctx.save();
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px "M PLUS Rounded 1c"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText("連打!!", this.player.x, this.player.y - 50);
            // ゲージ
            const barW = 60;
            const progress = Math.min(1.0, this.escapeClicks / this.requiredClicks);
            this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
            this.ctx.fillRect(this.player.x - barW / 2, this.player.y -
                40, barW, 8);
            this.ctx.fillStyle = '#FF4500';
            this.ctx.fillRect(this.player.x - barW / 2, this.player.y -
                40, barW * progress, 8);
            this.ctx.restore();
        }
    }
    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}
