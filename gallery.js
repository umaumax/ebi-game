class Gallery {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.currentIndex = 0;
        this.zoomLevel = 2.0;
        this.rotationAngle = 0;
        this.dragStartX = 0;
        this.baseAngle = 0;
        this.pinchStartDist = 0;
        this.isDragging = false;
        
        this.ui = document.getElementById('gallery-ui');
        this.nameEl = document.getElementById('gallery-name');
        this.descEl = document.getElementById('gallery-desc');
        
        this.init();
        this.setupInput();
    }

    init() {
        this.items = [
            { cls: Shrimp, name: "えびちゃん", desc: "家に帰りたい健気なエビ。\nジャンプ力には自信がある。" },
            { cls: FriendShrimp, name: "仲間エビ", desc: "はぐれた仲間。\n助けるとライフが増える。" },
            { cls: Fish, name: "魚", desc: "どこにでもいる普通の魚。\n群れるのが好き。" },
            { cls: Sardine, name: "イワシ", desc: "集団で泳ぐ小魚。\n一匹なら怖くない。" },
            { cls: Tuna, name: "マグロ", desc: "高速で泳ぐ海の弾丸。\n止まると死ぬらしい。" },
            { cls: Shark, name: "サメ", desc: "海のハンター。\n執拗に追いかけてくる。" },
            { cls: Anglerfish, name: "チョウチンアンコウ", desc: "深海の誘惑者。\n光に近づいてはいけない。" },
            { cls: Squid, name: "イカ", desc: "気まぐれに泳ぐ軟体動物。\nたまにダッシュする。" },
            { cls: Octopus, name: "タコ", desc: "くねくね動く。\n深海では寝ていることも。" },
            { cls: Flatfish, name: "ヒラメ", desc: "海底に潜む罠。\n踏むと食べられる。" },
            { cls: SeaUrchin, name: "ウニ", desc: "触ると痛い。\n海底の地雷。" },
            { cls: Jellyfish, name: "クラゲ", desc: "電気を帯びている。\n触れると痺れる。" },
            { cls: Porcupinefish, name: "ハリセンボン", desc: "怒ると針を飛ばす。\n普段はかわいい。" },
            { cls: ElectricEel, name: "電気ウナギ", desc: "強力な電気を放つ。\nS字に泳ぐ。" },
            { cls: MorayEel, name: "ウツボ", desc: "岩陰から狙っている。\n噛まれると痛い。" },
            { cls: Crab, name: "カニ", desc: "横歩きの達人。\nハサミは強力。" },
            { cls: SeaAnemone, name: "イソギンチャク", desc: "綺麗な花には毒がある。\n触手注意。" },
            { cls: Starfish, name: "ヒトデ", desc: "星形の生物。\n張り付かれると厄介。" },
            { cls: Penguin, name: "ペンギン", desc: "氷の海の住人。\n水中では飛ぶように泳ぐ。" },
            { cls: Seal, name: "アザラシ", desc: "愛らしい見た目だが\nぶつかると重い。" },
            { cls: Walrus, name: "セイウチ", desc: "立派な牙を持つ。\n氷の海の主。" },
            { cls: Whale, name: "クジラ", desc: "巨大な海の王者。\n吸い込み攻撃に注意。" },
            { cls: Architeuthis, name: "ダイオウイカ", desc: "深海の伝説。\n巨大な触手で襲いかかる。" },
            { cls: Hook, name: "釣り針", desc: "地上からの魔の手。\n引っかかると連れ去られる。" },
            { cls: Net, name: "底引き網", desc: "根こそぎ持っていく。\n連打で逃げろ！" },
            { cls: Trash, name: "ゴミ", desc: "人間が捨てたゴミ。\n海を汚さないで。" },
            { cls: Meteor, name: "隕石", desc: "宇宙からの来訪者。\n当たると痛いでは済まない。" },
            { cls: SpaceDebris, name: "スペースデブリ", desc: "宇宙のゴミ。\n高速で飛んでくる。" },
            { cls: Planet, name: "惑星", desc: "宇宙の彼方にある星。\n衝突注意。" }
        ];
    }

    start() {
        this.game.state = STATE.GALLERY;
        this.game.screenStart.style.display = 'none';
        this.ui.style.display = 'block';
        this.zoomLevel = 2.0;
        this.rotationAngle = 0;
        this.updateUI();
    }

    end() {
        this.game.state = STATE.START;
        this.game.screenStart.style.display = 'block';
        this.ui.style.display = 'none';
    }

    next() {
        this.currentIndex = (this.currentIndex + 1) % this.items.length;
        this.updateUI();
        this.game.sound.playItem();
    }

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
        this.updateUI();
        this.game.sound.playItem();
    }

    updateUI() {
        const item = this.items[this.currentIndex];
        this.nameEl.innerText = item.name;
        this.descEl.innerText = item.desc;
    }

    setupInput() {
        const canvas = this.game.canvas;

        const dragStart = (e) => {
            if (this.game.state !== STATE.GALLERY) return;
            this.isDragging = true;
            this.dragStartX = e.clientX || e.touches[0].clientX;
            this.baseAngle = this.rotationAngle;
        };
        const dragEnd = () => {
            this.isDragging = false;
            this.pinchStartDist = 0;
        };

        canvas.addEventListener('wheel', (e) => {
            if (this.game.state !== STATE.GALLERY) return;
            e.preventDefault();
            this.zoomLevel *= 1 - e.deltaY * 0.001;
            this.zoomLevel = Math.max(0.5, Math.min(this.zoomLevel, 10.0));
        }, { passive: false });

        canvas.addEventListener('mousedown', dragStart);
        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const currentX = e.clientX;
            const dx = currentX - this.dragStartX;
            this.rotationAngle = this.baseAngle + dx * 0.01;
        });
        canvas.addEventListener('mouseup', dragEnd);
        canvas.addEventListener('mouseleave', dragEnd);

        canvas.addEventListener('touchstart', (e) => {
            if (this.game.state === STATE.GALLERY) {
                e.preventDefault();
                if (e.touches.length === 2) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    this.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
                    this.isDragging = false;
                } else if (e.touches.length === 1) {
                    dragStart(e);
                }
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (this.game.state === STATE.GALLERY) {
                e.preventDefault();
                if (e.touches.length === 2 && this.pinchStartDist > 0) {
                    const dx = e.touches[0].clientX - e.touches[1].clientX;
                    const dy = e.touches[0].clientY - e.touches[1].clientY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    this.zoomLevel *= dist / this.pinchStartDist;
                    this.zoomLevel = Math.max(0.5, Math.min(this.zoomLevel, 10.0));
                    this.pinchStartDist = dist;
                } else if (e.touches.length === 1 && this.isDragging) {
                    const currentX = e.touches[0].clientX;
                    const dx = currentX - this.dragStartX;
                    this.rotationAngle = this.baseAngle + dx * 0.01;
                }
            }
        }, { passive: false });
        canvas.addEventListener('touchend', dragEnd);
    }

    draw(ctx) {
        // 背景
        ctx.fillStyle = '#203040';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // グリッド線
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        ctx.beginPath();
        for(let x=0; x<this.game.width; x+=gridSize) {
            ctx.moveTo(x, 0); ctx.lineTo(x, this.game.height);
        }
        for(let y=0; y<this.game.height; y+=gridSize) {
            ctx.moveTo(0, y); ctx.lineTo(this.game.width, y);
        }
        ctx.stroke();

        const item = this.items[this.currentIndex];
        const cls = item.cls;
        const dummy = this.game.replaySystem.dummies[cls.name];

        if (dummy) {
            ctx.save();
            ctx.translate(this.game.width / 2, this.game.height / 2 - 50);
            ctx.scale(this.zoomLevel, this.zoomLevel);
            ctx.rotate(this.rotationAngle);

            dummy.x = 0;
            dummy.y = 0;
            if (dummy.timer !== undefined) dummy.timer += 0.05;
            if (dummy.moveTimer !== undefined) dummy.moveTimer += 0.1;

            dummy.draw(ctx, this.game.frameCount);
            ctx.restore();
        }
    }
}
