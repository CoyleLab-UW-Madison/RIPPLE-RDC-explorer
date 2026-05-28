export class Simulation {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
        if (!this.gl.getExtension('OES_texture_float')) {
            alert('Float textures not supported on this device/browser');
        }

        this.width = config.resolution;
        this.height = config.resolution;
        this.fb = this.gl.createFramebuffer();
        this.texturesInitialized = false;
        
        this.programs = {};
        this.textures = { front: null, back: null };
        this.mouse = [0, 0, 0];
        
        this.lastLoadedState = null;
        this.lastSeedRes = 0;

        this.init();
    }

    async init() {
        const [vs, simFs, drawFs] = await Promise.all([
            fetch('src/shaders/base.vert').then(r => r.text()),
            fetch('src/shaders/simulation.frag').then(r => r.text()),
            fetch('src/shaders/display.frag').then(r => r.text())
        ]);

        this.programs.sim = this.createProgram(vs, simFs);
        this.programs.draw = this.createProgram(vs, drawFs);

        this.buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), this.gl.STATIC_DRAW);

        this.initTextures(this.width);
    }

    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const p = gl.createProgram();
        const s1 = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(s1, vsSource);
        gl.compileShader(s1);
        if (!gl.getShaderParameter(s1, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s1));

        const s2 = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(s2, fsSource);
        gl.compileShader(s2);
        if (!gl.getShaderParameter(s2, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s2));

        gl.attachShader(p, s1);
        gl.attachShader(p, s2);
        gl.linkProgram(p);
        return p;
    }

    initTextures(res) {
        this.texturesInitialized = false;
        this.width = res;
        this.height = res;
        const gl = this.gl;

        if (this.textures.back) gl.deleteTexture(this.textures.back);
        if (this.textures.front) gl.deleteTexture(this.textures.front);

        this.textures.back = this.createTexture();
        this.textures.front = this.createTexture();
        this.reset(false); // Always start fresh on resolution change/init
        this.texturesInitialized = true;
    }

    createTexture() {
        const gl = this.gl;
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        return tex;
    }

    reset(useLastSeed = false) {
        if (useLastSeed && this.lastLoadedState && this.lastSeedRes === this.width) {
            this.loadState(this.lastLoadedState, false);
            return true; // Indicate success
        }

        const data = new Float32Array(this.width * this.height * 4);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 1.0;
            if (Math.random() > 0.99) {
                data[i] = 0.5;
                data[i + 1] = 0.25;
            }
        }
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.textures.back);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.front);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);
        return false;
    }

    updateMouse(x, y, down, scale) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse[0] = ((x - rect.left) / rect.width - 0.5) / scale * this.width + (this.width / 2);
        this.mouse[1] = (0.5 - (y - rect.top) / rect.height) / scale * this.height + (this.height / 2);
        this.mouse[2] = down ? 1 : 0;
    }

    step(params) {
        if (!this.texturesInitialized) return;
        const gl = this.gl;
        const prog = this.programs.sim;

        gl.viewport(0, 0, this.width, this.height);
        gl.useProgram(prog);

        const time = performance.now() / 1000;

        for (let i = 0; i < 36; i++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures.front, 0);
            gl.bindTexture(gl.TEXTURE_2D, this.textures.back);

            gl.uniform2f(gl.getUniformLocation(prog, 'u_res'), this.width, this.height);
            gl.uniform3f(gl.getUniformLocation(prog, 'u_mouse'), this.mouse[0], this.mouse[1], this.mouse[2]);
            gl.uniform1i(gl.getUniformLocation(prog, 'u_reflective'), params.reflective ? 1 : 0);
            gl.uniform1i(gl.getUniformLocation(prog, 'u_use9Point'), params.use9Point ? 1 : 0);
            gl.uniform1i(gl.getUniformLocation(prog, 'u_reactActive'), params.reactActive ? 1 : 0);
            gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), time + i);

            // Set all numeric params
            for (const [key, value] of Object.entries(params)) {
                if (typeof value === 'number' && key !== 'scale') {
                    const loc = gl.getUniformLocation(prog, 'u_' + key);
                    if (loc) gl.uniform1f(loc, value);
                }
            }

            const posLoc = gl.getAttribLocation(prog, 'position');
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);

            let tmp = this.textures.back;
            this.textures.back = this.textures.front;
            this.textures.front = tmp;
        }
    }

    render(params) {
        if (!this.texturesInitialized) return;
        const gl = this.gl;
        const prog = this.programs.draw;

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.useProgram(prog);

        const hexToRgb = (hex) => [
            parseInt(hex.slice(1, 3), 16) / 255,
            parseInt(hex.slice(3, 5), 16) / 255,
            parseInt(hex.slice(5, 7), 16) / 255
        ];

        gl.uniform3fv(gl.getUniformLocation(prog, 'u_colorU'), hexToRgb(params.colorU));
        gl.uniform3fv(gl.getUniformLocation(prog, 'u_colorV'), hexToRgb(params.colorV));
        gl.uniform1i(gl.getUniformLocation(prog, 'u_morph'), params.morphView ? 1 : 0);
        gl.uniform1f(gl.getUniformLocation(prog, 'u_scale'), params.scale);
        gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), performance.now() / 1000);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.back);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // RESEARCH TOOLS: State Serialization
    dumpState() {
        const gl = this.gl;
        const pixels = new Float32Array(this.width * this.height * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures.back, 0);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.FLOAT, pixels);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return pixels;
    }

    loadState(data, saveAsSeed = true) {
        if (saveAsSeed) {
            this.lastLoadedState = new Float32Array(data);
            this.lastSeedRes = this.width;
        }
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.textures.back);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);
        gl.bindTexture(gl.TEXTURE_2D, this.textures.front);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, gl.FLOAT, data);
    }
}
