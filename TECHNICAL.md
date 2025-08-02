# Documentação Técnica - WebGL2 Patterns

## Overview do Sistema WebGL2

Este documento fornece uma visão técnica detalhada dos padrões e práticas utilizadas neste projeto de Computação Gráfica.

## 🏗️ Arquitetura WebGL2

### Pipeline de Renderização

```
Vertex Data → Vertex Shader → Primitive Assembly → Rasterization → Fragment Shader → Output
     ↓              ↓              ↓                    ↓              ↓            ↓
  Buffers     Transformações   Clipping/Culling    Interpolação   Lighting/     Framebuffer
  Attributes    Projeção        Viewport           Texture        Texturing
```

### Estrutura de Dados Fundamental

```javascript
// Estrutura padrão de um objeto renderizável
const renderableObject = {
    // Geometria
    bufferInfo: {
        position: WebGLBuffer,
        normal: WebGLBuffer, 
        texcoord: WebGLBuffer,
        indices: WebGLBuffer
    },
    
    // Shader program
    programInfo: {
        program: WebGLProgram,
        uniforms: {},
        attributes: {}
    },
    
    // Transformações
    worldMatrix: Float32Array,
    
    // Material
    material: {
        diffuse: [r, g, b, a],
        texture: WebGLTexture,
        shininess: Number
    }
};
```

## 🎨 Shader Patterns

### Vertex Shader Template

```glsl
#version 300 es

// Input attributes
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;
in vec4 a_color;

// Transformation uniforms
uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

// Lighting uniforms
uniform vec3 u_lightWorldPos;
uniform vec3 u_viewWorldPosition;

// Output to fragment shader
out vec3 v_normal;
out vec3 v_surfaceToLight;
out vec3 v_surfaceToView;
out vec2 v_texcoord;
out vec4 v_color;

void main() {
    // Transform position to clip space
    gl_Position = u_worldViewProjection * a_position;
    
    // Calculate world position
    vec3 worldPosition = (u_world * a_position).xyz;
    
    // Transform normal to world space
    v_normal = mat3(u_worldInverseTranspose) * a_normal;
    
    // Calculate lighting vectors
    v_surfaceToLight = u_lightWorldPos - worldPosition;
    v_surfaceToView = u_viewWorldPosition - worldPosition;
    
    // Pass through texture coordinates and color
    v_texcoord = a_texcoord;
    v_color = a_color;
}
```

### Fragment Shader Template

```glsl
#version 300 es
precision highp float;

// Input from vertex shader
in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;
in vec2 v_texcoord;
in vec4 v_color;

// Material uniforms
uniform vec4 u_diffuse;
uniform sampler2D u_diffuseMap;
uniform vec4 u_specular;
uniform float u_shininess;
uniform vec3 u_ambientLight;

// Output color
out vec4 outColor;

void main() {
    // Normalize vectors
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    
    // Sample texture
    vec4 diffuseMapColor = texture(u_diffuseMap, v_texcoord);
    vec4 effectiveDiffuse = u_diffuse * diffuseMapColor * v_color;
    
    // Calculate lighting
    float light = dot(normal, surfaceToLightDirection);
    float specularLight = light > 0.0 ? pow(dot(normal, halfVector), u_shininess) : 0.0;
    
    // Combine lighting components
    vec3 ambient = effectiveDiffuse.rgb * u_ambientLight;
    vec3 diffuse = effectiveDiffuse.rgb * light;
    vec3 specular = u_specular.rgb * specularLight;
    
    outColor = vec4(ambient + diffuse + specular, effectiveDiffuse.a);
}
```

## 🔧 Performance Patterns

### Buffer Management

```javascript
class BufferManager {
    constructor(gl) {
        this.gl = gl;
        this.buffers = new Map();
    }
    
    createBuffer(name, data, usage = this.gl.STATIC_DRAW) {
        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage);
        
        this.buffers.set(name, {
            buffer,
            size: data.length,
            usage
        });
        
        return buffer;
    }
    
    updateBuffer(name, data, offset = 0) {
        const bufferInfo = this.buffers.get(name);
        if (!bufferInfo) return;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, bufferInfo.buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, offset, data);
    }
    
    cleanup() {
        for (const [name, info] of this.buffers) {
            this.gl.deleteBuffer(info.buffer);
        }
        this.buffers.clear();
    }
}
```

