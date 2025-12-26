import { Shipwreck, RuggedTerrain } from './objects.js';

/**
 * 敵クラス群
 */
export class Enemy {
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

export class Fish extends Enemy {
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

export class Sardine extends Enemy {
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

export class Tuna extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.speed = 8.0; // 少し遅くした
    }
    update(baseSpeed, game) {
        const speedMultiplier = game.width < 600 ? 0.8 : 1.0; // スマホではさらに遅く
        this.x -= (baseSpeed + this.speed * speedMultiplier);
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
            ctx.moveTo(this.x + 15 + i * 5, this.y - 22 + i * 3);
            ctx.lineTo(this.x + 18 + i * 5, this.y - 28 + i * 3);
            ctx.lineTo(this.x + 21 + i * 5, this.y - 21 + i * 3);
            ctx.fill();
            // 腹側
            ctx.beginPath();
            ctx.moveTo(this.x + 15 + i * 5, this.y + 22 - i * 3);
            ctx.lineTo(this.x + 18 + i * 5, this.y + 28 - i * 3);
            ctx.lineTo(this.x + 21 + i * 5, this.y + 21 - i * 3);
            ctx.fill();
        }

        // 第2背びれ・尻びれ（鎌状）
        ctx.fillStyle = '#191970'; // 濃紺
        ctx.beginPath();
        ctx.moveTo(this.x - 10, this.y - 25); // さらに左へ修正
        ctx.quadraticCurveTo(this.x, this.y - 45, this.x +
            10, this.y - 20);
        ctx.lineTo(this.x + 5, this.y - 25);
        ctx.fill();
        ctx.fillStyle = '#F0F8FF'; // 白っぽい
        ctx.beginPath();
        ctx.moveTo(this.x - 5, this.y + 25); // 左へ修正
        ctx.quadraticCurveTo(this.x + 5, this.y + 45, this.x +
            15, this.y + 22);
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

export class Shark extends Enemy {
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

export class Anglerfish extends Enemy {
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

export class Hook extends Enemy {
    constructor(x, y) {
        // 画面右側に出現させる
        super(x * 0.8 + Math.random() * (x * 0.2), y);
        this.radius = 10;
        this.vy = 4.5; // 落下速度アップ
        this.isOnRock = false;
    }
    update(speed, game) {
        this.x -= speed; // スクロールに合わせて移動
        this.y += this.vy; // 上から下へ

        if (game) {
            let limitY = game.getGroundY(this.x);
            this.isOnRock = false;

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
                        this.isOnRock = true;
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

        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.isOnRock) {
            ctx.rotate(Math.PI / 4); // 岩の上なら傾ける
        }

        // 針のJの字
        ctx.beginPath();
        ctx.arc(-5, 0, 10, 0, Math.PI, false);
        ctx.stroke();
        ctx.restore();
    }
}

export class Net extends Enemy {
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

export class Squid extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 18;
        this.timer = 0;
        this.lungeTimer = Math.floor(Math.random() * 100);
        this.vx = 0;
        this.vy = 0;
        this.isSleeping = false;
        this.attackTelegraphTimer = 0;
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

        this.x -= this.vx;
        this.y += this.vy;

        // ダッシュしていない時はふわふわ
        this.y += Math.sin(this.timer) * 0.5;
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

        // 体（三角形の外套膜）
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 25); // 頭頂部
        ctx.lineTo(this.x + 12, this.y + 5);
        ctx.lineTo(this.x - 12, this.y + 5);
        ctx.fill();

        // 足（触腕）- 復活
        ctx.strokeStyle = '#FFF5EE';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for(let i=-2; i<=2; i++) {
            ctx.beginPath();
            ctx.moveTo(this.x + i*4, this.y);
            ctx.quadraticCurveTo(this.x + i*6, this.y + 10, this.x + i*2, this.y + 20);
            ctx.stroke();
        }

