/**
 * ゲーム仕様定数
 */
const CONSTANTS = {
    GRAVITY: 0.15,
    JUMP_FORCE_Y: -5.0, // 上方向への力
    JUMP_FORCE_X: -4.0, // 後方への力（バック）
    AUTO_FORWARD_SPEED: 1.5, // 何もしない時に前（右）に戻る力
    SCROLL_SPEED: 3.5, // 背景・敵のスクロール速度
    SHRIMP_COLOR: '#FF6F61',
    SHRIMP_BASE_SIZE: 20,
    MAX_LIVES: 5,
    BOSS_INTERVAL: 300 // ボス出現間隔(m)
};

/**
 * ゲームの状態管理
 */
const STATE = {
    START: 0,
    PLAYING: 1,
    GAMEOVER: 2,
    PAUSED: 3,
    BITTEN: 4, // ヒラメに食べられている状態
    REPLAY: 5, // リプレイ再生中
    CAUGHT: 6 // 網に捕まっている
};

/**
 * 音声管理クラス (Web Audio API)
 */
class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)
            ();
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.bgmTempo = 250;
        this.bgmPitchRate = 1.0;
        this.bgmVolume = 0.3;
        this.seVolume = 0.5;
    }

    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.1, isBGM = false) {
        const masterVol = isBGM ? this.bgmVolume : this.seVolume;
        const finalVol = vol * masterVol;
        if (finalVol <= 0.001) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime +
            duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playJump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime +
            0.1);
        gain.gain.setValueAtTime(0.1 * this.seVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime +
            0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime +
            0.3);
        gain.gain.setValueAtTime(0.2 * this.seVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime +
            0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playItem() {
        this.playTone(1200, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(1800, 'sine', 0.2, 0.1),
            50);
    }

    playBubble() {
        this.playTone(800 + Math.random() * 200, 'sine', 0.05,
            0.02);
    }

    playNoise(vol = 0.1) {
        if (this.ctx.state !== 'running') return;
        // 簡易的なノイズ生成（激流音）
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx
            .sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        // ローパスフィルタをかけて水流のような低い音にする
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400; // こもらせる

        const gain = this.ctx.createGain();
        gain.gain.value = vol * this.seVolume;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
    }

    setBGMParams(score, inRapidCurrentZone) {
        // スコア(深度)に応じてテンポを遅く、ピッチを低くする
        // 0m: 250ms, 1.0
        // 2000m: 400ms, 0.6
        const ratio = Math.min(score / 2000, 1.0);
        this.bgmTempo = 250 + ratio * 150;
        this.bgmPitchRate = 1.0 - ratio * 0.4;

        if (inRapidCurrentZone) {
            this.bgmTempo *= 0.5; // テンポアップ（さらに速く）
            this.bgmPitchRate += 0.5; // ピッチアップ（さらに高く）
        }
    }

    startBGM() {
        if (this.bgmTimer) return;
        this.playBGMStep();
    }

    playBGMStep() {
        const notes = [196, 0, 261, 0, 220, 0, 196, 0]; // G3, C4, A3, G3

        if (this.ctx.state !== 'suspended') {
            const baseFreq = notes[this.bgmStep % notes.length];
            if (baseFreq > 0) {
                this.playTone(baseFreq * this.bgmPitchRate,
                    'triangle', 0.2, 0.1, true);
            }
        }
        this.bgmStep++;
        this.bgmTimer = setTimeout(() => this.playBGMStep(), this
            .bgmTempo);
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearTimeout(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

/**
 * キャラクタークラス: えびちゃん
 */
class Shrimp {
    constructor(x, y) {
        this.reset(x, y);
        this.radius = CONSTANTS.SHRIMP_BASE_SIZE;
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.isBending = false; // くの字状態
        this.invincibleTimer = 0;
        this.bendTimer = 0;
        this.history = []; // 軌跡保存用
        this.recoveryBoostTimer = 0;
        this.isOnGround = false;
        this.walkTimer = 0;
    }

    jump() {
        // 仕様: 後方＋上方向へ跳ねる
        this.vy = CONSTANTS.JUMP_FORCE_Y;
        this.vx = CONSTANTS.JUMP_FORCE_X;
        this.isBending = true;
        this.bendTimer = 15; // 変形持続フレーム
        this.recoveryBoostTimer = 30; // 泳ぎブースト
    }

    setInvincible(frames) {
        this.invincibleTimer = frames;
    }

    update(game) {
        const screenWidth = game.width;

        // 重力（徐々に沈む）
        this.vy += CONSTANTS.GRAVITY;
        this.isOnGround = false;

        if (this.recoveryBoostTimer > 0) this.recoveryBoostTimer--;
        const recoveryForce = (this.recoveryBoostTimer > 0) ?
            0.35 : 0.2;

        // 自動前進（元の位置に戻ろうとする力）
        // 画面左端に行き過ぎないように、右方向へ一定の力をかける
        if (this.x < this.radius * 4) {
            this.vx -= 0.5; // 左端に近づくと外側に吸い込まれる（復帰困難に）
        }
        else if (this.x < screenWidth * 0.3) {
            this.vx += recoveryForce; // 頑張って泳ぐと復帰力アップ
        }
        else {
            // 定位置より前に出過ぎないように減速
            this.vx *= 0.95;
        }

        // 速度適用
        this.x += this.vx;
        this.y += this.vy;

        // 画面端制限
        // 天井
        if (this.y < this.radius) {
            this.y = this.radius;
            this.vy = 0;
        } // 天井

        // 地面（海底・岩）との当たり判定
        let groundY = game.getGroundY(this.x);
        const rocks = game.decorations.filter(d => d instanceof RuggedTerrain);
        for (const rock of rocks) {
            // プレイヤーが岩の水平範囲内にいるか
            // 岩の当たり判定修正: pointsを使って正確な範囲を取得
            const startX = rock.x + rock.points[0].x;
            const endX = rock.x + rock.points[rock.points.length -
                1].x;
            if (this.x >= startX && this.x <= endX) {
                const surfaceInfo = rock.getSurfaceInfo(this.x);
                if (surfaceInfo) {
                    // 45度以下の坂道なら地面として認識
                    if (Math.abs(surfaceInfo.slope) <= 1) {
                        if (surfaceInfo.y < groundY + 5) { // 少し余裕を持たせる
                            groundY = surfaceInfo.y;
                        }
                    }
                    // 45度より急な坂（壁）に横からぶつかった場合
                    else if (this.y + this.radius > surfaceInfo.y) {
                        // 埋まり具合から押し出し量を計算
                        const embed = (this.y + this.radius) -
                            surfaceInfo.y;
                        const push = (embed + 2) / surfaceInfo.slope;

                        if (surfaceInfo.slope < 0) {
                            // 上り坂（左壁）: 最低でも5pxは押し戻す（すり抜け防止）
                            this.x += Math.min(push, -5);
                        }
                        else {
                            // 下り坂（右壁）
                            this.x += Math.max(push, 5);
                        }
                        game.pushedByRock = true;
                        this.vx *= -0.5; // 跳ね返る
                    }
                }
            }
            // 岩の左端に衝突した場合
            if (rock.checkSideCollision(this)) {
                this.x = rock.x - this.radius;
                this.vx = 0;
            }
        }
        if (this.y > groundY - this.radius) { // 地面に着地
            this.y = groundY - this.radius;
            this.vy = 0;
            this.isOnGround = true;
        }

        // 右壁
        if (this.x > screenWidth - this.radius) this.x =
            screenWidth - this.radius; // 右壁

        // 変形タイマー
        if (this.bendTimer > 0) {
            this.bendTimer--;
        }
        else {
            this.isBending = false;
        }

        if (this.isOnGround) {
            this.walkTimer += 0.5;
        }
        else {
            this.walkTimer = 0;
        }

        // NaNガード
        if (isNaN(this.x)) {
            this.x = 100;
            this.vx = 0;
        }
        if (isNaN(this.y)) {
            this.y = 100;
            this.vy = 0;
        }
        if (isNaN(this.vx)) this.vx = 0;
        if (isNaN(this.vy)) this.vy = 0;

        // 履歴の更新（追従用）
        this.history.unshift(
            {
                x: this.x,
                y: this.y,
                angle: this.angle,
                isBending: this.isBending
            });
        if (this.history.length > 100) {
            this.history.pop();
        }

        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
        }

        // 角度計算（進行方向に向ける）
        // バック中は後ろ向き、通常は前向き
        if (this.isBending) {
            this.angle = -Math.PI / 4; // バック時の角度
        }
        else {
            this.angle = Math.min(Math.PI / 4, Math.max(-Math.PI /
                4, this.vy * 0.1));
        }
    }

    get isInvincible() {
        return this.invincibleTimer > 0;
    }

    draw(ctx, lives = 1, decorations = []) {
        // 無敵時間は点滅
        if (this.isInvincible && Math.floor(Date.now() / 100) % 2 ===
            0) return;

        // 仲間（残機分）の描画
        // 履歴を使って後ろをついてこさせる
        // 1匹あたり10フレーム遅れで表示
        const followerCount = Math.max(0, lives - 1);
        for (let i = 1; i <= followerCount; i++) {
            const delay = i * 8;
            if (this.history[delay]) {
                const pos = this.history[delay];
                // 安全策: 履歴が不正な場合はスキップ
                const followerDummy = {
                    x: pos.x,
                    y: pos.y,
                    radius: this.radius * 0.7
                };
                let inRock = false;
                if (decorations) {
                    inRock = decorations.some(d => d instanceof RuggedTerrain &&
                        d.checkSideCollision(followerDummy));
                }

                if (inRock) continue;

                if (!isFinite(pos.x) || !isFinite(pos.y)) continue;
                ctx.save();
                ctx.translate(pos.x, pos.y);
                ctx.rotate(pos.angle);
                // 仲間は少し小さく、色を変える
                const scale = 0.7;
                ctx.scale(scale, scale);
                // 仲間の色
                const fGrad = ctx.createRadialGradient(0, -this.radius *
                    0.2, 0, 0, 0, this.radius);
                fGrad.addColorStop(0, '#FFC0CB');
                fGrad.addColorStop(1, '#FFB6C1');
                ctx.fillStyle = fGrad;
                this.drawBody(ctx, pos.isBending);
                ctx.restore();
            }
        }

        // 安全策
        if (!isFinite(this.x) || !isFinite(this.y)) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const grad = ctx.createRadialGradient(0, -this.radius *
            0.2, 0, 0, 0, this.radius);
        grad.addColorStop(0, '#FF8E84');
        grad.addColorStop(1, CONSTANTS.SHRIMP_COLOR);
        ctx.fillStyle = grad;

        this.drawBody(ctx, this.isBending);

        ctx.restore();
    }

    drawFollower(ctx, pos) {
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.angle);
        // 仲間は少し小さく、色を変える
        const scale = 0.7;
        ctx.scale(scale, scale);
        // 仲間の色
        const fGrad = ctx.createRadialGradient(0, -this.radius *
            0.2, 0, 0, 0, this.radius);
        fGrad.addColorStop(0, '#FFC0CB');
        fGrad.addColorStop(1, '#FFB6C1');
        ctx.fillStyle = fGrad;
        this.drawBody(ctx, pos.isBending);
        ctx.restore();
    }

    drawBody(ctx, isBending) {
        const baseStyle = ctx.fillStyle;
        // よりリアルでスタイリッシュなエビのデザイン
        if (isBending) {
            // くの字（ジャンプ時）
            ctx.beginPath();
            // 胴体（曲がっている）
            ctx.ellipse(0, 0, this.radius * 1.2, this.radius *
                0.7, 0, 0, Math.PI * 2);
            ctx.fill();

            // 尻尾
            ctx.beginPath();
            ctx.moveTo(-this.radius * 0.8, 0);
            ctx.lineTo(-this.radius * 1.8, this.radius * 0.6);
            ctx.lineTo(-this.radius * 1.4, -this.radius * 0.2);
            ctx.fill();
        }
        else {
            // 通常（伸びている）
            ctx.beginPath();
            // 胴体
            ctx.ellipse(0, 0, this.radius * 1.6, this.radius *
                0.6, 0, 0, Math.PI * 2);
            ctx.fill();

            // 節（セグメント）の表現
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(-this.radius * 0.5 + i * this.radius *
                    0.5, -this.radius * 0.2, this.radius *
                0.4, 0, Math.PI, false);
                ctx.fill();
            }
            ctx.fillStyle = baseStyle;

            // 足
            ctx.strokeStyle = baseStyle;
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                const x = -this.radius * 0.5 + i * this.radius *
                    0.4;
                const legOffset = this.isOnGround ? Math.sin(this
                    .walkTimer + i * 2) * 4 : 0;
                ctx.moveTo(x, this.radius * 0.3);
                ctx.lineTo(x - 2 + legOffset, this.radius * 0.8);
                ctx.stroke();
            }

            // 尻尾
            ctx.beginPath();
            ctx.moveTo(-this.radius, 0);
            ctx.lineTo(-this.radius * 1.75, this.radius * 0.25);
            ctx.lineTo(-this.radius * 1.75, -this.radius * 0.25);
            ctx.fill();
        }

        // 長い触角
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.radius, -5);
        ctx.quadraticCurveTo(this.radius + 20, -20, this.radius +
            10, -30);
        ctx.moveTo(this.radius, -5);
        ctx.quadraticCurveTo(this.radius + 25, -15, this.radius +
            15, -35);
        ctx.stroke();

        // 目（かわいさ重視）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.radius * 0.8, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.radius * 0.9, -5, 2, 0, Math.PI * 2);
        ctx.fill();
        // 目のハイライト
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.radius * 0.9 - 1, -5 - 1, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 敵クラス群
 */
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.markedForDeletion = false;
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx) { }
    isOffScreen(w, h) {
        return this.x < -100 || this.y > h + 100;
    }
    checkCollision(player) {
        // 簡易円形当たり判定
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + player.radius);
    }
}

