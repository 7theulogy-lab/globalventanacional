export const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return; // Si el navegador no lo soporta, no hace nada
    
    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Configuración para un pitido suave y rápido (similar a escáner)
    oscillator.type = 'sine'; // Onda senoidal (más suave que la cuadrada)
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime); // 1200Hz
    
    // Control de volumen para que no sea muy fuerte
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); 
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    // Dura 150 milisegundos
    setTimeout(() => {
      oscillator.stop();
      audioCtx.close();
    }, 150);
  } catch (error) {
    console.error("Error reproduciendo sonido", error);
  }
};
