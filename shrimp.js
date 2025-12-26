import { CONSTANTS } from './constants.js';
import { RuggedTerrain } from './objects.js';

/**
 * キャラクタークラス: えびちゃん
 */
export class Shrimp {
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
        this.bonusEffectTimer = 0; // スイムボーナスエフェクト用
        this.framesSinceLastJump = 60; // ジャンプ間隔計測用
    }

    jump() {
        // リズムよく泳ぐと前進する（スイムボーナス）
        // 前回のジャンプから一定時間内（約0.25秒〜0.75秒）に再ジャンプした場合
        if (this.framesSinceLastJump > 15 && this.framesSinceLastJump < 45) {
            this.vx = 2.5; // 前進
            this.vy = CONSTANTS.JUMP_FORCE_Y * 1.1; // 少し高く跳ぶ
            this.bonusEffectTimer = 20; // エフェクト表示時間
        } else {
            // 通常: 後方＋上方向へ跳ねる
            this.vy = CONSTANTS.JUMP_FORCE_Y;
            this.vx = CONSTANTS.JUMP_FORCE_X;
        }

        this.isBending = true;
        this.bendTimer = 15; // 変形持続フレーム
        this.recoveryBoostTimer = 30; // 泳ぎブースト
        this.framesSinceLastJump = 0;
    }

    setInvincible(frames) {
        this.invincibleTimer = frames;
    }

    update(game) {
        const screenWidth = game.width;
        this.framesSinceLastJump++;

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

        // 左端判定（ゲームオーバー）
        if (this.x < -this.radius) {
            game.gameOver("波にさらわれた");
            return;
        }

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
        if (this.bonusEffectTimer > 0) {
            this.bonusEffectTimer--;
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

        // スイムボーナスエフェクト（加速時のキラキラ）
        if (this.bonusEffectTimer > 0) {
            ctx.save();
            ctx.globalAlpha = this.bonusEffectTimer / 20;
            ctx.fillStyle = '#FFFACD'; // LemonChiffon
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'white';

            // 広がるリング
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * (1.5 + (20 - this.bonusEffectTimer) * 0.1), 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 200, ${this.bonusEffectTimer / 20})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 星や光の粒を描画
            for(let i=0; i<3; i++) {
                const angle = (Date.now() / 100 + i * 2);
                const dist = this.radius * 1.5;
                const ex = Math.cos(angle) * dist;
                const ey = Math.sin(angle) * dist;
                ctx.beginPath();
                ctx.arc(ex, ey, 3, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.restore();
        }

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