### Instanced Rendering

```javascript
// Setup para renderização instanciada
function setupInstancing(gl, program, instanceCount) {
    // Buffer para matrizes de transformação (uma por instância)
    const instanceMatrixBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceMatrixBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, instanceCount * 16 * 4, gl.DYNAMIC_DRAW);
    
    // Setup attributes da matriz (4 vec4s = 1 mat4)
    for (let i = 0; i < 4; i++) {
        const loc = gl.getAttribLocation(program, `a_instanceMatrix${i}`);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16 * 4, i * 4 * 4);
        gl.vertexAttribDivisor(loc, 1); // Uma por instância
    }
    
    return instanceMatrixBuffer;
}

// Renderização
function renderInstanced(gl, instanceCount, vertexCount) {
    gl.drawArraysInstanced(gl.TRIANGLES, 0, vertexCount, instanceCount);
}
```

## 📊 Matrix Mathematics

### Transformation Hierarchy

```javascript
class Transform {
    constructor() {
        this.position = vec3.create();
        this.rotation = quat.create();
        this.scale = vec3.fromValues(1, 1, 1);
        this.parent = null;
        this.children = [];
        
        this.localMatrix = mat4.create();
        this.worldMatrix = mat4.create();
        this.dirty = true;
    }
    
    updateMatrices() {
        if (this.dirty) {
            // Calcular matriz local
            mat4.fromRotationTranslationScale(
                this.localMatrix,
                this.rotation,
                this.position,
                this.scale
            );
            
            // Calcular matriz mundial
            if (this.parent) {
                mat4.multiply(
                    this.worldMatrix,
                    this.parent.worldMatrix,
                    this.localMatrix
                );
            } else {
                mat4.copy(this.worldMatrix, this.localMatrix);
            }
            
            this.dirty = false;
        }
        
        // Atualizar filhos
        for (const child of this.children) {
            child.updateMatrices();
        }
    }
    
    setPosition(x, y, z) {
        vec3.set(this.position, x, y, z);
        this.markDirty();
    }
    
    setRotation(x, y, z, w) {
        quat.set(this.rotation, x, y, z, w);
        this.markDirty();
    }
    
    markDirty() {
        this.dirty = true;
        for (const child of this.children) {
            child.markDirty();
        }
    }
}
```

### Camera System

```javascript
class Camera {
    constructor() {
        this.position = vec3.create();
        this.target = vec3.create();
        this.up = vec3.fromValues(0, 1, 0);
        
        this.fov = Math.PI / 4; // 45 graus
        this.aspect = 1;
        this.near = 0.1;
        this.far = 1000;
        
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        this.viewProjectionMatrix = mat4.create();
    }
    
    updateMatrices() {
        // View matrix
        mat4.lookAt(this.viewMatrix, this.position, this.target, this.up);
        
        // Projection matrix
        mat4.perspective(
            this.projectionMatrix,
            this.fov,
            this.aspect,
            this.near,
            this.far
        );
        
        // Combined matrix
        mat4.multiply(
            this.viewProjectionMatrix,
            this.projectionMatrix,
            this.viewMatrix
        );
    }
    
    // Screen to world ray casting
    screenToWorldRay(screenX, screenY, screenWidth, screenHeight) {
        // Normalize screen coordinates to NDC
        const ndc = vec3.fromValues(
            (screenX / screenWidth) * 2 - 1,
            -((screenY / screenHeight) * 2 - 1),
            1 // Far plane
        );
        
        // Inverse projection
        const invProjection = mat4.create();
        mat4.invert(invProjection, this.projectionMatrix);
        
        const eyeCoords = vec3.create();
        vec3.transformMat4(eyeCoords, ndc, invProjection);
        
        // Inverse view
        const invView = mat4.create();
        mat4.invert(invView, this.viewMatrix);
        
        const worldCoords = vec3.create();
        vec3.transformMat4(worldCoords, eyeCoords, invView);
        
        // Ray direction
        const direction = vec3.create();
        vec3.subtract(direction, worldCoords, this.position);
        vec3.normalize(direction, direction);
        
        return {
            origin: this.position,
            direction: direction
        };
    }
}
```

## 🎯 Lighting Models

### Phong Lighting (Per-Pixel)

