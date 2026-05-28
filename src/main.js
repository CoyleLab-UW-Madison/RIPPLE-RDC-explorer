import { Simulation } from './simulation.js';
import { UI } from './ui.js';

async function start() {
    const canvas = document.getElementById('glCanvas');
    
    // Attempt to load initial seed
    let initialSeed = null;
    try {
        const response = await fetch('ripple_seed.bin');
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            initialSeed = new Float32Array(buffer);
            console.log("Initial seed loaded from ripple_seed.bin");
        }
    } catch (e) {
        console.log("No initial seed found or failed to load:", e);
    }

    const simulation = new Simulation(canvas, { 
        resolution: 512,
        initialSeed: initialSeed
    });
    
    // Wait for shaders to load
    await new Promise(resolve => {
        const check = setInterval(() => {
            if (simulation.texturesInitialized) {
                clearInterval(check);
                resolve();
            }
        }, 100);
    });

    const ui = new UI(simulation);
    window.ui = ui; // Expose for console research tools

    // Sidebar Resizer Logic
    const resizer = document.getElementById('resizer');
    const controls = document.getElementById('controls');
    let isResizing = false;

    resizer.addEventListener('pointerdown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        resizer.setPointerCapture(e.pointerId);
    });

    window.addEventListener('pointermove', (e) => {
        if (!isResizing) return;
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 600) {
            controls.style.width = `${newWidth}px`;
            controls.style.minWidth = `${newWidth}px`;
        }
    });

    window.addEventListener('pointerup', (e) => {
        isResizing = false;
        document.body.style.cursor = 'default';
        resizer.releasePointerCapture(e.pointerId);
    });

    function loop() {
        const params = ui.getParams();
        simulation.step(params);
        simulation.render(params);
        requestAnimationFrame(loop);
    }

    loop();
}

window.addEventListener('DOMContentLoaded', start);