class Fish extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
        this.extraSpeed = Math.random() * 2;
        this.angle = Math.random() * Math.PI * 2;
    }
    update(baseSpeed) {
        this.x -= (baseSpeed + this.extraSpeed);
        // 動きを工夫: 上下にゆらゆら揺れる
        this.y += Math.sin(this.angle += 0.05) * 1.5;
    }
    draw(ctx) {
        // 左向き
        const grad = ctx.createLinearGradient(this.x + 25, this.y -
            15, this.x - 25, this.y + 15);
        grad.addColorStop(0, '#5F9EA0');
        grad.addColorStop(1, '#4682B4');
        ctx.fillStyle = grad;

        // 体（流線型）
        ctx.beginPath();
        ctx.moveTo(this.x - 25, this.y); // 頭（左）
        ctx.quadraticCurveTo(this.x, this.y - 20, this.x + 25,
            this.y); // 背中
        ctx.quadraticCurveTo(this.x, this.y + 20, this.x - 25,
            this.y); // 腹
        ctx.fill();

        // 鱗模様
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(this.x + 10 - i * 10, this.y - 6 + j * 6,
                    4, 0, Math.PI, false);
                ctx.fill();
            }
        }

        // 尾びれ
        ctx.fillStyle = '#4682B4';
        ctx.beginPath();
        ctx.moveTo(this.x + 20, this.y);
        ctx.lineTo(this.x + 35, this.y - 12);
        ctx.lineTo(this.x + 35, this.y + 12);
        ctx.fill();

        // 胸ビレ
        ctx.fillStyle = '#87CEFA';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 3, 8, 4, Math.PI / 4, 0,
            Math.PI * 2);
        ctx.fill();

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 12, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 13, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Sardine extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 12;
        this.speed = 2.0;
        this.angle = Math.random() * Math.PI * 2;
    }
    update(baseSpeed) {
        this.x -= (baseSpeed + this.speed);
        this.y += Math.sin(this.angle += 0.1) * 0.5;
    }
    draw(ctx) {
        // イワシっぽく（銀色、斑点）
        const grad = ctx.createLinearGradient(this.x, this.y - 8,
            this.x, this.y + 8);
        grad.addColorStop(0, '#708090'); // SlateGray (背中)
        grad.addColorStop(0.4, '#C0C0C0'); // Silver (側面)
        grad.addColorStop(1, '#F5F5F5'); // WhiteSmoke (腹)
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 20, 7, 0, 0, Math.PI * 2);
        ctx.fill();

        // 斑点（イワシの特徴）
        ctx.fillStyle = '#2F4F4F';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x - 5 + i * 7, this.y - 1, 1.5, 0, Math.PI *
                2);
            ctx.fill();
        }

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 14, this.y - 1, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 14, this.y - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 尾びれ
        ctx.fillStyle = '#708090';
        ctx.beginPath();
        ctx.moveTo(this.x + 18, this.y);
        ctx.lineTo(this.x + 24, this.y - 5);
        ctx.lineTo(this.x + 24, this.y + 5);
        ctx.fill();
    }
}

