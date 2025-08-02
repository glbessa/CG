# Guia de Contribuição - Computação Gráfica UFPel

## Bem-vindo!

Obrigado pelo interesse em contribuir para este projeto de Computação Gráfica! Este guia irá ajudá-lo a entender como o projeto está estruturado e como você pode adicionar novos experimentos ou melhorar os existentes.

## 🏗️ Estrutura do Projeto

### Organização de Diretórios
- **Cada projeto** tem seu próprio diretório
- **Recursos compartilhados** ficam em `/static/`
- **Documentação específica** em subdirretórios `/documentation/`

### Convenções de Nomenclatura
- **Diretórios**: PascalCase (ex: `SlidingTriangle`)
- **Arquivos**: kebab-case para utilitários, PascalCase para projetos
- **Classes**: PascalCase (ex: `CelestialBody`)
- **Funções**: camelCase (ex: `createShader`)

## 🚀 Adicionando um Novo Projeto

### 1. Setup Básico

Crie um novo diretório para seu projeto:
```bash
mkdir MeuProjeto
cd MeuProjeto
```

### 2. Template HTML Padrão

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Projeto - WebGL2</title>
    
    <!-- Estilos -->
    <link rel="stylesheet" href="../static/global.css">
    
    <!-- Bibliotecas necessárias -->
    <script src="../static/gl-matrix-min.js"></script>
    <script src="../static/utils.js"></script>
</head>
<body>
    <!-- Canvas para renderização -->
    <canvas id="canvas"></canvas>
    
    <!-- Vertex Shader -->
    <script id="vertexShader" type="x-shader/x-vertex">
        #version 300 es
        in vec4 a_position;
        uniform mat4 u_worldViewProjection;
        
        void main() {
            gl_Position = u_worldViewProjection * a_position;
        }
    </script>
    
    <!-- Fragment Shader -->
    <script id="fragmentShader" type="x-shader/x-fragment">
        #version 300 es
        precision highp float;
        
        uniform vec4 u_color;
        out vec4 outColor;
        
        void main() {
            outColor = u_color;
        }
    </script>
    
    <!-- Script principal -->
    <script type="module">
        // Seu código aqui
    </script>
</body>
</html>
```

### 3. Estrutura JavaScript Básica

```javascript
// Importações
import '../static/gl-matrix-min.js';
const { mat4, vec3 } = glMatrix;

// Setup do WebGL
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    console.error("WebGL2 não suportado");
}

// Funções principais
function init() {
    // Inicialização dos shaders
    // Setup dos buffers
    // Configuração inicial
}

function render() {
    // Lógica de renderização
    // Update dos uniforms
    // Draw calls
}

function main() {
    init();
    
    function loop(time) {
        render(time);
        requestAnimationFrame(loop);
    }
    
    requestAnimationFrame(loop);
}

main();
```

## 🎨 Padrões de Desenvolvimento

### Shaders GLSL ES 3.00

**Sempre use a versão 3.00**:
```glsl
#version 300 es
```

**Vertex Shader padrão**:
```glsl
#version 300 es
in vec4 a_position;
in vec3 a_normal;
in vec2 a_texcoord;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_worldInverseTranspose;

out vec3 v_normal;
out vec2 v_texcoord;
out vec3 v_worldPosition;

void main() {
    gl_Position = u_worldViewProjection * a_position;
    v_normal = mat3(u_worldInverseTranspose) * a_normal;
    v_texcoord = a_texcoord;
    v_worldPosition = (u_world * a_position).xyz;
}
```

**Fragment Shader padrão**:
```glsl
#version 300 es
precision highp float;

in vec3 v_normal;
in vec2 v_texcoord;
in vec3 v_worldPosition;

uniform vec3 u_lightWorldPos;
uniform vec3 u_viewWorldPosition;
uniform vec4 u_color;

out vec4 outColor;

void main() {
    vec3 normal = normalize(v_normal);
    vec3 surfaceToLightDirection = normalize(u_lightWorldPos - v_worldPosition);
    float light = dot(normal, surfaceToLightDirection);
    
    outColor = vec4(u_color.rgb * light, u_color.a);
}
```

### Gestão de Recursos

**Buffers**:
```javascript
// Sempre limpe os recursos
function cleanup() {
    gl.deleteBuffer(positionBuffer);
    gl.deleteBuffer(normalBuffer);
    gl.deleteProgram(program);
    gl.deleteVertexArray(vao);
}
```

**Texturas**:
```javascript
// Use TWGL para simplificar
import * as twgl from '../static/twgl/twgl-full.module.js';

