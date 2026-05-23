precision highp float;
varying vec2 vUv;
uniform sampler2D u_state;
uniform vec3 u_colorU, u_colorV;
uniform bool u_morph;
uniform float u_time, u_scale;
void main() {
    vec2 uv = (vUv - 0.5) / u_scale + 0.5;
    float mask = 1.0;
    if (u_morph) {
        vec2 p = (vUv * 2.0 - 1.0);
        float angle = atan(p.y, p.x);
        float wobble = 0.04 * sin(angle * 6.0 + u_time) + 0.015 * sin(angle * 14.0 - u_time * 1.3);
        mask = smoothstep(0.85 + wobble, 0.83 + wobble, length(p));
        uv = 0.5 + ((p / (1.0 + length(p) * 0.4)) / u_scale) * 0.5;
    }
    vec4 state = texture2D(u_state, fract(uv));
    gl_FragColor = vec4((u_colorV * state.y + u_colorU * state.x) * mask, 1.0);
}
