import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants.js';

export function createMuteButton(scene, audioEngine) {
  // Place it consistently in bottom-right corner
  const btnText = scene.add.text(GAME_WIDTH - 30, GAME_HEIGHT - 20, audioEngine.isMuted ? '🔇' : '🎵', {
    fontSize: '28px'
  })
  .setOrigin(1, 1)
  .setInteractive({ useHandCursor: true })
  .setDepth(999);

  // Bounce/hover effect
  scene.tweens.add({
    targets: btnText,
    y: '-=5',
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });

  btnText.on('pointerover', () => {
    btnText.setScale(1.2);
    if (!audioEngine.isMuted) audioEngine.playUIHover();
  });
  
  btnText.on('pointerout', () => {
    btnText.setScale(1.0);
  });

  btnText.on('pointerdown', () => {
    // scale bounce
    scene.tweens.add({
      targets: btnText,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        const isMuted = audioEngine.toggleMute();
        btnText.setText(isMuted ? '🔇' : '🎵');
        // Fix scaling if you clicked really fast while hovering
        if (scene.input.activePointer.isDown) btnText.setScale(1.2); 
      }
    });
  });

  return btnText;
}