class Tuna extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.speed = 10.0; // とても速い
    }
    update(baseSpeed) {
        this.x -= (baseSpeed + this.speed);
    }
    draw(ctx) {
        // マグロ（クロマグロ）
        // 紡錘形の流線型ボディ
        const grad = ctx.createLinearGradient(this.x, this.y - 25,
            this.x, this.y + 25);
        grad.addColorStop(0, '#000033'); // 濃紺（背中）
        grad.addColorStop(0.4, '#191970'); // 紺
        grad.addColorStop(0.6, '#708090'); // 銀灰
        grad.addColorStop(1, '#F0F8FF'); // 白（腹）
        ctx.fillStyle = grad;

        ctx.beginPath();
        // 頭から尾にかけてのカーブ
        ctx.moveTo(this.x - 45, this.y); // 鼻先
        ctx.quadraticCurveTo(this.x - 20, this.y - 28, this.x +
            20, this.y - 20); // 背中
        ctx.lineTo(this.x + 45, this.y - 5); // 尾柄（上）
        ctx.lineTo(this.x + 45, this.y + 5); // 尾柄（下）
        ctx.quadraticCurveTo(this.x + 20, this.y + 20, this.x -
            20, this.y + 28); // 腹
        ctx.quadraticCurveTo(this.x - 35, this.y + 15, this.x -
            45, this.y); // 顎
        ctx.fill();

        // 黄色い小離鰭（マグロの特徴）
        ctx.fillStyle = '#FFD700';
        for (let i = 0; i < 6; i++) {
            // 背側
            ctx.beginPath();
            ctx.moveTo(this.x + 15 + i * 5, this.y - 22);
            ctx.lineTo(this.x + 18 + i * 5, this.y - 28);
            ctx.lineTo(this.x + 21 + i * 5, this.y - 21);
            ctx.fill();
            // 腹側
            ctx.beginPath();
            ctx.moveTo(this.x + 15 + i * 5, this.y + 22);
            ctx.lineTo(this.x + 18 + i * 5, this.y + 28);
            ctx.lineTo(this.x + 21 + i * 5, this.y + 21);
            ctx.fill();
        }

        // 第2背びれ・尻びれ（鎌状）
        ctx.fillStyle = '#191970'; // 濃紺
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y - 25);
        ctx.quadraticCurveTo(this.x + 15, this.y - 45, this.x +
            25, this.y - 22);
        ctx.fill();
        ctx.fillStyle = '#F0F8FF'; // 白っぽい
        ctx.beginPath();
        ctx.moveTo(this.x + 10, this.y + 25);
        ctx.quadraticCurveTo(this.x + 15, this.y + 45, this.x +
            25, this.y + 22);
        ctx.fill();

        // 尾びれ（三日月型）
        ctx.fillStyle = '#2F4F4F';
        ctx.beginPath();
        ctx.moveTo(this.x + 45, this.y);
        ctx.lineTo(this.x + 60, this.y - 25);
        ctx.quadraticCurveTo(this.x + 50, this.y, this.x + 60,
            this.y + 25);
        ctx.fill();

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 30, this.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 30, this.y - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // エラ蓋
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x - 15, this.y, 15, Math.PI * 0.5, Math.PI *
            1.5);
        ctx.stroke();
    }
}

class Shark extends Enemy {
    constructor(x, y, player) {
        super(x, y);
        this.player = player;
        this.radius = 30;
        this.speed = 6.5;
    }
    update(baseSpeed) {
        this.x -= (baseSpeed + this.speed);
        // ホーミング（プレイヤーのY座標に近づく）
        if (this.player) {
            const dy = this.player.y - this.y;
            this.y += dy * 0.025; // 追尾性能アップ
        }
    }
    draw(ctx) {
        // ホホジロザメ風
        const grad = ctx.createLinearGradient(this.x - 40, this.y -
            20, this.x + 40, this.y + 20);
        grad.addColorStop(0, '#708090'); // SlateGray (背中)
        grad.addColorStop(0.5, '#A9A9A9'); // DarkGray
        grad.addColorStop(1, '#F0F8FF'); // AliceBlue (腹)
        ctx.fillStyle = grad;

        ctx.beginPath();
        // 流線型の体
        ctx.moveTo(this.x - 50, this.y + 5); // 鼻先
        ctx.quadraticCurveTo(this.x - 20, this.y - 25, this.x +
            20, this.y - 15); // 背中
        ctx.lineTo(this.x + 50, this.y - 5); // 尾柄
        // 尾びれ
        ctx.lineTo(this.x + 70, this.y - 25); // 上葉
        ctx.lineTo(this.x + 60, this.y);
        ctx.lineTo(this.x + 70, this.y + 25); // 下葉
        ctx.lineTo(this.x + 50, this.y + 5);
        // 腹
        ctx.quadraticCurveTo(this.x, this.y + 20, this.x - 30,
            this.y + 15);
        ctx.lineTo(this.x - 50, this.y + 5);
        ctx.fill();

        // 背びれ（鋭く）
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y - 18);
        ctx.lineTo(this.x - 10, this.y - 45);
        ctx.quadraticCurveTo(this.x - 15, this.y - 30, this.x -
            20, this.y - 15);
        ctx.fill();

        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 35, this.y - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // エラ
        ctx.strokeStyle = '#506070';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x - 15 + i * 6, this.y - 5);
            ctx.lineTo(this.x - 15 + i * 6, this.y + 10);
            ctx.stroke();
        }

        // 歯（ギザギザ）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(this.x - 45, this.y + 8);
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(this.x - 40 + i * 3, this.y + 12);
            ctx.lineTo(this.x - 38 + i * 3, this.y + 8);
            ctx.stroke();
        }
    }
}

class Anglerfish extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.angle = Math.random() * Math.PI * 2;
    }
    update(speed) {
        this.x -= speed * 0.7; // 少し遅め
        this.y += Math.sin(this.angle += 0.03) * 0.5;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1.2;
        ctx.scale(scale, scale);

        // リアルなチョウチンアンコウ（Melanocetus johnsonii風）
        // 体
        const grad = ctx.createRadialGradient(10, 5, 5, 0, 0, 35);
        grad.addColorStop(0, '#2F2F2F');
        grad.addColorStop(0.6, '#101010');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;

        ctx.beginPath();
        // 丸みを帯びた体
        ctx.moveTo(20, -10); // 上顎
        ctx.bezierCurveTo(10, -35, -30, -35, -40, -5); // 背中
        ctx.lineTo(-45, 0); // 尾の付け根
        ctx.lineTo(-40, 5);
        ctx.bezierCurveTo(-30, 35, 10, 35, 25, 10); // 腹〜下顎
        ctx.lineTo(20, -10); // 口を閉じる（あるいは開ける）
        ctx.fill();

        // 巨大な口と鋭い歯
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        // 上の歯
        for (let i = 0; i < 5; i++) {
            ctx.moveTo(20 - i * 6, -5);
            ctx.lineTo(18 - i * 6, 8); // 長い歯
            ctx.lineTo(16 - i * 6, -5);
        }
        // 下の歯
        for (let i = 0; i < 6; i++) {
            ctx.moveTo(22 - i * 5, 10);
            ctx.lineTo(20 - i * 5, -2); // 長い歯
            ctx.lineTo(18 - i * 5, 10);
        }
        ctx.fill();

        // 目（小さく退化しているが不気味に光る）
        ctx.fillStyle = '#E0FFFF';
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#E0FFFF';
        ctx.beginPath();
        ctx.arc(5, -15, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 提灯の柄
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, -25); // 頭頂部から
        ctx.bezierCurveTo(20, -50, 40, -40, 45, -20); // 前に垂らす
        ctx.stroke();

        // 提灯の光（発光エフェクト強化）
        const glowGrad = ctx.createRadialGradient(45, -20, 2, 45, -
            20, 15);
        glowGrad.addColorStop(0, '#FFFFFF');
        glowGrad.addColorStop(0.4, '#00FFFF'); // Cyan glow
        glowGrad.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(45, -20, 15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Hook extends Enemy {
    constructor(x, y) {
        // 画面右側に出現させる
        super(x * 0.8 + Math.random() * (x * 0.2), y);
        this.radius = 10;
        this.vy = 4.5; // 落下速度アップ
    }
    update(speed, game) {
        this.x -= speed; // スクロールに合わせて移動
        this.y += this.vy; // 上から下へ

        if (game) {
            let limitY = game.getGroundY(this.x);

            // 岩との当たり判定（岩の上で止まるように）
            const rocks = game.decorations.filter(d => d instanceof RuggedTerrain);
            for (const rock of rocks) {
                const startX = rock.x + rock.points[0].x;
                const endX = rock.x + rock.points[rock.points.length -
                    1].x;
                if (this.x >= startX && this.x <= endX) {
                    const info = rock.getSurfaceInfo(this.x);
                    if (info && info.y < limitY) {
                        limitY = info.y;
                    }
                }
            }

            if (this.y > limitY) this.y = limitY;
        }
    }
    draw(ctx) {
        const grad = ctx.createLinearGradient(this.x - 5, this.y,
            this.x + 5, this.y);
        grad.addColorStop(0, '#C0C0C0');
        grad.addColorStop(1, '#696969');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, -100); // 糸（画面上端より上まで確実に引く）
        ctx.lineTo(this.x, this.y);
        ctx.stroke();

        // 針のJの字
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y, 10, 0, Math.PI, false);
        ctx.stroke();
    }
}

