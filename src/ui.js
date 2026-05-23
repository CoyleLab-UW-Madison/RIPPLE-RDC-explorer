export class UI {
    constructor(simulation) {
        this.sim = simulation;
        this.params = {
            F: 0.006, k: 0.035, diffU: 0.07, diffV: 0.045,
            alpha: 0.0, delta: 0.0, beta: 0.0, gamma: 0.0,
            Kuu: 0.0, Kvv: 0.0, Kvu: 0.0, Kuv: 0.0,
            noise: 0.0, scale: 1.0, dt: 0.8,
            fatigue: 0.5, threshold: 0.5,
            reflective: true, use9Point: true, fatigueToggle: false,
            morphView: false,
            colorU: '#ff00ff', colorV: '#00ffff',
            resolution: 512
        };

        this.memory = [null, null, null, null, null];

        this.init();
        this.loadLabels();
    }

    async loadLabels() {
        try {
            const resp = await fetch('src/labels.json');
            const labels = await resp.json();
            document.querySelectorAll('[data-label]').forEach(el => {
                const key = el.getAttribute('data-label');
                if (labels[key]) el.textContent = labels[key];
            });
        } catch (e) {
            console.error('Failed to load labels:', e);
        }
    }

    init() {
        const numericParams = ['F', 'k', 'diffU', 'diffV', 'alpha', 'delta', 'beta', 'gamma', 'Kuu', 'Kvv', 'Kvu', 'Kuv', 'noise', 'scale', 'dt', 'fatigue', 'threshold'];
        
        numericParams.forEach(p => {
            const slider = document.getElementById(p);
            const valInput = document.getElementById('v' + p);
            if (slider && valInput) {
                slider.addEventListener('input', () => {
                    this.params[p] = parseFloat(slider.value);
                    valInput.value = this.params[p].toFixed(3);
                });
                valInput.addEventListener('change', () => {
                    let val = parseFloat(valInput.value);
                    if (isNaN(val)) val = 0;
                    if (val > slider.max) slider.max = val * 1.5;
                    if (val < slider.min) slider.min = val * 1.5;
                    slider.value = val;
                    this.params[p] = val;
                });
            }
        });

        const checkboxes = ['reflective', 'use9Point', 'fatigueToggle', 'morphView'];
        checkboxes.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    this.params[id] = el.checked;
                });
            }
        });

        const colors = ['colorU', 'colorV'];
        colors.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => {
                    this.params[id] = el.value;
                });
            }
        });

        document.getElementById('resSelector').addEventListener('change', (e) => {
            this.params.resolution = parseInt(e.target.value);
            this.sim.initTextures(this.params.resolution);
        });

        document.getElementById('reset').addEventListener('click', () => {
            this.sim.reset();
        });

        document.getElementById('pureBtn').addEventListener('click', () => {
            this.resetToPure();
        });

        document.getElementById('snapshot').addEventListener('click', () => {
            this.takeSnapshot();
        });

        // Hotkey management
        window.addEventListener('keydown', (e) => {
            // Check if user is typing in an input
            if (e.target.tagName === 'INPUT') return;

            // Use e.code (e.g., 'Digit1') which is layout independent and ignores shift for the key itself
            if (e.code.startsWith('Digit')) {
                const num = parseInt(e.code.replace('Digit', ''));
                if (num >= 1 && num <= 5) {
                    const idx = num - 1;
                    if (e.shiftKey) {
                        this.saveMemory(idx);
                    } else {
                        this.loadMemory(idx);
                    }
                }
            }
        });

        // Mouse handling
        this.sim.canvas.addEventListener('mousedown', () => this.isMouseDown = true);
        window.addEventListener('mouseup', () => this.isMouseDown = false);
        this.sim.canvas.addEventListener('mousemove', (e) => {
            this.sim.updateMouse(e.clientX, e.clientY, this.isMouseDown, this.params.scale);
        });
    }

    notify(text) {
        const el = document.getElementById('notification');
        if (!el) return;
        el.textContent = text;
        el.style.opacity = '1';
        if (this._notifyTimeout) clearTimeout(this._notifyTimeout);
        this._notifyTimeout = setTimeout(() => {
            el.style.opacity = '0';
        }, 1500);
    }

    saveMemory(idx) {
        this.memory[idx] = JSON.parse(JSON.stringify(this.params));
        const indicator = document.getElementById(`slot-${idx + 1}`);
        if (indicator) indicator.style.background = '#00ffcc';
        this.notify(`SAVED TO ${idx + 1}`);
    }

    loadMemory(idx) {
        if (this.memory[idx]) {
            Object.assign(this.params, JSON.parse(JSON.stringify(this.memory[idx])));
            this.updateUI();
            this.notify(`LOADED ${idx + 1}`);
        } else {
            this.notify(`SLOT ${idx + 1} EMPTY`);
        }
    }

    resetToPure() {
        const pureParams = {
            alpha: 0, delta: 0, beta: 0, gamma: 0,
            Kuu: 0, Kvv: 0, Kvu: 0, Kuv: 0,
            noise: 0, fatigueToggle: false, scale: 1.0
        };

        Object.assign(this.params, pureParams);
        this.updateUI();
        this.notify("RESET TO PURE GRAY-SCOTT");
    }

    updateUI() {
        for (const [key, val] of Object.entries(this.params)) {
            const slider = document.getElementById(key);
            const valInput = document.getElementById('v' + key);
            const cb = document.getElementById(key);
            const color = document.getElementById(key);
            
            if (slider && slider.type === 'range') {
                slider.value = val;
                if (valInput) valInput.value = (typeof val === 'number') ? val.toFixed(3) : val;
            } else if (cb && cb.type === 'checkbox') {
                cb.checked = val;
            } else if (color && color.type === 'color') {
                color.value = val;
            } else if (valInput && !slider) {
                 valInput.value = (typeof val === 'number') ? val.toFixed(3) : val;
            }
        }
    }

    takeSnapshot() {
        const now = new Date();
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        
        // Build a parameter string for the filename
        const p = this.params;
        const dna = `F${p.F}_k${p.k}_dU${p.diffU}_dV${p.diffV}_a${p.alpha}_d${p.delta}_b${p.beta}_g${p.gamma}_Kuu${p.Kuu}_Kvv${p.Kvv}_Kuv${p.Kuv}_Kvu${p.Kvu}_N${p.noise}`.replace(/\./g, 'p');
        
        const link = document.createElement('a');
        link.download = `RIPPLE_${timestamp}_${dna}.png`;
        link.href = this.sim.canvas.toDataURL();
        link.click();
    }

    getParams() {
        return this.params;
    }
}
