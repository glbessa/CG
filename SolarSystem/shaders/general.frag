#version 300 es
precision highp float;

in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_position;

uniform sampler2D u_texture;
uniform bool u_useTexture;
uniform bool u_isEmissive;
uniform vec4 u_color;

uniform vec3 u_lightWorldPosition;
uniform vec3 u_viewWorldPosition;

out vec4 outColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(u_lightWorldPosition - v_position);
  vec3 surfaceToView = normalize(u_viewWorldPosition - v_position);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);

  float diffuse = max(dot(normal, surfaceToLight), 0.0);
  float specular = pow(max(dot(normal, halfVector), 0.0), 50.0); // brilho intenso

  vec4 baseColor = u_useTexture ? texture(u_texture, v_texcoord) : u_color;

  if (u_isEmissive) {
    outColor = baseColor;
  } else {
    vec3 finalColor = baseColor.rgb * diffuse + vec3(1.0) * specular;
    outColor = vec4(finalColor, baseColor.a);
  }
}