document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const kuberuBtn = document.getElementById('kuberu-btn');
    const noteOverlay = document.getElementById('note-overlay');
    const noteContainer = document.getElementById('note-container');
    const notePaper = document.querySelector('.note-paper');
    const noteText = document.getElementById('note-text');
    const messageOverlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');
    const bonfireSound = document.getElementById('bonfire-sound');

    // State
    let isDragging = false;
    let startY = 0;
    let currentY = 0;
    let isBurning = false;

    function playAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Create Brown Noise (Rumble)
                const bufferSize = audioContext.sampleRate * 2; // 2 seconds
                const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                let lastOut = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5; // Compensate for gain loss
                }

                const noiseSource = audioContext.createBufferSource();
                noiseSource.buffer = buffer;
                noiseSource.loop = true;

                // Filter to make it warmer
                const filter = audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 400;

                fireGainNode = audioContext.createGain();
                fireGainNode.gain.value = 0.15; // Set volume

                noiseSource.connect(filter);
                filter.connect(fireGainNode);
                fireGainNode.connect(audioContext.destination);

                noiseSource.start(0);
                console.log("Bonfire audio started");
            } catch (e) {
                console.warn("Audio Context failed:", e);
            }
        }

        // Critical: Always try to resume if suspended (needed for browsers blocking auto-play)
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }

    // Attempt to play immediately (might be blocked by browser policy)
    playAudio();

    // Ensure audio starts on ANY first interaction
    document.body.addEventListener('click', playAudio, { once: true });
    document.body.addEventListener('touchstart', playAudio, { once: true });

    // --- Kuberu Button Action ---
    kuberuBtn.addEventListener('click', () => {
        openNote();
        // playAudio is already covered by global listeners, but good to keep as backup
        playAudio();
    });

    function openNote() {
        // Random Color
        const randomColor = noteColors[Math.floor(Math.random() * noteColors.length)];
        notePaper.style.backgroundColor = randomColor;

        // Reset State
        noteText.value = '';
        noteContainer.style.transform = 'translateY(0)';
        noteContainer.style.opacity = '1';

        // Show Overlay
        noteOverlay.classList.remove('hidden');
        noteOverlay.style.visibility = 'visible'; // Force visibility

        // Blur Background
        document.getElementById('bonfire-bg').classList.add('blurred');

        // Focus (might not work on all mobile without further interaction, but good to try)
        setTimeout(() => noteText.focus(), 100);
    }

    // --- Swipe / Drag Logic ---

    // Touch Events
    noteOverlay.addEventListener('touchstart', (e) => startDrag(e.touches[0].clientY));
    noteOverlay.addEventListener('touchmove', (e) => dragging(e.touches[0].clientY));
    noteOverlay.addEventListener('touchend', endDrag);

    // Mouse Events
    noteOverlay.addEventListener('mousedown', (e) => startDrag(e.clientY));
    window.addEventListener('mousemove', (e) => {
        if (isDragging) dragging(e.clientY);
    });
    window.addEventListener('mouseup', () => {
        if (isDragging) endDrag();
    });

    function startDrag(y) {
        if (isBurning) return;
        // Only allow drag if we are clicking outside the textarea OR if we want to allow dragging everywhere.
        // To prevent interfering with text selection, let's say we drag properly if we swipe up.
        // For simplicity in this prototype, we'll allow drag anywhere on the overlay/container.
        isDragging = true;
        startY = y;
        currentY = y; // FIX: Initialize currentY to prevent jump/tap bug
    }

    function dragging(y) {
        if (!isDragging || isBurning) return;
        currentY = y;
        const deltaY = currentY - startY;

        // Visual feedback: Move the note slightly
        // We only care about upward movement (negative deltaY)
        if (deltaY < 0) {
            noteContainer.style.transform = `translateY(${deltaY}px)`;
        }
    }

    function endDrag() {
        if (!isDragging || isBurning) return;
        isDragging = false;

        const deltaY = currentY - startY;
        const threshold = -150; // Pixels to move up to trigger burn

        // If dragged up enough
        if (deltaY < threshold) {
            burnNote();
        } else {
            // Reset position
            noteContainer.style.transition = 'transform 0.3s ease';
            noteContainer.style.transform = 'translateY(0)';
            setTimeout(() => {
                noteContainer.style.transition = 'transform 0.1s linear'; // Reset transition for next drag
            }, 300);
        }
    }

    // --- Burn Logic ---
    function burnNote() {
        isBurning = true;

        // Animate Up and Out
        noteContainer.style.transition = 'all 0.8s ease-in';
        noteContainer.style.transform = 'translateY(-100vh) rotate(15deg) scale(0.8)';
        noteContainer.style.opacity = '0';

        // Flare effect (Global brightness?)
        const bg = document.getElementById('bonfire-bg');
        bg.style.filter = 'brightness(1.5)';
        setTimeout(() => bg.style.filter = 'brightness(1)', 500);

        // After animation
        setTimeout(() => {
            noteOverlay.classList.add('hidden');
            noteOverlay.style.visibility = ''; // Reset inline style
            isBurning = false;
            noteContainer.style.transition = ''; // Reset

            showMessage();
        }, 800);
    }

    // --- Message Logic ---
    function showMessage() {
        // Pick random message
        const msg = messages[Math.floor(Math.random() * messages.length)];
        messageText.textContent = msg;

        // Show
        messageOverlay.classList.remove('hidden');
        messageOverlay.style.visibility = 'visible';
        messageText.classList.add('show-message');

        // Hide after some time
        setTimeout(() => {
            messageText.classList.remove('show-message');
            // Wait for fade out
            setTimeout(() => {
                messageOverlay.classList.add('hidden');
                messageOverlay.style.visibility = ''; // Reset
                // Remove Blur
                document.getElementById('bonfire-bg').classList.remove('blurred');
            }, 1000);
        }, 6000); // Display time: 6 seconds
    }
});
