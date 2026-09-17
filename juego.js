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
let pauseMenu;

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

    createUI.call(this);
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
        
        if (keys.space.isDown) {
            jumpForce = 920;
        }

        const angle = player.customRotation - Math.PI / 2;
        const vx = Math.cos(angle) * jumpForce;
        const vy = Math.sin(angle) * jumpForce;

        player.setVelocityX(player.body.velocity.x + vx);
        player.setVelocityY(vy);

        jumpCooldown = 250;
    }

    if (touchGround && (Math.abs(player.customRotation) > 1.2)) {
        player.setVelocityX(player.body.velocity.x * 1.05);
    }
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

function createUI() {
    const pauseBtn = this.add.text(20, 20, 'MENU', {
        fontSize: '20px',
        fill: '#ffffff',
        backgroundColor: '#1760c5',
        padding: { x: 15, y: 10 }
    })
    .setScrollFactor(0)
    .setInteractive({ useHandCursor: true });

    pauseMenu = this.add.container(0, 0).setScrollFactor(0).setVisible(false);

    const bg = this.add.rectangle(window.innerWidth / 2, window.innerHeight / 2, 360, 380, 0x000000, 0.85);
    bg.setStrokeStyle(4, 0x1760c5);

    const title = this.add.text(window.innerWidth / 2, window.innerHeight / 2 - 140, 'OPCIONES', {
        fontSize: '28px',
        fontWeight: 'bold',
        fill: '#ffffff'
    }).setOrigin(0.5);

    const volText = this.add.text(window.innerWidth / 2 - 130, window.innerHeight / 2 - 80, 'VOLUMEN', {
        fontSize: '18px',
        fill: '#ffffff'
    });

    const volVal = this.add.text(window.innerWidth / 2 + 90, window.innerHeight / 2 - 80, '70%', {
        fontSize: '18px',
        fill: '#ffffff'
    });

    const volDown = this.add.text(window.innerWidth / 2 + 30, window.innerHeight / 2 - 85, '-', {
        fontSize: '22px', fill: '#ffffff', backgroundColor: '#1760c5', padding: { x: 10, y: 2 }
    }).setInteractive({ useHandCursor: true });

    const volUp = this.add.text(window.innerWidth / 2 + 60, window.innerHeight / 2 - 85, '+', {
        fontSize: '22px', fill: '#ffffff', backgroundColor: '#1760c5', padding: { x: 8, y: 2 }
    }).setInteractive({ useHandCursor: true });

    let currentVol = 70;
    volDown.on('pointerdown', () => {
        currentVol = Math.max(0, currentVol - 10);
        volVal.setText(currentVol + '%');
    });
    volUp.on('pointerdown', () => {
        currentVol = Math.min(100, currentVol + 10);
        volVal.setText(currentVol + '%');
    });

    const briText = this.add.text(window.innerWidth / 2 - 130, window.innerHeight / 2 - 20, 'BRILLO', {
        fontSize: '18px',
        fill: '#ffffff'
    });

    const briVal = this.add.text(window.innerWidth / 2 + 90, window.innerHeight / 2 - 20, '60%', {
        fontSize: '18px',
        fill: '#ffffff'
    });

    const briDown = this.add.text(window.innerWidth / 2 + 30, window.innerHeight / 2 - 25, '-', {
        fontSize: '22px', fill: '#ffffff', backgroundColor: '#1760c5', padding: { x: 10, y: 2 }
    }).setInteractive({ useHandCursor: true });

    const briUp = this.add.text(window.innerWidth / 2 + 60, window.innerHeight / 2 - 25, '+', {
        fontSize: '22px', fill: '#ffffff', backgroundColor: '#1760c5', padding: { x: 8, y: 2 }
    }).setInteractive({ useHandCursor: true });

    let currentBri = 60;
    briDown.on('pointerdown', () => {
        currentBri = Math.max(0, currentBri - 10);
        briVal.setText(currentBri + '%');
    });
    briUp.on('pointerdown', () => {
        currentBri = Math.min(100, currentBri + 10);
        briVal.setText(currentBri + '%');
    });

    const resumeBtn = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 50, 'CONTINUAR', {
        fontSize: '18px',
        fontWeight: 'bold',
        fill: '#ffffff',
        backgroundColor: '#1760c5',
        padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    const menuBtn = this.add.text(window.innerWidth / 2, window.innerHeight / 2 + 110, 'MENU PRINCIPAL', {
        fontSize: '18px',
        fontWeight: 'bold',
        fill: '#ffffff',
        backgroundColor: '#d9534f',
        padding: { x: 20, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    pauseMenu.add([bg, title, volText, volVal, volDown, volUp, briText, briVal, briDown, briUp, resumeBtn, menuBtn]);

    pauseBtn.on('pointerdown', () => {
        isPaused = true;
        this.physics.pause();
        pauseMenu.setVisible(true);
    });

    resumeBtn.on('pointerdown', () => {
        isPaused = false;
        this.physics.resume();
        pauseMenu.setVisible(false);
    });

    menuBtn.on('pointerdown', () => {
        window.location.href = 'inicio.html';
    });
}