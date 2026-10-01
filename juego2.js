const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

let player;
let pogoStick;
let keys;
let platforms;
let jumpCooldown = 0;
let isPaused = false;

function preload() {
    let g = this.add.graphics();
    g.fillStyle(0x1760c5, 1);
    g.fillCircle(16, 16, 16);
    g.generateTexture('player_head', 32, 32);
    g.destroy();

    g = this.add.graphics();
    g.fillStyle(0xd9534f, 1);
    g.fillRect(0, 0, 8, 48);
    g.fillStyle(0x333333, 1);
    g.fillRect(-4, 40, 16, 8);
    g.generateTexture('pogo_stick', 16, 48);
    g.destroy();

    g = this.add.graphics();
    g.fillStyle(0x555555, 1);
    g.fillRect(0, 0, 64, 64);
    g.lineStyle(2, 0x333333, 1);
    g.strokeRect(0, 0, 64, 64);
    g.generateTexture('mountain_block', 64, 64);
    g.destroy();
}

function create() {
    const mapWidth = 2000;
    const mapHeight = 4000;
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);

    platforms = this.physics.add.staticGroup();
    buildMountain(mapWidth, mapHeight);

    const startX = 300;
    const startY = mapHeight - 150;
    
    player = this.physics.add.sprite(startX, startY, 'player_head');
    player.setBounce(0.3);
    player.setCollideWorldBounds(true);
    player.setDragX(100);
    player.body.setCircle(16);

    pogoStick = this.add.sprite(startX, startY, 'pogo_stick');
    pogoStick.setOrigin(0.5, 0.1);

    this.physics.add.collider(player, platforms, handleCollision, null, this);

    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    keys = this.input.keyboard.addKeys({
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
        leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
        rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        space: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    player.customRotation = 0;

    createBottomBar.call(this);
}

function update(time, delta) {
    if (isPaused || !player) return;

    if (jumpCooldown > 0) jumpCooldown -= delta;

    const rotSpeed = 0.05;
    if (keys.left.isDown || keys.leftArrow.isDown) {
        player.customRotation -= rotSpeed;
    } else if (keys.right.isDown || keys.rightArrow.isDown) {
        player.customRotation += rotSpeed;
    } else {
        player.customRotation *= 0.98;
    }

    player.customRotation = Phaser.Math.Clamp(player.customRotation, -2.1, 2.1);

    pogoStick.x = player.x;
    pogoStick.y = player.y;
    pogoStick.rotation = player.customRotation;
    player.rotation = player.customRotation;

    const touchGround = player.body.blocked.down || player.body.touching.down;

    if (touchGround && jumpCooldown <= 0) {
        let jumpForce = 680;
        let isSuperJump = false;
        
        if (keys.space.isDown) {
            jumpForce = 920;
            isSuperJump = true;
        }

        const angle = player.customRotation - Math.PI / 2;
        const vx = Math.cos(angle) * jumpForce;
        const vy = Math.sin(angle) * jumpForce;

        player.setVelocityX(player.body.velocity.x + vx);
        player.setVelocityY(vy);

        if (isSuperJump) {
            createAirBurstFX(this, player.x, player.y + 16, player.customRotation);
        }

        jumpCooldown = 250;
    }

    if (touchGround && (Math.abs(player.customRotation) > 1.2)) {
        player.setVelocityX(player.body.velocity.x * 1.05);
    }
}

function createAirBurstFX(scene, x, y, rotation) {
    const particles = [];
    const baseAngle = rotation + Math.PI / 2;

    for (let i = 0; i < 12; i++) {
        const spread = (Math.random() - 0.5) * 0.8;
        const angle = baseAngle + spread;
        const speed = 150 + Math.random() * 200;
        
        const graphic = scene.add.graphics();
        graphic.fillStyle(0xffffff, 0.9);
        graphic.fillCircle(0, 0, Math.random() * 4 + 2);
        graphic.x = x;
        graphic.y = y;

        particles.push({
            gfx: graphic,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0
        });
    }

    const timer = scene.time.addEvent({
        delay: 16,
        repeat: 20,
        callback: () => {
            particles.forEach(p => {
                p.gfx.x += p.vx * 0.016;
                p.gfx.y += p.vy * 0.016;
                p.life -= 0.05;
                p.gfx.setAlpha(Math.max(0, p.life));
                p.gfx.setScale(Math.max(0, p.life));
            });
        }
    });

    scene.time.delayedCall(400, () => {
        particles.forEach(p => p.gfx.destroy());
    });
}

function handleCollision(playerObj, platformObj) {
    if (playerObj.body.blocked.left || playerObj.body.blocked.right) {
        playerObj.customRotation += playerObj.body.velocity.x * 0.002;
    }
}

function buildMountain(width, height) {
    createBlockRow(0, height - 32, Math.ceil(width / 64));

    for (let y = 0; y < height; y += 64) {
        platforms.create(0, y, 'mountain_block').refreshBody();
        platforms.create(width - 32, y, 'mountain_block').refreshBody();
    }

    for (let i = 0; i < 10; i++) {
        createBlockRow(150 + (i * 100), height - 200 - (i * 110), 3);
    }

    createBlockRow(1000, height - 1400, 3);
    createBlockRow(700, height - 1600, 3);
    createBlockRow(300, height - 1800, 3);

    createBlockRow(600, height - 2100, 5);
    createBlockRow(200, height - 2350, 3);
    createBlockRow(1000, height - 2600, 4);

    createBlockRow(600, height - 3100, 6);
}

function createBlockRow(startX, y, count) {
    for (let i = 0; i < count; i++) {
        platforms.create(startX + (i * 64), y, 'mountain_block').refreshBody();
    }
}

function createBottomBar() {
    const barHeight = 60;
    const barY = window.innerHeight - barHeight;

    const barBg = this.add.rectangle(window.innerWidth / 2, barY + (barHeight / 2), window.innerWidth, barHeight, 0x111111, 0.9)
        .setScrollFactor(0)
        .setDepth(100);

    const btnStyle = { 
        fontFamily: 'Arial', 
        fontSize: '15px', 
        fontWeight: 'bold', 
        fill: '#000000', 
        backgroundColor: '#ffffff', 
        padding: { x: 10, y: 6 } 
    };
    
    const textStyle = { 
        fontFamily: 'Arial', 
        fontSize: '15px', 
        fill: '#ffffff' 
    };

    let currentVol = 70;
    let currentBri = 60;

    const saveBtn = this.add.text(20, barY + 15, 'GUARDAR', btnStyle)
        .setScrollFactor(0)
        .setDepth(101)
        .setInteractive({ useHandCursor: true });

    saveBtn.on('pointerdown', () => {
        localStorage.setItem('pogo_player_x', player.x);
        localStorage.setItem('pogo_player_y', player.y);
        
        saveBtn.setBackgroundColor('#28a745');
        saveBtn.setColor('#ffffff');
        saveBtn.setText('¡GUARDADO!');
        this.time.delayedCall(1500, () => {
            saveBtn.setBackgroundColor('#ffffff');
            saveBtn.setColor('#000000');
            saveBtn.setText('GUARDAR');
        });
    });

    const volLabel = this.add.text(140, barY + 20, 'VOL:', textStyle).setScrollFactor(0).setDepth(101);
    const volVal = this.add.text(250, barY + 20, `${currentVol}%`, textStyle).setScrollFactor(0).setDepth(101);

    const volDown = this.add.text(185, barY + 15, '-', btnStyle).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
    const volUp = this.add.text(215, barY + 15, '+', btnStyle).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    volDown.on('pointerdown', () => {
        currentVol = Math.max(0, currentVol - 10);
        volVal.setText(`${currentVol}%`);
    });

    volUp.on('pointerdown', () => {
        currentVol = Math.min(100, currentVol + 10);
        volVal.setText(`${currentVol}%`);
    });

    const briLabel = this.add.text(310, barY + 20, 'BRILLO:', textStyle).setScrollFactor(0).setDepth(101);
    const briVal = this.add.text(445, barY + 20, `${currentBri}%`, textStyle).setScrollFactor(0).setDepth(101);

    const briDown = this.add.text(380, barY + 15, '-', btnStyle).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });
    const briUp = this.add.text(410, barY + 15, '+', btnStyle).setScrollFactor(0).setDepth(101).setInteractive({ useHandCursor: true });

    briDown.on('pointerdown', () => {
        currentBri = Math.max(0, currentBri - 10);
        briVal.setText(`${currentBri}%`);
    });

    briUp.on('pointerdown', () => {
        currentBri = Math.min(100, currentBri + 10);
        briVal.setText(`${currentBri}%`);
    });

    const menuBtn = this.add.text(window.innerWidth - 170, barY + 15, 'MENU PRINCIPAL', btnStyle)
        .setScrollFactor(0)
        .setDepth(101)
        .setInteractive({ useHandCursor: true });

    menuBtn.on('pointerdown', () => {
        window.location.href = 'inicio.html';
    });
}