class Net extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 80; // 大きく
        this.angle = 0;
    }
    update(speed) {
        this.x -= speed;
        this.y += Math.sin(this.angle += 0.02) * 1;
    }
    draw(ctx) {
        if (!isFinite(this.x) || !isFinite(this.y)) return;

        ctx.strokeStyle = '#5D4037'; // 濃い茶色
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.2)'; // 薄暗い網の色

        // 上部のロープ
        ctx.beginPath();
        ctx.moveTo(this.x - 60, this.y - 70);
        ctx.quadraticCurveTo(this.x, this.y - 60, this.x + 60,
            this.y - 70);
        ctx.stroke();

        // 浮き（フロート）
        ctx.fillStyle = '#FFD700';
        for (let i = -50; i <= 50; i += 25) {
            ctx.beginPath();
            ctx.arc(this.x + i, this.y - 65 + Math.abs(i) * 0.1,
                5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 網袋
        ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
        ctx.beginPath();
        ctx.moveTo(this.x - 60, this.y - 70);
        ctx.bezierCurveTo(this.x - 70, this.y, this.x - 30, this.y +
            70, this.x, this.y + 80);
        ctx.bezierCurveTo(this.x + 30, this.y + 70, this.x + 70,
            this.y, this.x + 60, this.y - 70);
        ctx.fill();
        ctx.stroke();

        // 網目（クリッピングして描画）
        ctx.save();
        ctx.clip();
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -80; i < 80; i += 10) {
            ctx.moveTo(this.x + i, this.y - 80);
            ctx.lineTo(this.x + i - 40, this.y + 100);
            ctx.moveTo(this.x + i, this.y - 80);
            ctx.lineTo(this.x + i + 40, this.y + 100);
        }
        ctx.stroke();
        ctx.restore();
    }

    checkCollision(player) {
        // 網の中心部分（袋）に判定を絞る
        // 見た目は y-70 から y+80 くらいだが、判定は y+10 を中心に半径 50 程度にする
        const dx = this.x - player.x;
        const dy = (this.y + 10) - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (50 + player.radius); // 半径を80 -> 50に縮小
    }
}

class Squid extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 18;
        this.timer = 0;
        this.lungeTimer = Math.floor(Math.random() * 100);
        this.vx = 0;
        this.vy = 0;
        this.isSleeping = false;
    }
    update(speed, game) {
        this.x -= speed;
        this.timer += 0.05;
        this.lungeTimer++;

        // 深海では動きが鈍くなる（寝ている）
        const isDeep = game && game.score > 1000;
        if (isDeep) {
            this.isSleeping = true;
            // 地面に沈む
            const groundY = game.getGroundY(this.x);
            if (this.y < groundY - 20) {
                this.y += 0.5;
            }
            else {
                this.y = groundY - 20;
            }
            // ゆらゆら小さく
            this.y += Math.sin(this.timer) * 0.2;
            return; // ダッシュしない
        }
        else {
            this.isSleeping = false;
        }

        // 摩擦
        this.vx *= 0.95;
        this.vy *= 0.95;

        // 定期的にダッシュ（ゲッソー風）
        if (this.lungeTimer > 100) {
            this.lungeTimer = 0;
            this.vx = 4.0; // 左へ加速
            this.vy = (Math.random() - 0.5) * 8; // 上下ランダム
        }

        this.x -= this.vx;
        this.y += this.vy;

        // ダッシュしていない時はふわふわ
        if (Math.abs(this.vy) < 0.5) {
            this.y += Math.sin(this.timer) * 0.5;
        }
    }
    draw(ctx) {
        if (this.isSleeping) {
            this.drawSleeping(ctx, this.timer);
            return;
        }

        const grad = ctx.createRadialGradient(this.x, this.y - 10,
            0, this.x, this.y, 20);
        grad.addColorStop(0, '#FFF5EE');
        grad.addColorStop(1, '#FFE4E1');
        ctx.fillStyle = grad;

        // 頭（エンペラ）
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 15, 15, 20, 0, Math.PI, 0); // 上半分
        ctx.lineTo(this.x + 15, this.y);
        ctx.lineTo(this.x - 15, this.y);
        ctx.fill();

        // ヒレ
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 25);
        ctx.lineTo(this.x - 25, this.y - 15);
        ctx.lineTo(this.x - 13, this.y - 10);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - 25);
        ctx.lineTo(this.x + 25, this.y - 15);
        ctx.lineTo(this.x + 13, this.y - 10);
        ctx.fill();

        // 足（触腕）
        ctx.strokeStyle = '#FFF5EE';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        for (let i = -10; i <= 10; i += 5) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y);
            ctx.quadraticCurveTo(this.x + i + Math.sin(this.timer *
                2 + i) * 5, this.y + 15, this.x + i, this
                    .y + 30);
            ctx.stroke();
        }

        // 目
        ctx.fillStyle = this.isSleeping ? 'transparent' : 'black';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSleeping(ctx, timer) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 体 (三角形の外套膜)
        const grad = ctx.createLinearGradient(0, -15, 0, 10);
        grad.addColorStop(0, '#FFF5EE');
        grad.addColorStop(1, '#FFE4C4'); // Bisque
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -20); // 先端
        ctx.lineTo(25, 5); // 右下
        ctx.lineTo(-25, 5); // 左下
        ctx.closePath();
        ctx.fill();

        // 閉じ目
        ctx.strokeStyle = '#A0522D'; // Sienna
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 4, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();

        // Zzz...
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('z', 20, -15 + Math.sin(timer * 2) * 2);
        ctx.fillText('z', 25, -22 + Math.sin(timer * 2) * 2);

        ctx.restore();
    }
}

class Jellyfish extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 20;
        this.angle = Math.random() * Math.PI * 2;
        this.electricTimer = 0;
        this.isElectric = false;
    }
    update(speed) {
        this.x -= speed;
        this.y += Math.sin(this.angle += 0.05) * 0.5;

        // 放電サイクル
        this.electricTimer++;
        if (this.electricTimer > 120) { // 2秒周期
            this.isElectric = !this.isElectric;
            this.electricTimer = 0;
        }
    }
    draw(ctx) {
        // 傘
        ctx.fillStyle = this.isElectric ?
            'rgba(255, 255, 0, 0.6)' : 'rgba(173, 216, 230, 0.5)';
        if (this.isElectric && Math.floor(Date.now() / 50) % 2 ===
            0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // 点滅
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y - 5, 20, Math.PI, 0);
        ctx.lineTo(this.x + 20, this.y + 5);
        ctx.lineTo(this.x - 20, this.y + 5);
        ctx.fill();

        // 足
        ctx.strokeStyle = this.isElectric ? '#FFFF00' :
            'rgba(173, 216, 230, 0.8)';
        ctx.lineWidth = 2;
        for (let i = -10; i <= 10; i += 5) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y + 5);
            ctx.lineTo(this.x + i + Math.sin(this.angle + i) * 5,
                this.y + 25);
            ctx.stroke();
        }
    }
}

class ElectricEel extends Enemy {
    constructor(x, y, player) {
        super(x, y);
        this.player = player;
        this.radius = 20;
        this.speed = 4.5;
        this.angle = 0;
        this.electricTimer = 0;

        // SVGパスデータを使用した複雑な形状（S字にうねるウナギ）
        // 頭部(-50,0)から尾部(50,0)にかけての形状
        this.eelPath = new Path2D(
            "M-50,0 C-45,-15 -25,-20 0,-5 C25,10 45,10 60,-5 L62,0 C47,15 27,15 0,0 C-25,-15 -45,-10 -50,5 Z"
        );
    }
    update(baseSpeed) {
        this.x -= (baseSpeed + this.speed);
        // プレイヤーを追尾 (Y軸)
        if (this.player) {
            const dy = this.player.y - this.y;
            this.y += dy * 0.02;
        }
        // うねうね動く (角度更新)
        this.angle += 0.15;
        this.electricTimer++;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const isDischarging = Math.floor(this.electricTimer / 4) %
            2 === 0;

        // 発光エフェクト
        if (isDischarging) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#40E0D0'; // Turquoise
        }

        // 体色（暗いオリーブ〜茶色）
        const grad = ctx.createLinearGradient(-40, 0, 40, 0);
        grad.addColorStop(0, '#2F4F4F'); // DarkSlateGray
        grad.addColorStop(0.5, '#556B2F'); // DarkOliveGreen
        grad.addColorStop(1, '#8B4513'); // SaddleBrown
        ctx.fillStyle = grad;

        // 体の描画（SVGパスを変形させて描画するのは重いので、パス自体を回転・伸縮させる）
        // ここでは簡易的にY軸スケールを変えて泳いでいるように見せる
        ctx.save();
        const swimScale = 1.0 + Math.sin(this.angle) * 0.2;
        ctx.scale(1.2, 1.2 + Math.sin(this.angle) * 0.3); // 伸縮アニメーション
        ctx.fill(this.eelPath);

        // 模様（側線）
        ctx.strokeStyle = isDischarging ? 'rgba(255,255,255,0.8)' :
            'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.stroke(this.eelPath);
        ctx.restore();

        // ヒレ（背びれ・尻びれ）の放電
        if (isDischarging) {
            ctx.strokeStyle = '#E0FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            // 体に沿った稲妻
            ctx.moveTo(-40, 5);
            ctx.lineTo(-20, 15);
            ctx.lineTo(0, 5);
            ctx.lineTo(20, 15);
            ctx.lineTo(40, 5);
            ctx.stroke();
        }

