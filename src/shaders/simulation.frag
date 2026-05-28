precision highp float;
varying vec2 vUv;
uniform sampler2D u_state;
uniform vec2 u_res;
uniform float u_F, u_k, u_diffU, u_diffV, u_alpha, u_beta, u_gamma, u_delta, u_Kuu, u_Kvv, u_Kuv, u_Kvu, u_noise, u_time, u_dt;
uniform float u_threshU, u_threshV, u_infUF, u_infVF, u_infUk, u_infVk;
uniform vec3 u_mouse;
uniform bool u_reflective, u_use9Point, u_reactActive;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec2 getUV(vec2 uv) {
    if (!u_reflective) return fract(uv);
    vec2 m = mod(uv, 2.0);
    return mix(m, 2.0 - m, step(1.0, m));
}

void main() {
    vec2 texel = 1.0 / u_res;
    vec4 center = texture2D(u_state, vUv);
    vec4 n = texture2D(u_state, getUV(vUv + vec2(0.0, texel.y)));
    vec4 s = texture2D(u_state, getUV(vUv - vec2(0.0, texel.y)));
    vec4 e = texture2D(u_state, getUV(vUv + vec2(texel.x, 0.0)));
    vec4 w = texture2D(u_state, getUV(vUv - vec2(texel.x, 0.0)));

    vec2 lap;
    if (u_use9Point) {
        vec4 nw = texture2D(u_state, getUV(vUv + vec2(-texel.x,  texel.y)));
        vec4 ne = texture2D(u_state, getUV(vUv + vec2( texel.x,  texel.y)));
        vec4 sw = texture2D(u_state, getUV(vUv + vec2(-texel.x, -texel.y)));
        vec4 se = texture2D(u_state, getUV(vUv + vec2( texel.x, -texel.y)));
        lap = ((n.xy+s.xy+e.xy+w.xy)*0.2 + (nw.xy+ne.xy+sw.xy+se.xy)*0.05 - center.xy)*4.0; 
    } else {
        lap = (n.xy+s.xy+e.xy+w.xy - 4.0*center.xy);
    }

    vec2 gradU = vec2(e.x - w.x, n.x - s.x) * 0.5;
    vec2 gradV = vec2(e.y - w.y, n.y - s.y) * 0.5;

    float u = center.x; float v = center.y;

    // SHARED CONDENSATION PENALTIES
    float penU = smoothstep(u_threshU - 0.05, u_threshU + 0.05, u);
    float penV = smoothstep(u_threshV - 0.05, u_threshV + 0.05, v);

    // MODULATED DIFFUSIVITY
    float dU = u_diffU * exp(-u_alpha * penU - u_delta * penV);
    float dV = u_diffV * exp(-u_beta * penV - u_gamma * penU);

    float tugU = u_Kuu * (u*lap.x + dot(gradU, gradU)) + u_Kuv * (u*lap.y + dot(gradU, gradV));
    float tugV = u_Kvu * (v*lap.x + dot(gradV, gradU)) + u_Kvv * (v*lap.y + dot(gradV, gradV));

    float noiseU = (hash(vUv + u_time) - 0.5) * u_noise;
    float noiseV = (hash(vUv - u_time) - 0.5) * u_noise;

    // GENERALIZED REACTIVITY LOGIC
    float F_eff = u_F;
    float k_eff = u_k;

    if(u_reactActive) {
        F_eff *= (1.0 + u_infUF * penU) * (1.0 + u_infVF * penV);
        k_eff *= (1.0 + u_infUk * penU) * (1.0 + u_infVk * penV);
    }

    float du = dU * lap.x + tugU - u*v*v + F_eff * (1.0 - u) + noiseU;    float dv = dV * lap.y + tugV + u*v*v - (F_eff + k_eff) * v + noiseV;

    vec2 next = center.xy + vec2(du, dv) * u_dt;
    if(u_mouse.z > 0.5 && distance(vUv * u_res, u_mouse.xy) < 15.0) next = vec2(0.5, 0.25);
    gl_FragColor = vec4(clamp(next, 0.0, 1.0), 0.0, 1.0);
}

