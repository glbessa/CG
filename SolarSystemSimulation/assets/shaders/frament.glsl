#version 300 es
precision highp float;

in vec3 v_normal;
in vec2 v_texcoord;
in vec3 v_worldPosition;

uniform vec3 u_lightWorldPos;
uniform vec3 u_viewWorldPosition;
uniform vec3 u_color;
uniform float u_shininess;
uniform bool u_isEmissive;

out vec4 outColor;

void main() {
    vec3 normal = normalize(v_normal);
    
    // If it's emissive (like the sun), just use the color
    if (u_isEmissive) {
        outColor = vec4(u_color, 1.0);
        return;
    }
    
    vec3 surfaceToLightDirection = normalize(u_lightWorldPos - v_worldPosition);
    vec3 surfaceToViewDirection = normalize(u_viewWorldPosition - v_worldPosition);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    
    float light = dot(normal, surfaceToLightDirection);
    float specular = 0.0;
    if (light > 0.0) {
        specular = pow(dot(normal, halfVector), u_shininess);
    }
    
    // Ambient light
    vec3 ambient = u_color * 0.1;
    
    // Diffuse light
    vec3 diffuse = u_color * light * 0.8;
    
    // Specular light
    vec3 specularColor = vec3(1.0, 1.0, 1.0) * specular * 0.3;
    
    outColor = vec4(ambient + diffuse + specularColor, 1.0);
}