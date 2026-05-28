export class UI {
    constructor(simulation) {
        this.sim = simulation;
        this.params = {
            F: 0.006, k: 0.035, diffU: 0.07, diffV: 0.045,
            alpha: 0.0, delta: 0.0, beta: 0.0, gamma: 0.0,
            Kuu: 0.0, Kvv: 0.0, Kvu: 0.0, Kuv: 0.0,
            noise: 0.0, scale: 1.0, dt: 0.8,
            threshU: 0.5, threshV: 0.5,
            infUF: 0.0, infVF: 0.0, infUk: 0.0, infVk: 0.0,
            reflective: true, use9Point: true, reactActive: false,
            morphView: false,
            colorU: '#ff00ff', colorV: '#00ffff',
            resolution: 512,
            useLastSeed: false
        };

        this.memory = [null, null, null, null, null];

        this.init();
        this.loadLabels();
        this.updateUI(); // Initial visual sync
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
        const numericParams = ['F', 'k', 'diffU', 'diffV', 'alpha', 'delta', 'beta', 'gamma', 'Kuu', 'Kvv', 'Kvu', 'Kuv', 'noise', 'scale', 'dt', 'threshU', 'threshV', 'infUF', 'infVF', 'infUk', 'infVk'];
        
        numericParams.forEach(p => {
            const slider = document.getElementById(p);
            const valInput = document.getElementById('v' + p);
            if (slider && valInput) {
                slider.addEventListener('input', () => {
                    this.params[p] = parseFloat(slider.value);
                    valInput.value = this.params[p].toFixed(3);
                    if (p === 'threshU' || p === 'threshV') this.updateSwatches();
                });
                valInput.addEventListener('change', () => {
                    let val = parseFloat(valInput.value);
                    if (isNaN(val)) val = 0;
                    if (val > slider.max) slider.max = val * 1.5;
                    if (val < slider.min) slider.min = val * 1.5;
                    slider.value = val;
                    this.params[p] = val;
                    if (p === 'threshU' || p === 'threshV') this.updateSwatches();
                });
            }
        });

        const checkboxes = ['reflective', 'use9Point', 'reactActive', 'morphView', 'useLastSeed'];
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
                    this.updateSwatches();
                });
            }
        });

        document.getElementById('resSelector').addEventListener('change', (e) => {
            this.params.resolution = parseInt(e.target.value);
            this.sim.initTextures(this.params.resolution);
            if (this.params.useLastSeed) {
                this.notify("RESOLUTION CHANGED: SEED INVALIDATED");
            }
        });

        document.getElementById('reset').addEventListener('click', () => {
            const success = this.sim.reset(this.params.useLastSeed);
            if (this.params.useLastSeed) {
                if (success) {
                    this.notify("RESET TO PERSISTENT SEED");
                } else {
                    this.notify("SEED FAILED (RES MISMATCH OR NO SEED)");
                }
            } else {
                this.notify("RESET TO RANDOM NOISE");
            }
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
            noise: 0, reactActive: false, scale: 1.0,
            infUF: 0, infVF: 0, infUk: 0, infVk: 0
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
        this.updateSwatches();
    }

    updateSwatches() {
        const hexToRgb = (hex) => [
            parseInt(hex.slice(1, 3), 16),
            parseInt(hex.slice(3, 5), 16),
            parseInt(hex.slice(5, 7), 16)
        ];

        const colorU = hexToRgb(this.params.colorU);
        const colorV = hexToRgb(this.params.colorV);

        const mix = (u, v) => {
            const r = Math.round(Math.min(255, colorU[0] * u + colorV[0] * v));
            const g = Math.round(Math.min(255, colorU[1] * u + colorV[1] * v));
            const b = Math.round(Math.min(255, colorU[2] * u + colorV[2] * v));
            return `rgb(${r}, ${g}, ${b})`;
        };

        const swU = document.getElementById('swatchU');
        const swV = document.getElementById('swatchV');
        if (swU) swU.style.background = mix(this.params.threshU, 0);
        if (swV) swV.style.background = mix(0, this.params.threshV);
    }

    takeSnapshot() {
        const now = new Date();
        const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        
        // Build a parameter string for the filename
        const p = this.params;
        const dna = `F${p.F}_k${p.k}_dU${p.diffU}_dV${p.diffV}_a${p.alpha}_d${p.delta}_b${p.beta}_g${p.gamma}_Kuu${p.Kuu}_Kvv${p.Kvv}_Kuv${p.Kuv}_Kvu${p.Kvu}_N${p.noise}_react${p.reactActive}_infUF${p.infUF}_infVF${p.infVF}_infUk${p.infUk}_infVk${p.infVk}`.replace(/\./g, 'p');
        
        const link = document.createElement('a');
        link.download = `RIPPLE_${timestamp}_${dna}.png`;
        link.href = this.sim.canvas.toDataURL();
        link.click();
    }

    // State I/O tools
    exportState() {
        const data = this.sim.dumpState();
        const blob = new Blob([data.buffer], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.download = 'ripple_seed.bin';
        link.href = URL.createObjectURL(blob);
        link.click();
        this.notify("STATE DUMPED TO .BIN");
    }

    async importState(file) {
        const buffer = await file.arrayBuffer();
        const data = new Float32Array(buffer);
        
        // Calculate resolution: sqrt(total pixels / 4 channels)
        const totalPixels = data.length / 4;
        const res = Math.sqrt(totalPixels);

        if (!Number.isInteger(res)) {
            this.notify("IMPORT FAILED: INVALID BINARY DATA");
            return;
        }

        if (res !== this.params.resolution) {
            this.params.resolution = res;
            this.sim.initTextures(res); // This clears textures but sets internal width/height
            
            // Sync UI selector
            const resSelector = document.getElementById('resSelector');
            if (resSelector) {
                // Add option if it doesn't exist (e.g. if loaded from a non-standard dump)
                if (![...resSelector.options].some(opt => parseInt(opt.value) === res)) {
                    const opt = document.createElement('option');
                    opt.value = res;
                    opt.textContent = `${res} (Custom)`;
                    resSelector.appendChild(opt);
                }
                resSelector.value = res;
            }
            this.notify(`RES SYNCED TO ${res}x${res}`);
        }

        this.sim.loadState(data);
        this.notify("STATE LOADED FROM .BIN");
    }

    // Batch sweeper
    async runBatch(combinations, stepsPerCombination = 500) {
        this.notify(`BATCH START: ${combinations.length} RUNS`);
        
        // Save current base state
        const baseState = this.sim.dumpState();
        
        // Prepare CSV Log
        let csvContent = "timestamp,filename," + Object.keys(this.params).join(",") + "\n";

        for (let i = 0; i < combinations.length; i++) {
            // 1. Reset to base state
            this.sim.loadState(baseState);
            
            // 2. Load params for this run (MERGE with existing params to keep background fixed)
            Object.assign(this.params, combinations[i]);
            this.updateUI();

            // 3. Sim for N steps
            const iterations = Math.ceil(stepsPerCombination / 36);
            for (let j = 0; j < iterations; j++) {
                this.sim.step(this.params);
            }

            // 4. Snapshot & Log
            this.sim.render(this.params);
            
            const now = new Date();
            const timestamp = `${now.getHours()}${now.getMinutes()}${now.getSeconds()}_${i}`;
            const p = this.params;
            const dna = `F${p.F}_k${p.k}_dU${p.diffU}_dV${p.diffV}_a${p.alpha}_d${p.delta}_b${p.beta}_g${p.gamma}_Kuu${p.Kuu}_Kvv${p.Kvv}_Kuv${p.Kuv}_Kvu${p.Kvu}_N${p.noise}_react${p.reactActive}_infUF${p.infUF}_infVF${p.infVF}_infUk${p.infUk}_infVk${p.infVk}`.replace(/\./g, 'p');
            const filename = `RIPPLE_BATCH_${timestamp}_${dna}.png`;
            
            // Download PNG
            const link = document.createElement('a');
            link.download = filename;
            link.href = this.sim.canvas.toDataURL();
            link.click();

            // Add to CSV
            const paramValues = Object.values(this.params).join(",");
            csvContent += `${timestamp},${filename},${paramValues}\n`;
            
            this.notify(`RUN ${i+1}/${combinations.length} DONE`);
            await new Promise(resolve => setTimeout(resolve, 800)); // Slightly longer for stability
        }
        
        // Download CSV Log
        const csvBlob = new Blob([csvContent], { type: 'text/csv' });
        const csvLink = document.createElement('a');
        csvLink.download = `RIPPLE_BATCH_LOG_${Date.now()}.csv`;
        csvLink.href = URL.createObjectURL(csvBlob);
        csvLink.click();

        this.notify("BATCH COMPLETE & LOGGED");
    }

    getParams() {
        return this.params;
    }
}