const texture = twgl.createTexture(gl, {
    src: 'path/to/texture.jpg',
    crossOrigin: ''
});
```

### Error Handling

```javascript
function checkShaderError(gl, shader) {
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Erro no shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function checkProgramError(gl, program) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Erro no program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}
```

## 🔧 Ferramentas e Utilitários

### Usando as Classes Existentes

**DrawableObject**:
```javascript
import { DrawableObject } from '../static/drawable-object.js';

class MyObject extends DrawableObject {
    constructor(vertexData) {
        super(vertexData);
    }
    
    draw(gl) {
        // Implementar renderização
    }
}
```

**Model Loader**:
```javascript
import { loadOBJ } from '../static/model-loader.js';

const model = await loadOBJ('path/to/model.obj');
```

### Matemática 3D

```javascript
// Sempre use gl-matrix para operações matemáticas
const { mat4, vec3, quat } = glMatrix;

// Criar matrizes
const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

// Transformações
mat4.translate(modelMatrix, modelMatrix, [x, y, z]);
mat4.rotate(modelMatrix, modelMatrix, angle, [0, 1, 0]);
mat4.scale(modelMatrix, modelMatrix, [sx, sy, sz]);
```

## 📋 Checklist para Novo Projeto

### Antes de Submeter

- [ ] **WebGL2 Compatibility**: Testado em Chrome, Firefox, Safari
- [ ] **Mobile Responsive**: Funciona em dispositivos móveis
- [ ] **Error Handling**: Trata casos de erro graciosamente
- [ ] **Performance**: Mantém 60 FPS na maioria dos dispositivos
- [ ] **Code Style**: Segue as convenções do projeto
- [ ] **Documentation**: Inclui comentários explicativos
- [ ] **Console Clean**: Sem erros ou warnings no console

### Estrutura Mínima

- [ ] `index.html` com shaders embarcados
- [ ] Inicialização adequada do WebGL2
- [ ] Loop de renderização
- [ ] Cleanup de recursos
- [ ] Documentação inline

### Opcionais Recomendados

- [ ] Controles interativos
- [ ] Interface de usuário
- [ ] Múltiplas câmeras/views
- [ ] Exportação de screenshots
- [ ] Parâmetros configuráveis

## 🎯 Tipos de Projetos Bem-vindos

### Básicos
- Primitivas geométricas
- Transformações 2D/3D
- Interpolação de cores
- Animações simples

### Intermediários
- Sistemas de câmera
- Carregamento de modelos
- Mapeamento de texturas
- Iluminação básica

### Avançados
- Simulações físicas
- Geração procedural
- Post-processing
- Sistemas de partículas

## 🐛 Debugging e Testes

### Ferramentas Recomendadas
- **WebGL Inspector**: Para análise de draw calls
- **Spector.js**: Profiling de performance
- **Browser DevTools**: Para debugging geral

### Testes de Compatibilidade
```javascript
// Verificar suporte a extensões
const ext = gl.getExtension('EXT_color_buffer_float');
if (!ext) {
    console.warn('Floating point textures não suportadas');
}

// Verificar limites do hardware
console.log('Max texture size:', gl.getParameter(gl.MAX_TEXTURE_SIZE));
console.log('Max vertex attributes:', gl.getParameter(gl.MAX_VERTEX_ATTRIBS));
```

## 📚 Recursos e Referências

### Documentação Oficial
- [WebGL2 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [GLSL ES 3.00 Reference](https://www.khronos.org/files/opengles_shading_language_3_00_spec.pdf)

### Tutoriais Recomendados
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
- [Learn OpenGL](https://learnopengl.com/)

### Inspiração
- [Shadertoy](https://www.shadertoy.com/)
- [Three.js Examples](https://threejs.org/examples/)

## 🤝 Como Contribuir

1. **Fork** o repositório
2. **Crie** uma branch descritiva: `git checkout -b feature/meu-projeto`
3. **Desenvolva** seguindo este guia
4. **Teste** em diferentes navegadores
5. **Documente** seu código
6. **Commit** com mensagens descritivas
7. **Push** para sua branch
8. **Abra** um Pull Request

### Commit Messages
```
feat: adiciona simulação de fluidos
fix: corrige memory leak em texturas
docs: atualiza documentação da classe Camera
style: formata código seguindo padrões
refactor: reorganiza sistema de shaders
test: adiciona testes de compatibilidade
```

## ❓ Dúvidas e Suporte

- **Issues**: Use o sistema de issues do GitHub
- **Discussões**: Para dúvidas gerais sobre WebGL
- **Email**: Para questões específicas da disciplina

---

**Happy Coding! 🚀**

Lembre-se: O objetivo é aprender e experimentar com computação gráfica. Não hesite em tentar coisas novas e compartilhar suas descobertas!
