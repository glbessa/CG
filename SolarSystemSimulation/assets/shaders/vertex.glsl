#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 texcoord;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

out vec3 v_normal;
out vec2 v_texcoord;
out vec3 v_worldPosition;

void main() {
    gl_Position = u_worldViewProjection * vec4(position, 1.0);
    
    v_normal = mat3(u_worldInverseTranspose) * normal;
    v_texcoord = texcoord;
    v_worldPosition = (u_world * vec4(position, 1.0)).xyz;
}