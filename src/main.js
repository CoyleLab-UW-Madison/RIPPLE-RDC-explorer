import { Simulation } from './simulation.js';
import { UI } from './ui.js';

async function start() {
    const canvas = document.getElementById('glCanvas');
    const simulation = new Simulation(canvas, { resolution: 512 });
    
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

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        const newWidth = e.clientX;
        if (newWidth > 200 && newWidth < 600) {
            controls.style.width = `${newWidth}px`;
            controls.style.minWidth = `${newWidth}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.style.cursor = 'default';
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
