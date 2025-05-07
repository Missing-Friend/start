document.addEventListener('DOMContentLoaded', () => {
    const textElement = document.getElementById('glitch-text');
    const flickerOverlay = document.getElementById('flicker-overlay');
    const ambientSound = document.getElementById('ambient');
    const heartbeatSound = document.getElementById('heartbeat');
    const staticSFX = document.getElementById('static-sfx');

    const storyText = 
`WARNING: CLASSIFIED FOOTAGE - EYES ONLY\n
INITIATING DECRYPTION SEQUENCE...\n
\n
SUBJECT: JOSHUA MICHAEL RYAN\n
STATUS: MISSING\n
DURATION: 2 DAYS\n
LAST SEEN AT: ARLINGTON CITY PARK\n
\n
SECURITY CAMERA #CT-9Z (PARTIAL RECOVERY):\n
"THEY'RE NOT HUMAN... THE SHADOWS...\n
THEY WALK LIKE US BUT... WRONG..."\n
\n
FOOTAGE CORRUPTION: 98.7%\n
AUTHORITY CLEARANCE REQUIRED: LEVEL 5\n
`;

    let charIndex = 0;
    function typeText() {
        if(charIndex < storyText.length) {
            textElement.textContent += storyText[charIndex];
            charIndex++;
            setTimeout(typeText, 40);
        } else {
            setTimeout(flashImage, 1500);
        }
    }

    function flashImage() {
        const img = new Image();
        img.src = 'https://i.pinimg.com/236x/9f/24/21/9f2421cc846c3b372c075a0f5a668b8e.jpg';
        img.style.position = 'fixed';
        img.style.top = '0';
        img.style.left = '0';
        img.style.width = '100vw';
        img.style.height = '100vh';
        img.style.zIndex = '1000';
        document.body.appendChild(img);

        staticSFX.currentTime = 0;
        staticSFX.play();
        flickerOverlay.style.opacity = '1';

        setTimeout(() => {
            document.body.removeChild(img);
            flickerOverlay.style.opacity = '0';
            setTimeout(() => {
                window.location.href = 'heefwuhuefw.html';
            }, 200);
        }, 50); // about 1 frame at 20fps
    }

    // Start sequence
    typeText();
    ambientSound.volume = 0.2;
    heartbeatSound.volume = 0.25;
    ambientSound.play();
    heartbeatSound.play();

    // Audio enable fallback
    document.body.addEventListener('click', () => {
        ambientSound.play();
        heartbeatSound.play();
        staticSFX.play();
    });
});