```glsl
// Fragment shader
vec3 calculatePhongLighting(
    vec3 normal,
    vec3 lightDir,
    vec3 viewDir,
    vec3 lightColor,
    vec3 materialDiffuse,
    vec3 materialSpecular,
    float shininess
) {
    // Ambient
    vec3 ambient = 0.1 * materialDiffuse;
    
    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor * materialDiffuse;
    
    // Specular
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * lightColor * materialSpecular;
    
    return ambient + diffuse + specular;
}
```

### Blinn-Phong Lighting

```glsl
vec3 calculateBlinnPhongLighting(
    vec3 normal,
    vec3 lightDir,
    vec3 viewDir,
    vec3 lightColor,
    vec3 materialDiffuse,
    vec3 materialSpecular,
    float shininess
) {
    // Ambient
    vec3 ambient = 0.1 * materialDiffuse;
    
    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * lightColor * materialDiffuse;
    
    // Specular (Blinn-Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
    vec3 specular = spec * lightColor * materialSpecular;
    
    return ambient + diffuse + specular;
}
```

## 🔍 Debugging Tools

### WebGL State Inspector

```javascript
class WebGLStateInspector {
    constructor(gl) {
        this.gl = gl;
    }
    
    logCurrentState() {
        console.group('WebGL State');
        
        // Viewport
        const viewport = this.gl.getParameter(this.gl.VIEWPORT);
        console.log('Viewport:', viewport);
        
        // Current program
        const program = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
        console.log('Current Program:', program);
        
        // Buffers
        const arrayBuffer = this.gl.getParameter(this.gl.ARRAY_BUFFER_BINDING);
        const elementBuffer = this.gl.getParameter(this.gl.ELEMENT_ARRAY_BUFFER_BINDING);
        console.log('Array Buffer:', arrayBuffer);
        console.log('Element Buffer:', elementBuffer);
        
        // Textures
        const texture2D = this.gl.getParameter(this.gl.TEXTURE_BINDING_2D);
        const textureCube = this.gl.getParameter(this.gl.TEXTURE_BINDING_CUBE_MAP);
        console.log('2D Texture:', texture2D);
        console.log('Cube Texture:', textureCube);
        
        // Capabilities
        console.log('Depth Test:', this.gl.isEnabled(this.gl.DEPTH_TEST));
        console.log('Cull Face:', this.gl.isEnabled(this.gl.CULL_FACE));
        console.log('Blend:', this.gl.isEnabled(this.gl.BLEND));
        
        console.groupEnd();
    }
    
    checkForErrors() {
        const error = this.gl.getError();
        if (error !== this.gl.NO_ERROR) {
            const errorName = this.getErrorName(error);
            console.error(`WebGL Error: ${errorName} (${error})`);
            return false;
        }
        return true;
    }
    
    getErrorName(error) {
        const errorMap = {
            [this.gl.INVALID_ENUM]: 'INVALID_ENUM',
            [this.gl.INVALID_VALUE]: 'INVALID_VALUE',
            [this.gl.INVALID_OPERATION]: 'INVALID_OPERATION',
            [this.gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
            [this.gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
            [this.gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL'
        };
        return errorMap[error] || 'UNKNOWN_ERROR';
    }
}
```

### Performance Monitor

```javascript
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = 0;
        this.frameTime = 0;
        this.fps = 0;
        this.drawCalls = 0;
        this.triangles = 0;
    }
    
    beginFrame(time) {
        this.frameTime = time - this.lastTime;
        this.lastTime = time;
        this.frameCount++;
        
        if (this.frameCount % 60 === 0) {
            this.fps = 1000 / this.frameTime;
            this.displayStats();
        }
        
        this.drawCalls = 0;
        this.triangles = 0;
    }
    
    recordDrawCall(vertexCount, instanceCount = 1) {
        this.drawCalls++;
        this.triangles += (vertexCount / 3) * instanceCount;
    }
    
    displayStats() {
        console.log(`FPS: ${this.fps.toFixed(1)}`);
        console.log(`Frame Time: ${this.frameTime.toFixed(2)}ms`);
        console.log(`Draw Calls: ${this.drawCalls}`);
        console.log(`Triangles: ${this.triangles}`);
    }
}
```

## 🚀 Optimization Techniques

### Frustum Culling