        // 頭部詳細
        ctx.save();
        // 頭の位置に合わせて少し回転
        ctx.rotate(Math.sin(this.angle) * 0.1);
        // 目
        ctx.fillStyle = isDischarging ? '#FFFF00' : '#000';
        ctx.beginPath();
        ctx.arc(-42, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 放電スパーク（周囲に散らす）
        if (isDischarging) {
            ctx.strokeStyle = '#FFFACD'; // LemonChiffon
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            const sparkCount = 5;
            for (let k = 0; k < sparkCount; k++) {
                // 体のランダムな位置から
                const r = Math.random();
                const bx = -50 + r * 100;
                const by = (Math.random() - 0.5) * 20;

                ctx.moveTo(bx, by);
                let sx = bx;
                let sy = by;
                for (let j = 0; j < 4; j++) {
                    sx += (Math.random() - 0.5) * 30;
                    sy += (Math.random() - 0.5) * 30;
                    ctx.lineTo(sx, sy);
                }
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}

class Flatfish extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
        // 砂に擬態する色
        this.color = '#D2B48C';
        this.mouthOpen = 0;
    }
    draw(ctx, isBiting = false) {
        const grad = ctx.createRadialGradient(this.x, this.y, 0,
            this.x, this.y, 25);
        grad.addColorStop(0, '#E6CCB3');
        grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        // 平べったい体
        // 捕食時は少し膨らむ
        const h = isBiting ? 20 : 10;
        ctx.ellipse(this.x, this.y, 25, h, 0, 0, Math.PI * 2);
        ctx.fill();

        // 目
        // 捕食時は目がバッテンになるなどの演出も可能だが、シンプルに
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 1, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 1, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSleeping(ctx, timer) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // 体 (三角形の外套膜)
        const grad = ctx.createLinearGradient(0, -15, 0, 10);
        grad.addColorStop(0, '#FFF5EE');
        grad.addColorStop(1, '#FFE4C4'); // Bisque
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -20); // 先端
        ctx.lineTo(25, 5); // 右下
        ctx.lineTo(-25, 5); // 左下
        ctx.closePath();
        ctx.fill();

        // 閉じ目
        ctx.strokeStyle = '#A0522D'; // Sienna
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 4, Math.PI * 0.2, Math.PI * 0.8);
        ctx.stroke();

        // Zzz...
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('z', 20, -15 + Math.sin(timer * 2) * 2);
        ctx.fillText('z', 25, -22 + Math.sin(timer * 2) * 2);

        ctx.restore();
    }
}

class SeaUrchin extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
    }
    draw(ctx) {
        const grad = ctx.createRadialGradient(this.x - 3, this.y -
            3, 0, this.x, this.y, 10);
        grad.addColorStop(0, '#4F6F6F');
        grad.addColorStop(1, '#2F4F4F');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // トゲ
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(angle) * 20, this.y +
                Math.sin(angle) * 20);
            ctx.stroke();
        }
    }
}

class Octopus extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.angle = Math.random() * Math.PI * 2;
        this.moveTimer = Math.random() * 100; // 初期値をランダムにして個体差を出す
        this.isSleeping = false;
    }
    update(speed, game) {
        this.x -= speed;
        this.moveTimer += 0.1;

        const isDeep = game && game.score > 1000;
        if (isDeep) {
            this.isSleeping = true;
            // 地面に沈む
            const groundY = game.getGroundY(this.x);
            if (this.y < groundY - 25) {
                this.y += 0.5;
            }
            else {
                this.y = groundY - 25;
            }
            // 動き控えめ
            this.y += Math.sin(this.moveTimer * 0.5) * 1;
        }
        else {
            this.isSleeping = false;
            // 激しい動き: 大きなサイン波 + 小刻みな震え
            this.y += Math.sin(this.moveTimer) * 4 + Math.sin(
                this.moveTimer * 3) * 2;
        }
    }
    draw(ctx) {
        if (this.isSleeping) {
            this.drawSleeping(ctx);
            return;
        }

        const grad = ctx.createRadialGradient(this.x, this.y - 10,
            2, this.x, this.y - 5, 15);
        grad.addColorStop(0, '#E9967A');
        grad.addColorStop(1, '#CD5C5C');
        ctx.fillStyle = grad;
        // 頭
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 15, 20, 25, 0, 0, Math.PI *
            2);
        ctx.fill();

        // 足
        ctx.strokeStyle = '#CD5C5C';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const startX = this.x - 15 + i * 10;
            ctx.moveTo(startX, this.y);
            const sway = Math.sin(this.moveTimer + i) * 10;
            ctx.quadraticCurveTo(startX + sway, this.y + 20,
                startX, this.y + 40);
            ctx.stroke();

            // 吸盤
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(startX + sway * 0.5, this.y + 20, 2, 0, Math.PI *
                2);
            ctx.fill();
        }

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 10, 5, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 10, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 10, 2, 0, Math.PI * 2);
        ctx.fill();

        // 口（タコチュー）
        ctx.strokeStyle = '#8B0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, 3, 0, Math.PI * 2);
        ctx.stroke();
    }
}

class Porcupinefish extends Enemy {
    constructor(x, y, game) {
        super(x, y);
        this.radius = 20;
        this.game = game;
        this.timer = 0;
        this.hasExploded = false;
        this.scale = 1.0;
    }
    update(speed) {
        this.x -= speed;
        this.timer++;

        // 膨らむ予兆（ぷるぷる震える）
        if (!this.hasExploded && this.timer > 90 && this.timer <=
            120) {
            this.scale = 1.0 + Math.sin((this.timer - 90) * 0.8) *
                0.1;
        }

        // 一定時間経過で針を飛ばす
        if (!this.hasExploded && this.timer > 120 && this.x <
            this.game.width - 50) {
            this.explode();
            this.hasExploded = true;
            this.scale = 0.9; // 爆発後は少ししぼむ
        }
    }
    explode() {
        // 8方向に針を発射
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            this.game.enemies.push(new Needle(this.x, this.y,
                Math.cos(angle) * 4, Math.sin(angle) * 4));
        }
    }
    draw(ctx) {
        const r = this.hasExploded ? 18 : 22;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        // 灰色ベースのボディ
        const grad = ctx.createRadialGradient(-5, -5, 2, 0, 0, r);
        grad.addColorStop(0, '#D3D3D3'); // LightGray
        grad.addColorStop(1, '#696969'); // DimGray
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // 目（怒った感じ）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(-8, -5, 5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(8, -5, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-8, -5, 2, 0, Math.PI * 2);
        ctx.arc(8, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        // 眉毛
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -10);
        ctx.lineTo(-4, -7);
        ctx.moveTo(12, -10);
        ctx.lineTo(4, -7);
        ctx.stroke();

        // 口
        ctx.beginPath();
        ctx.arc(0, 5, 3, 0, Math.PI, false);
        ctx.stroke();

        // トゲ（通常時は短く、爆発時は無い（Needleになる））
        if (!this.hasExploded) {
            ctx.fillStyle = '#808080';
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 / 12) * i;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) *
                    r);
                ctx.lineTo(Math.cos(angle) * (r + 6), Math.sin(
                    angle) * (r + 6));
                ctx.lineTo(Math.cos(angle + 0.2) * r, Math.sin(
                    angle + 0.2) * r);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

class Crab extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 18;
        this.walkTimer = 0;
    }
    update(speed, game) {
        this.x -= speed + 0.5; // 少し歩く
        this.walkTimer += 0.2;
        // 地面に接地
        if (game) {
            this.y = game.getGroundY(this.x) - 15;
        }
    }
    draw(ctx) {
        ctx.fillStyle = '#FF6347'; // Tomato
        // 甲羅
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 15, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 15, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 15, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + 8, this.y - 15, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // 目の茎
        ctx.strokeStyle = '#FF6347';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x - 8, this.y - 5);
        ctx.lineTo(this.x - 8, this.y - 15);
        ctx.moveTo(this.x + 8, this.y - 5);
        ctx.lineTo(this.x + 8, this.y - 15);
        ctx.stroke();

        // ハサミ（動く）
        const armY = this.y + Math.sin(this.walkTimer) * 3;
        ctx.fillStyle = '#DC143C';
        ctx.beginPath();
        ctx.ellipse(this.x - 25, armY, 8, 5, -0.5, 0, Math.PI * 2);
        ctx.ellipse(this.x + 25, armY, 8, 5, 0.5, 0, Math.PI * 2);
        ctx.fill();

        // 足
        ctx.strokeStyle = '#FF6347';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            const legX = (i - 1) * 10;
            const legY = Math.abs(Math.sin(this.walkTimer + i)) *
                5;
            ctx.beginPath();
            ctx.moveTo(this.x + legX, this.y + 5);
            ctx.lineTo(this.x + legX * 1.5, this.y + 15 - legY);
            ctx.stroke();
        }
    }
}