        // ヒレ（エンペラ）- ひし形っぽく
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 28);
        ctx.lineTo(this.x + 18, this.y - 15);
        ctx.lineTo(this.x, this.y - 5);
        ctx.lineTo(this.x - 18, this.y - 15);
        ctx.closePath();
        ctx.fill();

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
        ctx.ellipse(0, 10, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 体 (三角形の外套膜)
        const grad = ctx.createLinearGradient(-15, 0, 15, 0);
        grad.addColorStop(0, '#FFF5EE');
        grad.addColorStop(1, '#FFE4C4'); // Bisque
        ctx.fillStyle = grad;
        
        // 少し傾けて寝かせる
        ctx.rotate(-Math.PI / 6);

        // 外套膜
        ctx.beginPath();
        ctx.moveTo(0, -25); // 頭頂部
        ctx.lineTo(12, 5);
        ctx.lineTo(-12, 5);
        ctx.fill();

        // 足（だらんと）
        ctx.strokeStyle = '#FFE4C4';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        for(let i=-2; i<=2; i++) {
            ctx.beginPath();
            ctx.moveTo(i*3, 10);
            ctx.quadraticCurveTo(i*5, 20, i*2, 25);
            ctx.stroke();
        }

        // ヒレ
        ctx.fillStyle = '#FFE4C4';
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.lineTo(18, -15);
        ctx.lineTo(0, -5);
        ctx.lineTo(-18, -15);
        ctx.closePath();
        ctx.fill();

        // 閉じ目
        ctx.strokeStyle = '#A0522D'; // Sienna
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-5, 0, 3, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(5, 0, 3, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        // 鼻提灯（タコ参考）
        const t = timer;
        const cycle = t * 0.05;
        const phase = cycle % (Math.PI * 2);
        
        if (phase < Math.PI * 1.8) {
            // 膨らむ
            const bubbleSize = 2 + (1 - Math.cos(phase * 0.55)) * 6;
            if (bubbleSize > 2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(0, -5, bubbleSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.stroke();
                // ハイライト
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(0 - bubbleSize * 0.3, -5 - bubbleSize * 0.3, bubbleSize * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // 破裂
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for(let i=0; i<3; i++) {
                const angle = (Math.PI * 2 / 3) * i;
                const dist = 8;
                ctx.beginPath();
                ctx.arc(Math.cos(angle)*dist, -5 + Math.sin(angle)*dist, 1.5, 0, Math.PI*2);
                ctx.fill();
            }
        }

        // Zzz...
        ctx.rotate(Math.PI / 6); // 文字は傾けない
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('z', 15, -20 + Math.sin(timer * 0.1) * 2);
        ctx.fillText('z', 20, -28 + Math.sin(timer * 0.1 + 1) * 2);

        ctx.restore();
    }
}

export class Jellyfish extends Enemy {
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

export class ElectricEel extends Enemy {
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

export class Flatfish extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 20; // 判定を少し大きく
        this.color = '#D2B48C'; // 砂に擬態する色
        this.state = 'hiding'; // 'hiding', 'revealing', 'biting'
        this.revealTimer = 0;
    }

    update(speed, game) {
        this.x -= speed;

        // 地面のY座標に追従
        this.y = game.getGroundY(this.x) - 5; // 少し埋める

        if (this.state === 'hiding') {
            // プレイヤーが近づいたら姿を現す
            const dx = this.x - game.player.x;
            const dy = this.y - game.player.y;
            if (Math.sqrt(dx * dx + dy * dy) < 100) {
                this.state = 'revealing';
                this.revealTimer = 20; // 姿を現すまでの時間
            }
        } else if (this.state === 'revealing') {
            this.revealTimer--;
            if (this.revealTimer <= 0) {
                this.state = 'biting';
            }
        }
    }

    draw(ctx, isBiting = false) {
        const revealProgress = this.state === 'revealing' ? (20 - this.revealTimer) / 20 : (this.state === 'biting' || isBiting ? 1 : 0);

        if (revealProgress < 0.1 && !isBiting) {
            // 隠れているときは目だけ描く
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(this.x - 15, this.y - 2, 1.5, 0, Math.PI * 2);
            ctx.arc(this.x - 8, this.y - 4, 1.5, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        ctx.save();
        ctx.globalAlpha = revealProgress;

        // 飛び出すアニメーション
        const jumpHeight = Math.sin(revealProgress * Math.PI) * 20;
        ctx.translate(this.x, this.y - jumpHeight);

        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 25);
        grad.addColorStop(0, '#E6CCB3');
        grad.addColorStop(1, this.color);
        ctx.fillStyle = grad;
        ctx.beginPath();
        
        const h = isBiting ? 25 : 18;
        ctx.moveTo(-30, 0);
        ctx.quadraticCurveTo(0, -h, 30, 0);
        ctx.quadraticCurveTo(0, h, -30, 0);
        ctx.fill();

        // 斑点模様
        ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
        for(let i=0; i<8; i++) {
            ctx.beginPath();
            ctx.arc((Math.random()-0.5)*40, (Math.random()-0.5)*20, Math.random()*2+1, 0, Math.PI*2);
            ctx.fill();
        }

        // 閉じ目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-15, -5, 3, 0, Math.PI * 2);
        ctx.arc(-8, -8, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-15, -5, 1.5, 0, Math.PI * 2);
        ctx.arc(-8, -8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    checkCollision(player) {
        if (this.state !== 'biting') return false;

        const jumpHeight = 20;
        const currentY = this.y - jumpHeight;

        const dx = this.x - player.x;
        const dy = currentY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.radius + player.radius);
    }
}
export class SeaUrchin extends Enemy {
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
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 / 16) * i;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + Math.cos(angle) * 25, this.y +
                Math.sin(angle) * 25);
            ctx.stroke();
        }
    }
}

export class Octopus extends Enemy {
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

    drawSleeping(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 影
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.ellipse(0, 25, 20, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(0, -10, 2, 0, -5, 15);
        grad.addColorStop(0, '#E9967A');
        grad.addColorStop(1, '#CD5C5C');
        ctx.fillStyle = grad;

        // 頭
        ctx.beginPath();
        ctx.ellipse(0, -15, 20, 25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 足（だらんと垂れている）
        ctx.strokeStyle = '#CD5C5C';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const startX = -15 + i * 10;
            ctx.moveTo(startX, 0);
            ctx.quadraticCurveTo(startX, 20, startX + (i - 1.5) * 5, 30);
            ctx.stroke();
        }

        // 閉じ目
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-8, -10, 3, 0.1 * Math.PI, 0.9 * Math.PI); // 左目
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(8, -10, 3, 0.1 * Math.PI, 0.9 * Math.PI); // 右目
        ctx.stroke();

        // Zzz...
        ctx.fillStyle = '#A0522D';
        ctx.font = 'bold 12px sans-serif';
        const t = this.moveTimer || 0;
        ctx.fillText('z', 15, -20 + Math.sin(t * 0.1) * 2);
        ctx.fillText('z', 20, -28 + Math.sin(t * 0.1 + 1) * 2);

        // 鼻提灯（かわいさアップ）
        // 周期的に膨らんで破裂する
        const cycle = t * 0.05;
        const phase = cycle % (Math.PI * 2); // 0 ~ 2PI
        
        if (phase < Math.PI * 1.8) {
            // 膨らむフェーズ
            const bubbleSize = 2 + (1 - Math.cos(phase * 0.55)) * 6; // 徐々に大きく
            if (bubbleSize > 2) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(5, -5, bubbleSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = 1;
                ctx.stroke();
                // ハイライト
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(5 - bubbleSize * 0.3, -5 - bubbleSize * 0.3, bubbleSize * 0.2, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            // 破裂フェーズ（しぶき）
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for(let i=0; i<3; i++) {
                const angle = (Math.PI * 2 / 3) * i;
                const dist = 8;
                ctx.beginPath();
                ctx.arc(5 + Math.cos(angle)*dist, -5 + Math.sin(angle)*dist, 1.5, 0, Math.PI*2);
                ctx.fill();
            }
            // POP text
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 10px sans-serif';
            ctx.fillText('POP!', 10, -15);
        }

        ctx.restore();
    }
}

export class Porcupinefish extends Enemy {
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
        grad.addColorStop(0, '#FFFFFF'); // White
        grad.addColorStop(1, '#F0F8FF'); // AliceBlue
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
                ctx.lineTo(Math.cos(angle) * (r + 10), Math.sin(
                    angle) * (r + 10));
                ctx.lineTo(Math.cos(angle + 0.2) * r, Math.sin(
                    angle + 0.2) * r);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

export class Crab extends Enemy {
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

export class SeaAnemone extends Enemy {
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

export class Starfish extends Enemy {
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

export class Needle extends Enemy {
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

export class Whirlpool extends Enemy {
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

export class Whale extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 150; // さらに大きく
        this.timer = 0;
        this.attackTimer = 0;
        this.isSucking = false;
        this.suckTimer = 0;

        // 複数のパスを定義（色抜け防止のためパーツ分け）
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

        // 攻撃サイクル
        this.attackTimer++;
        
        // 吸い込み攻撃 (一発アウト)
        if (this.attackTimer > 300 && this.attackTimer < 500) {
            this.isSucking = true;
            this.suckTimer++;
            // 流れを作り出す処理は game.js で行う
        } else {
            this.isSucking = false;
            this.suckTimer = 0;
        }

        // 潮吹き攻撃 (乱数で回避可能に)
        if (this.attackTimer > 600) {
            this.attackTimer = 0;
            
            // プレイヤーの位置を見て、当たりそうな時だけ撃つ（あるいはランダムで外す）
            if (Math.random() < 0.7) {
                // 背中あたりから潮吹き
                game.enemies.push(new WaterSpout(this.x - 80, this.y - 50));

                // 水滴をばら撒く（隙間を作る）
                for (let i = 0; i < 6; i++) {
                    if (i === 3) continue; // 隙間
                    const vx = (Math.random() - 0.8) * 10; 
                    const vy = -Math.random() * 15 - 5; 
                    game.enemies.push(new WaterDrop(this.x - 80, this.y - 50, vx, vy));
                }
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

        // 色の定義（パーツごとに塗り分ける）
        const bodyGrad = ctx.createLinearGradient(-100, -50, 100,
            50);
        bodyGrad.addColorStop(0, '#1A237E'); // Deep Indigo
        bodyGrad.addColorStop(1, '#303F9F'); // Indigo
        const bellyColor = '#B0BEC5';

        // 尾（反転しないように個別に描画）
        ctx.fillStyle = bodyGrad;
        ctx.fill(this.tailPath);

        // 体
        ctx.fillStyle = '#303F9F'; // 少し色を変える
        ctx.fill(this.bodyPath);

        // 頭
        ctx.fillStyle = bodyGrad;
        ctx.fill(this.headPath);

        // 下顎
        ctx.save();
        if (this.isSucking) { // 吸い込み中は口を開ける
            const openAngle = Math.min(0.4, this.suckTimer * 0.01);
            ctx.translate(-70, 50);
            ctx.rotate(openAngle);
            ctx.translate(70, -50);
        }
        ctx.fillStyle = '#90A4AE';
        ctx.fill(this.jawPath);
        ctx.restore();

        // 目
        ctx.fillStyle = '#101010';
        ctx.beginPath();
        ctx.arc(-100, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // 吸い込みエフェクト
        if (this.isSucking) {
            const mouthX = -140;
            const mouthY = 30;
            ctx.globalCompositeOperation = 'source-over'; // 確実に上に描画
            for (let i = 0; i < 15; i++) {
                const angle = Math.random() * Math.PI - Math.PI /
                    2;
                const dist = Math.random() * 150 + 50;
                const particleX = mouthX + Math.cos(angle) * dist;
                const particleY = mouthY + Math.sin(angle) * dist;

                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random()})`;
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

export class Architeuthis extends Enemy {
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
            // 画面外（右下や右上）から伸びてくる
            game.enemies.push(new GiantTentacle(this.x - 60, this.y, game));
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

        // 触腕（長い2本）を待機状態で描画（攻撃時のデザインを利用）
        ctx.save();
        const tentacleGrad = ctx.createLinearGradient(-100, 0, -20, 0);
        tentacleGrad.addColorStop(0, '#8B0000');
        tentacleGrad.addColorStop(1, '#C71585');
        ctx.fillStyle = tentacleGrad;
        
        // 2本描画
        for(let j=0; j<2; j++) {
            const yOffset = (j===0 ? -15 : 15);
            ctx.beginPath();
            ctx.moveTo(-40, yOffset);
            // うねり
            const wave = Math.sin(this.timer + j*Math.PI) * 10;
            ctx.bezierCurveTo(-80, yOffset + wave, -120, yOffset - wave, -180, yOffset + wave*0.5);
            // 先端から戻る
            ctx.lineTo(-175, yOffset + wave*0.5 + 5);
            ctx.bezierCurveTo(-115, yOffset - wave + 5, -80, yOffset + wave + 5, -40, yOffset + 8);
            ctx.fill();
            
            // 吸盤
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            for(let i=0; i<5; i++) {
                ctx.beginPath();
                ctx.arc(-60 - i*25, yOffset + Math.sin(this.timer + j*Math.PI + i*0.5)*5 + 3, 2, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.fillStyle = tentacleGrad; // 色を戻す
        }
        ctx.restore();

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

export class GiantTentacle extends Enemy {
    constructor(x, y, game) {
        super(x, y);
        this.game = game;
        this.radius = 15;
        this.life = 120; // 寿命を少し長く
        this.length = 10;
        this.maxLength = 400;
        
        // 初期角度（プレイヤーの方向）
        const dx = game.player.x - x;
        const dy = game.player.y - y;
        this.angle = Math.atan2(dy, dx);
    }
    update(speed) {
        this.x -= speed; // 本体と一緒に動く
        if (this.life > 60) {
            // 伸びるフェーズ（イージングで滑らかに）
            this.length += (this.maxLength - this.length) * 0.1;
            
            // プレイヤーを追尾（角度を滑らかに更新）
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // 角度の差分を計算して少しずつ近づける
            let diff = targetAngle - this.angle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.angle += diff * 0.05; // 追尾速度
        }
        else {
            // 縮むフェーズ
            this.length *= 0.85;
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

export class WaterSpout extends Enemy {
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

export class WaterDrop extends Enemy {
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

// --- 新規追加クラス ---

// ヘドロゾーン：ゴミ
export class Trash extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 18;
        this.angle = Math.random() * Math.PI * 2;
        const r = Math.random();
        if (r < 0.33) this.type = 'can';
        else if (r < 0.66) this.type = 'bag';
        else this.type = 'bottle';
    }
    update(speed) {
        this.x -= speed;
        this.angle += 0.05;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        if (this.type === 'can') {
            // 潰れた空き缶
            ctx.fillStyle = '#C0C0C0';
            ctx.beginPath();
            ctx.moveTo(-10, -15);
            ctx.lineTo(10, -15);
            ctx.lineTo(8, 0); // 真ん中が凹んでいる
            ctx.lineTo(10, 15);
            ctx.lineTo(-10, 15);
            ctx.lineTo(-8, 0); // 真ん中が凹んでいる
            ctx.closePath();
            ctx.fill();
            
            // ラベル
            ctx.fillStyle = 'red';
            ctx.fillRect(-9, -8, 18, 16);
            
            // プルタブ
            ctx.fillStyle = '#A9A9A9';
            ctx.beginPath();
            ctx.arc(0, -10, 3, 0, Math.PI*2);
            ctx.fill();

        } else if (this.type === 'bag') {
            // ビニール袋
            ctx.fillStyle = 'rgba(240, 248, 255, 0.5)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.bezierCurveTo(15, -10, 15, 10, 0, 15);
            ctx.bezierCurveTo(-15, 10, -15, -10, 0, -15);
            ctx.bezierCurveTo(-20, -10, -10, -20, 0, -15);
            ctx.fill();
            ctx.stroke();
            
            // 取手
            ctx.beginPath();
            ctx.moveTo(-5, -15);
            ctx.quadraticCurveTo(-10, -25, 0, -25);
            ctx.quadraticCurveTo(10, -25, 5, -15);
            ctx.stroke();

        } else {
            // ペットボトル
            ctx.fillStyle = 'rgba(135, 206, 250, 0.6)';
            ctx.beginPath();
            ctx.rect(-8, -15, 16, 25); // 本体
            ctx.rect(-4, -20, 8, 5);   // 首
            ctx.fill();
            
            // キャップ
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(-5, -22, 10, 4);
            
            // ラベル
            ctx.fillStyle = 'rgba(0, 0, 139, 0.5)';
            ctx.fillRect(-8, -5, 16, 10);
        }
        ctx.restore();
    }
}

// ヘドロゾーン：ウツボ
export class MorayEel extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 30;
        this.timer = 0;
    }
    update(speed) {
        this.x -= speed + 2; // 襲ってくる
        this.y += Math.sin(this.timer += 0.1) * 2;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ウツボの体（S字）
        const t = this.timer;
        const wave = Math.sin(t) * 5;
        
        // 体のグラデーション
        const grad = ctx.createLinearGradient(-40, 0, 40, 0);
        grad.addColorStop(0, '#D2B48C'); // Tan
        grad.addColorStop(1, '#8B4513'); // SaddleBrown
        ctx.fillStyle = grad;

        ctx.beginPath();
        // 頭
        ctx.moveTo(-45, -5); // 中心調整
        ctx.bezierCurveTo(-25, -20 + wave, 15, -20 - wave, 45, 0);
        // 腹
        ctx.bezierCurveTo(15, 20 - wave, -25, 20 + wave, -45, 15);
        ctx.closePath();
        ctx.fill();

        // 模様（黒い斑点）
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            const px = -25 + i * 15;
            const py = Math.sin(i + t) * 5;
            ctx.arc(px, py, 3, 0, Math.PI*2);
            ctx.fill();
        }

        // 口（大きく開ける）
        ctx.fillStyle = '#400000';
        ctx.beginPath();
        ctx.moveTo(-45, 5);
        ctx.lineTo(-30, -5);
        ctx.lineTo(-30, 10);
        ctx.fill();
        
        // 鋭い歯
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(-43, 5);
        ctx.lineTo(-40, 3);
        ctx.lineTo(-37, 0);
        ctx.fill();

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-37, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-38, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 流氷ゾーン：ペンギン
export class Penguin extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 25;
        this.vy = 2;
        this.timer = 0;
    }
    update(speed) {
        this.x -= speed + 3; // 速い
        this.y += this.vy;
        if (this.y > 300 || this.y < 50) this.vy *= -1; // 上下移動
        this.timer += 0.2;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // 進行方向に向ける（上下移動に合わせて少し傾ける）
        const angle = Math.atan2(this.vy, -3); // vx is approx -3
        ctx.rotate(angle);

        // 体（流線型）
        const grad = ctx.createLinearGradient(-20, -10, 20, 10);
        grad.addColorStop(0, '#2F4F4F');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // お腹（白）
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(0, 5, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // くちばし
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-25, 0);
        ctx.lineTo(-35, 3);
        ctx.lineTo(-25, 6);
        ctx.fill();

        // 目
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-17, -3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-18, -3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 翼（フリッパー）
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(5, 0, 12, 4, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        // 足
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.ellipse(30, 2, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// 流氷ゾーン：アザラシ
export class Seal extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 30;
        this.timer = 0;
    }
    update(speed) {
        this.x -= speed + 1;
        this.timer += 0.05;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // ゆったり泳ぐ
        ctx.rotate(Math.sin(this.timer) * 0.1);

        const grad = ctx.createRadialGradient(0, -5, 5, 0, 0, 30);
        grad.addColorStop(0, '#F5F5F5');
        grad.addColorStop(1, '#D3D3D3');
        ctx.fillStyle = grad;

        ctx.beginPath();
        // 頭から尾へ
        ctx.moveTo(-35, 0);
        ctx.bezierCurveTo(-25, -20, 15, -20, 35, 0); // 背中
        ctx.bezierCurveTo(15, 20, -25, 20, -35, 0); // 腹
        ctx.fill();

        // ゴマ模様
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        for(let i=0; i<6; i++) {
            ctx.beginPath();
            ctx.arc(-15 + Math.random()*40, (Math.random()-0.5)*20, Math.random()*2+1, 0, Math.PI*2);
            ctx.fill();
        }

        // 顔
        // 鼻
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(-37, 0, 3, 2, 0, 0, Math.PI*2);
        ctx.fill();
        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-30, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // ヒゲ
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-37, 2); ctx.lineTo(-43, 5);
        ctx.moveTo(-37, 3); ctx.lineTo(-43, 8);
        ctx.stroke();

        // 前ヒレ
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.ellipse(-5, 10, 10, 5, 0.5, 0, Math.PI*2);
        ctx.fill();

        // 後ろヒレ
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(45, -5);
        ctx.lineTo(45, 5);
        ctx.fill();

        ctx.restore();
    }
}

// 流氷ゾーン：セイウチ
export class Walrus extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 40;
        this.timer = 0;
    }
    update(speed) {
        this.x -= speed + 0.5;
        this.timer += 0.05;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.sin(this.timer * 0.5) * 0.05);

        // 巨体
        const grad = ctx.createRadialGradient(0, -10, 10, 0, 0, 45);
        grad.addColorStop(0, '#A0522D'); // Sienna
        grad.addColorStop(1, '#5D4037'); // Brown
        ctx.fillStyle = grad;

        ctx.beginPath();
        ctx.ellipse(0, 0, 45, 30, 0, 0, Math.PI * 2);
        ctx.fill();

        // 首のしわ
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-10, 0, 28, -0.5, 0.5);
        ctx.stroke();

        // 頭
        ctx.beginPath();
        ctx.arc(-35, -5, 18, 0, Math.PI * 2);
        ctx.fill();

        // 牙（特徴）
        ctx.fillStyle = '#FFFAF0'; // FloralWhite
        ctx.beginPath();
        ctx.moveTo(-45, 5);
        ctx.quadraticCurveTo(-45, 25, -50, 35); // 左牙
        ctx.lineTo(-40, 35);
        ctx.quadraticCurveTo(-35, 25, -35, 5);
        ctx.fill();

        // ヒゲ（剛毛）
        ctx.strokeStyle = '#D2B48C';
        ctx.lineWidth = 1;
        for(let i=0; i<5; i++) {
            ctx.beginPath();
            ctx.moveTo(-48, 0 + i*2);
            ctx.lineTo(-55, 2 + i*3);
            ctx.stroke();
        }

        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-42, -10, 2, 0, Math.PI * 2);
        ctx.fill();

        // 前ヒレ
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.ellipse(10, 20, 15, 8, 0.5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

// 流氷ゾーン：流氷（障害物）
export class IceFloe extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 40;
        this.y = 40; // 上部に固定
    }
    update(speed) {
        this.x -= speed;
    }
    draw(ctx) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(this.x - 50, 0);
        ctx.lineTo(this.x + 50, 0);
        ctx.lineTo(this.x + 30, 60);
        ctx.lineTo(this.x - 30, 50);
        ctx.fill();
    }
}

// 宇宙ゾーン：隕石
export class Meteor extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 20;
        this.angle = 0;
    }
    update(speed) {
        this.x -= speed + 4;
        this.angle += 0.1;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#5D4037';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        // クレーター
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.arc(-5, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 宇宙ゾーン：スペースデブリ
export class SpaceDebris extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 15;
        this.angle = Math.random();
        const r = Math.random();
        if (r < 0.33) this.type = 'panel';
        else if (r < 0.66) this.type = 'metal';
        else this.type = 'satellite';
    }
    update(speed) {
        this.x -= speed + 2;
        this.angle += 0.2;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        if (this.type === 'panel') {
            // 太陽光パネルの破片
            ctx.fillStyle = '#1E90FF';
            ctx.fillRect(-15, -10, 30, 20);
            // グリッド
            ctx.strokeStyle = '#ADD8E6';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -10); ctx.lineTo(0, 10);
            ctx.moveTo(-15, 0); ctx.lineTo(15, 0);
            ctx.stroke();
            // 断面
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(15, -10); ctx.lineTo(10, 0); ctx.lineTo(15, 10);
            ctx.fill();

        } else if (this.type === 'metal') {
            // 金属スクラップ
            ctx.fillStyle = '#708090';
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(10, -5);
            ctx.lineTo(5, 10);
            ctx.lineTo(-15, 5);
            ctx.closePath();
            ctx.fill();
            // ボルト
            ctx.fillStyle = '#D3D3D3';
            ctx.beginPath();
            ctx.arc(-8, -8, 2, 0, Math.PI*2);
            ctx.arc(3, 8, 2, 0, Math.PI*2);
            ctx.fill();

        } else {
            // 衛星パーツ（金色の断熱材）
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(10, -10);
            ctx.lineTo(15, 5);
            ctx.lineTo(-5, 15);
            ctx.closePath();
            ctx.fill();
            // 反射
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(0, -10);
            ctx.lineTo(-5, 15);
            ctx.fill();
        }
        ctx.restore();
    }
}

// 宇宙ゾーン：惑星（ボス）
export class Planet extends Enemy {
    constructor(x, y) {
        super(x, y);
        this.radius = 100;
    }
    update(speed) {
        this.x -= speed * 0.5;
    }
    draw(ctx) {
        // 土星っぽいデザイン
        const grad = ctx.createRadialGradient(this.x - 30, this.y - 30, 10, this.x, this.y, 100);
        grad.addColorStop(0, '#F4A460'); // SandyBrown
        grad.addColorStop(1, '#8B4513'); // SaddleBrown
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 100, 0, Math.PI * 2);
        ctx.fill();

        // 輪っか
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-0.3); // 傾き
        ctx.scale(1.0, 0.3); // 楕円にする
        
        ctx.beginPath();
        ctx.arc(0, 0, 160, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(222, 184, 135, 0.8)'; // BurlyWood
        ctx.lineWidth = 25;
        ctx.stroke();
        
        // 輪の隙間（カッシーニの間隙風）
        ctx.beginPath();
        ctx.arc(0, 0, 145, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(100, 80, 60, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

// 宇宙ゾーン：人工衛星（背景用だが敵クラスとして実装して衝突判定を持たせることも可）
export class Satellite extends Shipwreck {
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#Silver';
        ctx.fillRect(-20, -10, 40, 20); // 本体
        ctx.fillStyle = '#87CEFA';
        ctx.fillRect(-50, -5, 30, 10); // パネル左
        ctx.fillRect(20, -5, 30, 10); // パネル右
        ctx.restore();
    }
}
