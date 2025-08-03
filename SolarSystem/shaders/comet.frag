#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

out vec4 outColor;

#define PI 3.14159265359

// Função hash simples para ruído
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Ruído 2D
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // Cometa movimentando-se
    vec2 cometPos = vec2(0.0, 0.0);
    cometPos.x += 0.5 * sin(u_time * 0.3);
    cometPos.y += 0.3 * cos(u_time * 0.2);

    vec2 toComet = uv - cometPos;
    float dist = length(toComet);
    float angle = atan(toComet.y, toComet.x);

    // Núcleo brilhante
    float core = exp(-dist * 50.0);

    // Cauda com ruído e suavização direcional
    float tailAngle = angle + PI;  // cauda oposta à direção do movimento
    float tail = max(0.0, dot(normalize(toComet), vec2(-1.0, 0.0)));
    tail *= exp(-dist * 10.0);
    tail *= 0.5 + 0.5 * noise(toComet * 15.0 + u_time * 0.5);

    vec3 color = vec3(0.0);
    color += vec3(1.0, 0.9, 0.7) * core;
    color += vec3(0.4, 0.6, 1.0) * tail;    

    // Vignette sutil
    float vignette = smoothstep(1.2, 0.0, length(uv));
    color *= vignette;

    outColor = vec4(color, 1.0);
}
