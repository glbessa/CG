#version 300 es
in vec4 position;
in vec2 texcoord;
in vec3 normal;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_position;

void main() {
  gl_Position = u_worldViewProjection * position;
  v_texcoord = texcoord;

  // Transforma a normal para o espaço mundial
  v_normal = mat3(u_worldInverseTranspose) * normal;
  v_position = (u_world * position).xyz;
}