class SeaAnemone extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
        this.timer = Math.random() * 100;
        this.color = ['#FF69B4', '#DA70D6', '#FFB6C1'][Math.floor(
            Math.random() * 3)];
    }
    update(speed) {
        this.x -= speed;
        this.timer += 0.05;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        // 本体
        ctx.beginPath();
        ctx.fillRect(this.x - 10, this.y - 10, 20, 10);

        // 触手
        ctx.lineWidth = 3;
        ctx.strokeStyle = this.color;
        ctx.lineCap = 'round';
        for (let i = -8; i <= 8; i += 4) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y - 10);
            const sway = Math.sin(this.timer + i) * 5;
            ctx.quadraticCurveTo(this.x + i + sway, this.y - 20,
                this.x + i + sway * 0.5, this.y - 25);
            ctx.stroke();
        }
    }
}

class Starfish extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
        this.angle = Math.random() * Math.PI * 2;
        this.color = ['#FFD700', '#FFA500', '#FF4500'][Math.floor(
            Math.random() * 3)];
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = this.color;

        // 星型を描画
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) *
                15, -Math.sin((18 + i * 72) * Math.PI / 180) *
            15);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) *
                6, -Math.sin((54 + i * 72) * Math.PI / 180) *
            6);
        }
        ctx.closePath();
        ctx.fill();

        // 模様
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Needle extends Enemy {
    constructor(x, y, vx, vy) {
        super(x, y);
        this.vx = vx;
        this.vy = vy;
        this.radius = 5;
    }
    update(speed) {
        this.x += this.vx; // 画面スクロールの影響を受けない（相対速度ではない）
        this.x -= speed; // スクロール分も引く
        this.y += this.vy;
    }
    draw(ctx) {
        ctx.strokeStyle = '#696969';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
        ctx.stroke();
    }
}

