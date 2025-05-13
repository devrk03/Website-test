/**
 * Class for managing chess sound effects
 */
class SoundEffectsManager {
    constructor() {
        this.enabled = true;
        this.sounds = {};
        this.loadSounds();
    }
    
    /**
     * Load all sound effects
     */
    loadSounds() {
        this.loadSound('move', 'https://chess-app.example.com/sounds/move.mp3');
        this.loadSound('capture', 'https://chess-app.example.com/sounds/capture.mp3');
        this.loadSound('check', 'https://chess-app.example.com/sounds/check.mp3');
        this.loadSound('castle', 'https://chess-app.example.com/sounds/castle.mp3');
        this.loadSound('promote', 'https://chess-app.example.com/sounds/promote.mp3');
        this.loadSound('gameOver', 'https://chess-app.example.com/sounds/game-over.mp3');
        this.loadSound('draw', 'https://chess-app.example.com/sounds/draw.mp3');
        this.loadSound('illegal', 'https://chess-app.example.com/sounds/illegal.mp3');
        this.loadSound('select', 'https://chess-app.example.com/sounds/select.mp3');
        this.loadSound('newGame', 'https://chess-app.example.com/sounds/new-game.mp3');
        this.loadSound('flip', 'https://chess-app.example.com/sounds/flip.mp3');
        this.loadSound('hint', 'https://chess-app.example.com/sounds/hint.mp3');
        this.loadSound('undo', 'https://chess-app.example.com/sounds/undo.mp3');
        this.loadSound('loadGame', 'https://chess-app.example.com/sounds/load-game.mp3');
    }
    
    /**
     * Load a sound effect
     * @param {string} name - The sound name
     * @param {string} url - The sound URL
     */
    loadSound(name, url) {
        // In a real implementation, we would load the actual audio files
        // For this example, we'll use AudioContext to create simple sounds
        this.sounds[name] = {
            play: () => {
                if (!this.enabled) return;
                
                try {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    
                    // Create oscillator node
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // Configure sound based on name
                    switch (name) {
                        case 'move':
                            oscillator.type = 'sine';
                            oscillator.frequency.value = 440;
                            gainNode.gain.value = 0.2;
                            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                            oscillator.start();
                            oscillator.stop(audioContext.currentTime + 0.3);
                            break;
                            
                        case 'capture':
                            oscillator.type = 'triangle';
                            oscillator.frequency.value = 300;
                            gainNode.gain.value = 0.3;
                            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.4);
                            oscillator.start();
                            oscillator.stop(audioContext.currentTime + 0.4);
                            break;
                            
                        case 'check':
                            oscillator.type = 'square';
                            oscillator.frequency.value = 600;
                            gainNode.gain.value = 0.2;
                            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);
                            oscillator.start();
                            oscillator.stop(audioContext.currentTime + 0.5);
                            break;
                            
                        case 'select':
                            oscillator.type = 'sine';
                            oscillator.frequency.value = 600;
                            gainNode.gain.value = 0.1;
                            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
                            oscillator.start();
                            oscillator.stop(audioContext.currentTime + 0.1);
                            break;
                            
                        default:
                            oscillator.type = 'sine';
                            oscillator.frequency.value = 440;
                            gainNode.gain.value = 0.2;
                            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                            oscillator.start();
                            oscillator.stop(audioContext.currentTime + 0.3);
                    }
                } catch (e) {
                    console.warn('Audio not supported:', e);
                }
            }
        };
    }
    
    /**
     * Play a sound effect
     * @param {string} name - The sound name
     */
    playSound(name) {
        if (this.sounds[name]) {
            this.sounds[name].play();
        } else {
            console.warn(`Sound "${name}" not found`);
        }
    }
    
    /**
     * Enable or disable sound effects
     * @param {boolean} enabled - Whether sound is enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}
