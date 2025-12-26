export class Shipwreck {
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

export class Pearl {
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

export class TreasureChest {
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

export class Plankton {
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

export class FriendShrimp extends Plankton {
    constructor(x, y) {
        super(x, y);
        this.radius = 14; // プレイヤーのフォロワーサイズ(20*0.7)に合わせる
        this.hitRadius = 50; // 当たり判定は大きく維持
    }
    checkCollision(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.hitRadius + player.radius);
    }
    draw(ctx) {
        // 仲間エビ（主人公の後ろのエビのデザイン）
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 左向きにする
        ctx.scale(-1, 1);

        // 仲間の色（グラデーション）
        const fGrad = ctx.createRadialGradient(0, -this.radius * 0.2, 0, 0, 0, this.radius);
        fGrad.addColorStop(0, '#FFC0CB');
        fGrad.addColorStop(1, '#FFB6C1');
        ctx.fillStyle = fGrad;
        
        const baseStyle = fGrad;

        // 胴体
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.6, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 節（セグメント）の表現
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(-this.radius * 0.5 + i * this.radius * 0.5, -this.radius * 0.2, this.radius * 0.4, 0, Math.PI, false);
            ctx.fill();
        }
        ctx.fillStyle = baseStyle;

        // 足
        ctx.strokeStyle = baseStyle;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            const x = -this.radius * 0.5 + i * this.radius * 0.4;
            ctx.moveTo(x, this.radius * 0.3);
            ctx.lineTo(x - 2, this.radius * 0.8);
            ctx.stroke();
        }

        // 尻尾
        ctx.beginPath();
        ctx.moveTo(-this.radius, 0);
        ctx.lineTo(-this.radius * 1.75, this.radius * 0.25);
        ctx.lineTo(-this.radius * 1.75, -this.radius * 0.25);
        ctx.fill();

        // 長い触角
        ctx.strokeStyle = '#FF4500'; // 主人公と同じ濃いオレンジ
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.radius, -5);
        ctx.quadraticCurveTo(this.radius + 20, -20, this.radius + 10, -30);
        ctx.moveTo(this.radius, -5);
        ctx.quadraticCurveTo(this.radius + 25, -15, this.radius + 15, -35);
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
        ctx.arc(this.radius * 0.9 - 1, -6, 1, 0, Math.PI * 2);
        ctx.fill();

        // 視認性向上のための発光エフェクト
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FF69B4';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;

        // 体全体のアウトラインを描画
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius * 1.6, this.radius * 0.6, 0, 0, Math.PI * 2);
        ctx.moveTo(-this.radius, 0);
        ctx.lineTo(-this.radius * 1.75, this.radius * 0.25);
        ctx.lineTo(-this.radius * 1.75, -this.radius * 0.25);
        ctx.closePath();

        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}

export class Seaweed {
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

export class RuggedTerrain {
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

export class Coral {
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

export class Clownfish {
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

export class GardenEel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.height = 60; // 長さを伸ばす
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
        const sway = Math.sin(Date.now() * 0.005 + this.x * 0.1) * 10;

        // チンアナゴ（白に黒点）
        ctx.fillStyle = '#F0F8FF'; // AliceBlue
        ctx.beginPath();
        ctx.moveTo(this.x - 4, this.y);
        ctx.quadraticCurveTo(this.x - 4 + sway, this.y - this.height / 2, this.x - 4, this.y - this.height);
        ctx.lineTo(this.x + 4, this.y - this.height);
        ctx.quadraticCurveTo(this.x + 4 + sway, this.y - this.height / 2, this.x + 4, this.y);
        ctx.fill();

        // 黒点
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + sway * 0.5, this.y - 40, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + sway * 0.2, this.y - 20, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // 目
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - this.height + 4, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class Bubble {
    constructor(x, y, isBackground = false, isAscending = false) {
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

        if (isAscending) {
            this.vy = Math.random() * 2 + 2; // 上昇泡は速い
            this.vxFactor = 0.2;
            this.size = Math.random() * 3 + 1;
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

export class StreamLine {
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

export class FloatingText {
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