class Whirlpool extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 35;
        this.angle = 0;
    }
    update(speed) {
        this.x -= speed;
        this.angle += 0.2;
    }
    draw(ctx) {
        // ソフトクリームのような渦潮
        ctx.strokeStyle = 'rgba(224, 255, 255, 0.8)'; // LightCyan
        ctx.lineWidth = 1;
        ctx.beginPath();

        const segments = 50;
        for (let i = 0; i < segments; i++) {
            const ratio = i / segments;
            const radius = (1 - ratio) * this.radius;
            const angle = this.angle + i * 0.5;
            const x = this.x + Math.cos(angle) * radius;
            const y = this.y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // 中心
        ctx.fillStyle = 'rgba(0, 0, 139, 0.5)'; // DarkBlue
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Whale extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 150; // さらに大きく
        this.timer = 0;
        this.attackTimer = 0;
        this.isSucking = false;
        this.suckTimer = 0;

        // 複数のSVGパスを組み合わせるイメージで、Path2Dを複数使用
        this.headPath = new Path2D(
            "M-130,-50 C-140,-20 -140,20 -130,50 L-80,50 C-70,0 -80,-50 -130,-50 Z"
        );
        this.bodyPath = new Path2D(
            "M-80,50 C0,70 100,60 150,10 L150,-10 C100,-60 0,-50 -80,-50 Z"
        );
        this.tailPath = new Path2D(
            "M150,0 L190,-40 C180,0 190,40 150,0 Z");
        this.jawPath = new Path2D(
            "M-130,30 C-100,40 -80,40 -70,35 L-70,50 L-130,50 Z"
        );
    }
    update(speed, game) {
        // ボスはゆっくり迫ってくる
        this.x -= speed * 0.8; // さらに速く
        this.y += Math.sin(this.timer += 0.02) * 0.5;

        // 潮吹き攻撃
        this.attackTimer++;
        if (this.attackTimer > 180) { // 約3秒ごと
            this.attackTimer = 0;
            // 背中あたりから潮吹き
            game.enemies.push(new WaterSpout(this.x - 80, this.y -
                50));

            // 水滴をばら撒く
            for (let i = 0; i < 5; i++) {
                const vx = (Math.random() - 0.8) * 10; // 左方向に飛ばす
                const vy = -Math.random() * 15 - 5; // 上に強く飛ばす
                game.enemies.push(new WaterDrop(this.x - 80, this
                    .y - 50, vx, vy));
            }
        }
    }
    isOffScreen(w, h) {
        return this.x < -500;
    }

    draw(ctx) {
        if (!isFinite(this.x) || !isFinite(this.y)) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 2.0; // 巨大化
        ctx.scale(scale, scale);

        // 色の定義
        const bodyGrad = ctx.createLinearGradient(-100, -50, 100,
            50);
        bodyGrad.addColorStop(0, '#607D8B'); // Blue Grey
        bodyGrad.addColorStop(1, '#37474F'); // Darker Blue Grey
        const bellyColor = '#B0BEC5';

        // 尾
        ctx.fillStyle = bodyGrad;
        ctx.fill(this.tailPath);

        // 体
        ctx.fillStyle = bodyGrad;
        ctx.fill(this.bodyPath);

        // 頭
        ctx.fillStyle = bodyGrad;
        ctx.fill(this.headPath);

        // 下顎
        ctx.save();
        if (this.isSucking) {
            const openAngle = Math.min(0.4, this.suckTimer * 0.01);
            ctx.translate(-70, 50);
            ctx.rotate(openAngle);
            ctx.translate(70, -50);
        }
        ctx.fillStyle = bellyColor;
        ctx.fill(this.jawPath);
        ctx.restore();

        // 目
        ctx.fillStyle = '#101010';
        ctx.beginPath();
        ctx.arc(-100, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // 吸い込みエフェクト
        if (this.isSucking) {
            const mouthX = -130;
            const mouthY = 40;
            for (let i = 0; i < 10; i++) {
                const angle = Math.random() * Math.PI - Math.PI /
                    2;
                const dist = Math.random() * 200;
                const particleX = mouthX + Math.cos(angle) * dist;
                const particleY = mouthY + Math.sin(angle) * dist;

                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(particleX, particleY);
                ctx.lineTo(particleX + (mouthX - particleX) * 0.1,
                    particleY + (mouthY - particleY) * 0.1);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

class Architeuthis extends Enemy {
    constructor(x, y, game) {
        super(x, y);
        this.radius = 120;
        this.game = game;
        this.timer = 0;
        this.attackTimer = 0;

        // 巨大な外套膜とヒレのパス
        // 左向き（頭が左、ヒレが右）
        // (0,0)を中心とする
        this.bodyPath = new Path2D();
        // 外套膜（よりリアルな流線型）
        this.bodyPath.moveTo(0, -35);
        this.bodyPath.bezierCurveTo(80, -50, 180, -40, 220, -10); // 背中
        // ヒレ（ハート型に近い）
        this.bodyPath.bezierCurveTo(260, -60, 300, 0, 220, 10);
        // 腹側
        this.bodyPath.bezierCurveTo(180, 40, 80, 50, 0, 35);
        this.bodyPath.closePath();
    }
    update(speed, game) {
        // ゆっくり迫る
        this.x -= speed * 0.6;
        this.y += Math.sin(this.timer += 0.02) * 0.5;

        // 触手攻撃
        this.attackTimer++;
        if (this.attackTimer > 180) { // 3秒ごと（少し遅く）
            this.attackTimer = 0;
            // プレイヤーを狙う触手を生成
            // 画面外（右下や右上）から伸びてくるイメージ
            const targetY = game.player.y;
            game.enemies.push(new GiantTentacle(this.x - 60, this
                .y, targetY));
        }
    }
    isOffScreen(w, h) {
        return this.x < -500;
    }
    draw(ctx) {
        if (!isFinite(this.x) || !isFinite(this.y)) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = 1.5;
        ctx.scale(scale, scale);

        // 色: 深紅〜赤紫
        const grad = ctx.createLinearGradient(0, -50, 200, 50);
        grad.addColorStop(0, '#8B0000'); // DarkRed
        grad.addColorStop(1, '#C71585'); // MediumVioletRed
        // 質感を追加
        ctx.fillStyle = grad;

        // 外套膜描画
        ctx.fill(this.bodyPath);

        // 斑点模様
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.arc(50 + Math.random() * 150, (Math.random() -
                0.5) * 60, Math.random() * 5 + 2, 0, Math
                    .PI * 2);
            ctx.fill();
        }

        // 腕（触腕以外の8本）の付け根
        // 頭部より先に描画するか、位置を調整して自然につなげる
        ctx.fillStyle = '#8B0000';
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue; // 中央は空ける
            ctx.beginPath();
            // 頭部の内側から生やす
            ctx.moveTo(-40, i * 6);
            // うねる腕
            ctx.bezierCurveTo(-80, i * 10, -90, i * 15, -120, i *
                12 + (Math.random() - 0.5) * 10);
            ctx.lineTo(-115, i * 12 + 4);
            ctx.bezierCurveTo(-90, i * 15 + 4, -80, i * 10 + 4, -
                40, i * 6 + 4);
            ctx.fill();
        }

        // 頭部（目と腕の付け根）- 胴体と滑らかにつなぐ
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.ellipse(-30, 0, 45, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        // 巨大な目
        const eyeGrad = ctx.createRadialGradient(-40, -5, 2, -40, -
            5, 15);
        eyeGrad.addColorStop(0, '#FFFFE0');
        eyeGrad.addColorStop(0.5, '#FFD700');
        eyeGrad.addColorStop(1, '#DAA520');
        ctx.fillStyle = eyeGrad;
        ctx.beginPath();
        ctx.arc(-40, -5, 14, 0, Math.PI * 2);
        ctx.fill();
        // 瞳孔
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-40, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        // 目のハイライト
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-45, -10, 4, 0, Math.PI * 2);
        ctx.fill();

        // 漏斗（水を吹く管）
        ctx.fillStyle = '#A52A2A';
        ctx.beginPath();
        ctx.moveTo(-20, 25);
        ctx.quadraticCurveTo(-30, 40, -40, 35);
        ctx.lineTo(-35, 25);
        ctx.fill();

        ctx.restore();
    }
}

class GiantTentacle extends Enemy {
    constructor(x, y, targetY) {
        super(x, y);
        this.radius = 15;
        this.targetY = targetY;
        this.life = 100;
        this.length = 10;
        this.maxLength = 400;
        this.angle = Math.atan2(targetY - y, -200); // 左方向へ伸ばす
    }
    update(speed) {
        this.x -= speed; // 本体と一緒に動く
        if (this.life > 50) {
            this.length += 15; // 伸びる
            if (this.length > this.maxLength) this.length = this.maxLength;
        }
        else {
            this.length -= 15; // 縮む
        }
        this.life--;
        if (this.life <= 0) this.markedForDeletion = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // 触手
        const grad = ctx.createLinearGradient(0, 0, this.length,
            0); // 根本から先端へ
        grad.addColorStop(0, '#8B0000');
        grad.addColorStop(1, '#C71585'); // 本体と同じ色味に
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.moveTo(0, -8);
        // うねりながら伸びる
        for (let i = 0; i <= this.length; i += 20) {
            const w = 8 * (1 - i / this.maxLength * 0.5); // 先細り
            const wave = Math.sin(i * 0.05 + Date.now() * 0.01) *
                10;
            ctx.lineTo(i, -w + wave);
        }
        for (let i = this.length; i >= 0; i -= 20) {
            const w = 8 * (1 - i / this.maxLength * 0.5);
            const wave = Math.sin(i * 0.05 + Date.now() * 0.01) *
                10;
            ctx.lineTo(i, w + wave);
        }
        ctx.fill();

        // 吸盤
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        for (let i = 20; i < this.length; i += 30) {
            const wave = Math.sin(i * 0.05 + Date.now() * 0.01) *
                10;
            ctx.beginPath();
            // 下側に吸盤をつける
            const w = 8 * (1 - i / this.maxLength * 0.5);
            ctx.arc(i, wave + w, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
    checkCollision(player) {
        // 簡易的に先端付近に判定を持つ
        const tipX = this.x + Math.cos(this.angle) * this.length;
        const tipY = this.y + Math.sin(this.angle) * this.length;
        const dx = tipX - player.x;
        const dy = tipY - player.y;
        // 触手の先端から少し手前まで判定を持たせる
        return Math.sqrt(dx * dx + dy * dy) < (30 + player.radius);
    }
}

class WaterSpout extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 30;
        this.life = 60; // 1秒間持続
        this.maxHeight = 300;
        this.currentHeight = 0;
    }
    update(speed) {
        this.x -= speed * 0.8; // クジラと同じ速度で動く
        this.life--;
        if (this.life > 40) {
            this.currentHeight += 20; // 伸びる
        }
        else if (this.life < 20) {
            this.currentHeight -= 20; // 縮む
        }
        // 寿命が尽きたら画面外へ飛ばして削除させる
        if (this.life <= 0) this.y = 9999;
    }
    draw(ctx) {
        const grad = ctx.createLinearGradient(this.x - 20, this.y,
            this.x + 20, this.y - this.currentHeight);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        grad.addColorStop(1, 'rgba(173, 216, 230, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y);
        ctx.lineTo(this.x - 30, this.y - this.currentHeight);
        ctx.lineTo(this.x + 30, this.y - this.currentHeight);
        ctx.lineTo(this.x + 10, this.y);
        ctx.fill();
    }
    checkCollision(player) {
        // 矩形判定
        if (player.x > this.x - 30 && player.x < this.x + 30) {
            if (player.y > this.y - this.currentHeight && player.y <
                this.y) {
                return true;
            }
        }
        return false;
    }
}

class WaterDrop extends Enemy {
    constructor(x, y, vx, vy) {
        super(x, y);
        this.vx = vx;
        this.vy = vy;
        this.radius = 8;
    }
    update(speed) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.5; // 重力
        this.x -= speed;
    }
    draw(ctx) {
        ctx.fillStyle = '#87CEFA';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Shipwreck {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    update(scrollSpeed) {
        this.x -= scrollSpeed * 0.5; // パララックス
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(20, 10, 0, 0.4)'; // 暗い茶色のシルエット
        // 船の形
        ctx.beginPath();
        ctx.moveTo(-100, 0);
        ctx.lineTo(-80, -40); // 船尾
        ctx.lineTo(60, -30); // 甲板
        ctx.lineTo(100, -10); // 船首（折れてる）
        ctx.lineTo(80, 20); // 船底
        ctx.lineTo(-90, 20);
        ctx.fill();

        // マスト（折れてる）
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(20, 10, 0, 0.4)';
        ctx.beginPath();
        ctx.moveTo(-20, -35);
        ctx.lineTo(-10, -80);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-10, -60);
        ctx.lineTo(20, -50); // 横木
        ctx.stroke();

        ctx.restore();
    }
}

class Pearl {
    constructor(x, y, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 15;
    }
    update(speed, game) {
        this.x -= speed;
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= 0.95; // 摩擦
        this.vy *= 0.95;

        if (game) {
            const floorY = game.getGroundY(this.x) - 15; // 半径分引く
            if (this.y < floorY) {
                this.vy += 0.2; // 重力
            }
            else if (this.y > floorY) {
                this.y = floorY;
                this.vy = -this.vy * 0.6; // バウンド
                if (Math.abs(this.vy) < 1) this.vy = 0;
            }
        }
    }
    isOffScreen() {
        return this.x < -50;
    }
    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius +
            player.radius);
    }
    draw(ctx) {
        // 貝殻
        const shellGrad = ctx.createLinearGradient(this.x, this.y,
            this.x, this.y + 20);
        shellGrad.addColorStop(0, '#FFC0CB'); // Pink
        shellGrad.addColorStop(1, '#DB7093'); // PaleVioletRed
        ctx.fillStyle = shellGrad;

        // 下の貝
        ctx.beginPath();
        ctx.arc(this.x, this.y + 10, 15, 0, Math.PI, false);
        ctx.fill();
        // 上の貝（開いている）
        ctx.beginPath();
        ctx.arc(this.x, this.y + 10, 15, Math.PI, 0, false);
        ctx.fill();

        // 蝶番
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.fillRect(this.x - 3, this.y + 22, 6, 4);
        ctx.fill();

        // 真珠
        const pearlGrad = ctx.createRadialGradient(this.x - 2,
            this.y + 8, 1, this.x, this.y + 10, 8);
        pearlGrad.addColorStop(0, '#FFFFFF');
        pearlGrad.addColorStop(1, '#F0F8FF');
        ctx.fillStyle = pearlGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y + 10, 8, 0, Math.PI * 2);
        ctx.fill();
        // 真珠の輝き
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y + 3, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class TreasureChest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
    }
    update(speed, game) {
        this.x -= speed;
        if (game) {
            const groundY = game.getGroundY(this.x);
            this.y = groundY - 20;
        }
    }
    isOffScreen() {
        return this.x < -50;
    }
    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius +
            player.radius);
    }
    draw(ctx) {
        // 箱
        ctx.fillStyle = '#8B4513'; // SaddleBrown
        ctx.fillRect(this.x - 20, this.y - 15, 40, 30);

        // 蓋のライン
        ctx.fillStyle = '#A0522D'; // Sienna
        ctx.fillRect(this.x - 20, this.y - 15, 40, 10);

        // 金具
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.fillRect(this.x - 5, this.y - 5, 10, 10); // 鍵穴
        ctx.fillRect(this.x - 20, this.y - 15, 40, 4); // 上の縁
        ctx.fillRect(this.x - 20, this.y + 11, 40, 4); // 下の縁
        ctx.fillRect(this.x - 20, this.y - 15, 4, 30); // 左の縁
        ctx.fillRect(this.x + 16, this.y - 15, 4, 30); // 右の縁

        // 輝き
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.moveTo(this.x - 15, this.y - 10);
        ctx.lineTo(this.x - 5, this.y - 10);
        ctx.lineTo(this.x - 15, this.y + 10);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Plankton {
    constructor(x, y, vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 8;
        this.angle = Math.random() * Math.PI * 2;
    }
    update(speed) {
        this.x -= speed;
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95;
        this.vy *= 0.95;
        this.y += Math.sin(this.angle += 0.1) * 0.5; // ふわふわ
    }
    isOffScreen() {
        return this.x < -50;
    }
    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius +
            player.radius);
    }
    draw(ctx) {
        // プランクトン（微生物風デザイン）
        ctx.fillStyle = 'rgba(152, 251, 152, 0.4)'; // PaleGreen, translucent
        ctx.beginPath();
        // 少し歪んだ円
        const r = this.radius;
        ctx.moveTo(this.x + r, this.y);
        for (let i = 1; i <= 8; i++) {
            const angle = i * Math.PI / 4;
            const dist = r + Math.sin(Date.now() / 200 + i * 2) *
                2;
            ctx.lineTo(this.x + Math.cos(angle) * dist, this.y +
                Math.sin(angle) * dist);
        }
        ctx.closePath();
        ctx.fill();

        // 核
        ctx.fillStyle = '#32CD32'; // LimeGreen
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // 内部の粒
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(this.x + (Math.random() - 0.5) * 6, this.y +
                (Math.random() - 0.5) * 6, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 5;
        ctx.shadowColor = '#90EE90';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class FriendShrimp extends Plankton {
    constructor(x, y) {
        super(x, y);
        this.radius = 12;
    }
    draw(ctx) {
        // アイテムとしての仲間エビもエビらしい見た目に
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#FFB6C1'; // LightPink

        // 体
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 節
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(-3, -2, 3, 0, Math.PI, false);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(3, -2, 3, 0, Math.PI, false);
        ctx.fill();

        // 尻尾
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-16, 5);
        ctx.lineTo(-16, -5);
        ctx.fill();

        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(8, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Seaweed {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.height = Math.random() * 100 + 80; // 大きくする
        this.swayOffset = Math.random() * Math.PI * 2;
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx, frameCount) {
        const sway = Math.sin(frameCount * 0.05 + this.swayOffset) *
            20;
        ctx.strokeStyle = '#2E8B57'; // SeaGreen
        ctx.lineWidth = 10; // 太くする
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.quadraticCurveTo(this.x + sway, this.y - this.height /
            2, this.x + sway * 0.5, this.y - this.height);
        ctx.stroke();
    }
}

class RuggedTerrain {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = Math.random() * 300 + 250; // 幅を大きく
        this.baseHeight = Math.random() * 200 + 100; // 高さを大きく
        this.points = [];
        // 相対座標でポイントを生成（リプレイ時の描画崩れ防止）
        const segments = 10;
        for (let i = 0; i <= segments; i++) {
            const px = (i / segments) * this.width; // xは0からの相対
            const py = this.y - this.baseHeight - (Math.random() -
                0.5) * 80;
            this.points.push(
                {
                    x: px,
                    y: py - this.y
                }); // yもthis.yからの相対
        }
    }
    update(speed, game) {
        this.x -= speed;
        // pointsは相対座標なので更新不要
    }
    draw(ctx) {
        const grad = ctx.createLinearGradient(this.x, this.y -
            this.baseHeight, this.x, this.y);
        grad.addColorStop(0, '#606060');
        grad.addColorStop(1, '#404040');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.x + this.points[0].x, this.y);
        this.points.forEach(p => ctx.lineTo(this.x + p.x, this.y +
            p.y));
        ctx.lineTo(this.x + this.points[this.points.length - 1].x,
            this.y);
        ctx.fill();

        // ハイライト
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x + this.points[0].x, this.y + this.points[
            0].y);
        for (let i = 1; i < this.points.length; i++) {
            // 上向きの辺にのみハイライト
            if (this.points[i].y < this.points[i - 1].y) {
                ctx.moveTo(this.x + this.points[i - 1].x, this.y +
                    this.points[i - 1].y);
                ctx.lineTo(this.x + this.points[i].x, this.y +
                    this.points[i].y);
            }
        }
        ctx.stroke();
    }

    getSurfaceInfo(x) {
        // xは絶対座標
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1x = this.x + this.points[i].x;
            const p2x = this.x + this.points[i + 1].x;

            if (x >= p1x && x <= p2x) {
                const ratio = (x - p1x) / (p2x - p1x);
                const p1y = this.y + this.points[i].y;
                const p2y = this.y + this.points[i + 1].y;

                const y = p1y + (p2y - p1y) * ratio;
                const slope = (p2y - p1y) / (p2x - p1x);
                return {
                    y: y,
                    slope: slope
                };
            }
        }
        return null;
    }

    checkSideCollision(player) {
        // 左側面との衝突判定
        const leftEdgeTop = {
            x: this.x + this.points[0].x,
            y: this.y + this.points[0].y
        };
        const leftEdgeBottom = {
            x: this.x + this.points[0].x,
            y: this.y
        };
        const dist = this.distToSegment(player, leftEdgeTop,
            leftEdgeBottom);
        return dist < player.radius;
    }

    distToSegment(p, v, w) {
        const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
        if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y -
            v.y) ** 2);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y -
            v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (
            p.y - (v.y + t * (w.y - v.y))) ** 2);
    }
}