```javascript
class Frustum {
    constructor() {
        this.planes = Array(6).fill().map(() => vec4.create());
    }
    
    extractFromMatrix(viewProjectionMatrix) {
        const m = viewProjectionMatrix;
        
        // Left
        vec4.set(this.planes[0], m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12]);
        // Right
        vec4.set(this.planes[1], m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12]);
        // Bottom
        vec4.set(this.planes[2], m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13]);
        // Top
        vec4.set(this.planes[3], m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13]);
        // Near
        vec4.set(this.planes[4], m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14]);
        // Far
        vec4.set(this.planes[5], m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14]);
        
        // Normalize planes
        for (let i = 0; i < 6; i++) {
            const length = Math.sqrt(
                this.planes[i][0] * this.planes[i][0] +
                this.planes[i][1] * this.planes[i][1] +
                this.planes[i][2] * this.planes[i][2]
            );
            vec4.scale(this.planes[i], this.planes[i], 1.0 / length);
        }
    }
    
    sphereInFrustum(center, radius) {
        for (let i = 0; i < 6; i++) {
            const distance = vec3.dot(center, this.planes[i]) + this.planes[i][3];
            if (distance < -radius) {
                return false; // Outside
            }
        }
        return true; // Inside or intersecting
    }
}
```

### Level of Detail (LOD)

```javascript
class LODManager {
    constructor() {
        this.lodLevels = [];
    }
    
    addLODLevel(distance, geometry) {
        this.lodLevels.push({ distance, geometry });
        this.lodLevels.sort((a, b) => a.distance - b.distance);
    }
    
    selectLOD(cameraPosition, objectPosition) {
        const distance = vec3.distance(cameraPosition, objectPosition);
        
        for (let i = this.lodLevels.length - 1; i >= 0; i--) {
            if (distance >= this.lodLevels[i].distance) {
                return this.lodLevels[i].geometry;
            }
        }
        
        return this.lodLevels[0].geometry; // Highest detail
    }
}
```

## 📱 Mobile Considerations

### Touch Controls

```javascript
class TouchControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.touches = new Map();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    }
    
    onTouchStart(event) {
        event.preventDefault();
        for (const touch of event.changedTouches) {
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startTime: Date.now()
            });
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        if (this.touches.size === 1) {
            // Single finger - rotation
            const touch = event.touches[0];
            const lastTouch = this.touches.get(touch.identifier);
            
            const deltaX = touch.clientX - lastTouch.x;
            const deltaY = touch.clientY - lastTouch.y;
            
            this.onRotate?.(deltaX, deltaY);
            
            this.touches.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
                startTime: lastTouch.startTime
            });
        } else if (this.touches.size === 2) {
            // Two fingers - zoom/pan
            const touches = Array.from(event.touches);
            const currentDistance = this.getTouchDistance(touches[0], touches[1]);
            const lastDistance = this.getLastTouchDistance();
            
            if (lastDistance > 0) {
                const zoomFactor = currentDistance / lastDistance;
                this.onZoom?.(zoomFactor);
            }
        }
    }
    
    getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
```

### Adaptive Quality

```javascript
class AdaptiveQuality {
    constructor(gl) {
        this.gl = gl;
        this.targetFPS = 30;
        this.frameHistory = [];
        this.currentQuality = 1.0;
    }
    
    updateQuality(frameTime) {
        this.frameHistory.push(frameTime);
        if (this.frameHistory.length > 60) {
            this.frameHistory.shift();
        }
        
        const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        const currentFPS = 1000 / avgFrameTime;
        
        if (currentFPS < this.targetFPS * 0.8) {
            // Reduce quality
            this.currentQuality = Math.max(0.5, this.currentQuality - 0.1);
        } else if (currentFPS > this.targetFPS * 1.2) {
            // Increase quality
            this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
        }
        
        this.applyQualitySettings();
    }
    
    applyQualitySettings() {
        // Adjust canvas resolution
        const canvas = this.gl.canvas;
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        const renderWidth = Math.floor(displayWidth * this.currentQuality);
        const renderHeight = Math.floor(displayHeight * this.currentQuality);
        
        if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
            canvas.width = renderWidth;
            canvas.height = renderHeight;
            this.gl.viewport(0, 0, renderWidth, renderHeight);
        }
    }
}
```

---

Esta documentação técnica fornece os padrões fundamentais para desenvolvimento eficiente com WebGL2. Use estes patterns como base para seus próprios projetos e experimentos!
