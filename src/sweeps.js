/**
 * RIPPLE Batch Sweeper Script
 * Usage: Run `ui.runBatch(sweeps.viscosity, 2000)` in console.
 */

window.sweeps = {
    // 1. Viscosity Interaction (Alpha vs Delta)
    viscosity: (() => {
        const results = [];
        for (let a = 0; a <= 20; a += 5) {
            for (let d = 0; d <= 20; d += 5) {
                results.push({ alpha: a, delta: d });
            }
        }
        return results;
    })(),

    // 2. Tugging Miscibility (Kuu vs Kuv)
    tugging: (() => {
        const results = [];
        for (let kuu = -0.3; kuu <= 0.6; kuu += 0.2) {
            for (let kuv = -0.6; kuv <= 0.6; kuv += 0.3) {
                results.push({ Kuu: kuu, Kuv: kuv });
            }
        }
        return results;
    })(),

    // 3. Metabolic Coupling (infUF vs infVk)
    metabolic: (() => {
        const results = [];
        const vals = [-1.0, -0.5, 0, 0.5, 1.0];
        for (let uf of vals) {
            for (let vk of vals) {
                results.push({ reactActive: true, infUF: uf, infVk: vk });
            }
        }
        return results;
    })()
};

console.log("🔬 RIPPLE Sweeps Loaded: sweeps.viscosity, sweeps.tugging, sweeps.metabolic");