class Coral {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.color = ['#CD5C5C', '#B22222', '#8B4513'][Math.floor(
            Math.random() * 3)];
        this.branches = [];
        // 枝分かれしたサンゴ
        for (let i = 0; i < 8; i++) {
            const h = Math.random() * 50 + 30;
            const angle = (Math.random() - 0.5) * 1.0; // 傾き
            this.branches.push(
                {
                    x: (Math.random() - 0.5) * 40,
                    h: h,
                    w: Math.random() * 8 + 4,
                    angle: angle
                });
        }
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        this.branches.forEach(b => {
            ctx.beginPath();
            ctx.save();
            ctx.translate(this.x + b.x, this.y);
            ctx.rotate(b.angle);
            ctx.roundRect(-b.w / 2, -b.h, b.w, b.h, b.w /
                2);
            ctx.fill();
            ctx.restore();
        });
        // 背景として馴染ませる
        ctx.fillStyle = 'rgba(0, 20, 40, 0.2)';
        this.branches.forEach(b => {
            ctx.beginPath();
            ctx.save();
            ctx.translate(this.x + b.x, this.y);
            ctx.rotate(b.angle);
            ctx.roundRect(-b.w / 2, -b.h, b.w, b.h, b.w /
                2);
            ctx.fill();
            ctx.restore();
        });
    }
}

class Clownfish {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.angle = 0;
    }
    update(speed) {
        this.x -= speed;
        this.y += Math.sin(this.angle += 0.1) * 0.5;
    }
    isOffScreen() {
        return this.x < -50;
    }
    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius +
            player.radius);
    }
    draw(ctx) {
        // カクレクマノミ（オレンジに白帯）
        ctx.fillStyle = '#FF4500'; // OrangeRed
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, 15, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 白帯
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.fillRect(this.x - 5, this.y - 7, 3, 14);
        ctx.fillRect(this.x + 3, this.y - 6, 3, 12);
        ctx.fill();

        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 8, this.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class GardenEel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.height = 30;
    }
    update(speed) {
        this.x -= speed;
    }
    isOffScreen() {
        return this.x < -50;
    }
    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = (this.y - 15) - player.y; // 当たり判定は頭付近
        return Math.sqrt(dx * dx + dy * dy) < (this.radius +
            player.radius);
    }
    draw(ctx) {
        // チンアナゴ（白に黒点）
        ctx.fillStyle = '#F0F8FF'; // AliceBlue
        ctx.beginPath();
        ctx.roundRect(this.x - 4, this.y - this.height, 8, this.height,
            4);
        ctx.fill();

        // 黒点
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x, this.y - 20, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x, this.y - 10, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 26, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Bubble {
    constructor(x, y, isBackground = false) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.isBackground = isBackground;

        if (isBackground) {
            this.life = Math.random() * 0.5 + 0.1; // 背景用は薄く
            this.decay = 0.002 + Math.random() * 0.003; // 長持ち
            this.vy = Math.random() * 1.5 + 0.5; // 上昇速度
            this.vxFactor = 0.1; // スクロール影響少なめ（遠景感）
        }
        else {
            this.life = 1.0;
            this.decay = 0.02;
            this.vy = 1;
            this.vxFactor = 0.5;
        }
    }
    update(speed) {
        this.x -= speed * this.vxFactor;
        this.y -= this.vy;
        this.life -= this.decay;
    }
    draw(ctx) {
        ctx.fillStyle =
            `rgba(255, 255, 255, ${Math.max(0, this.life)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class StreamLine {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.length = Math.random() * 100 + 50;
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y);
        ctx.stroke();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 1.0;
        this.vy = -1.5;
    }
    update() {
        this.y += this.vy;
        this.life -= 0.02;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = 'bold 24px "M PLUS Rounded 1c", sans-serif';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

// ゲーム開始
window.onload = () => new Game();
