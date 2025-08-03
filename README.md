# Computação Gráfica - UFPel

![WebGL](https://img.shields.io/badge/WebGL-2.0-red)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![OpenGL](https://img.shields.io/badge/OpenGL-4.0+-blue)

Coleção de projetos e experimentos desenvolvidos durante a disciplina de Computação Gráfica na Universidade Federal de Pelotas (UFPel). Este repositório demonstra conceitos fundamentais de computação gráfica utilizando WebGL2 e JavaScript.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Projetos Inclusos](#projetos-inclusos)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Como Executar](#como-executar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Exemplos de Uso](#exemplos-de-uso)
- [Contribuição](#contribuição)
- [Licença](#licença)

## 🎯 Visão Geral

Este repositório contém uma série de projetos práticos que exploram diferentes aspectos da computação gráfica:

- **Fundamentos de WebGL2**: Renderização básica de primitivas
- **Transformações 2D/3D**: Translação, rotação e escala
- **Sistemas de Câmera**: Projeção e visualização 3D
- **Iluminação**: Modelos de sombreamento Phong e Lambert
- **Procedural Generation**: Geração procedural de terrenos
- **Simulação**: Sistema solar com corpos celestes
- **Texturas e Materiais**: Mapeamento de texturas
- **Animação**: Loops de animação e interpolação

## 🚀 Projetos Inclusos

### 1. HelloWorld
**Arquivo**: `HelloWorld/index.html`
- Primeiro programa WebGL2
- Renderização de um triângulo básico
- Introdução aos shaders

### 2. MultiColorTriangle
**Arquivo**: `MultiColorTriangle/index.html`
- Triângulo com interpolação de cores
- Uso de buffers de cores
- Vertex attributes

### 3. SlidingTriangle
**Arquivo**: `SlidingTriangle/index.html`
- Transformações 2D interativas
- Controles de translação, rotação e escala
- Matrizes de transformação

### 4. SpinningTriangle
**Arquivo**: `SpinningTriangle/index.html`
- Animação contínua de rotação
- Loop de renderização
- Classe DrawableObject

### 5. SlidingRectangle & AutoSlidingRectangle
**Arquivos**: `SlidingRectangle/index.html`, `AutoSlidingRectangle/index.html`
- Geometria retangular
- Animação automática vs. manual
- Controles de FPS

### 6. SpinningCube
**Diretório**: `SpinningCube/`
- Renderização 3D de cubos
- Sistema de câmera orbital
- Classe CelestialBody para objetos espaciais
- Documentação detalhada em `SpinningCube/documentation/`

### 7. SolarSystem (Sistema Solar)
**Diretório**: `SolarSystem/`
- Simulação completa do sistema solar
- Múltiplos corpos celestes com dados astronômicos reais
- Órbitas elípticas realísticas
- Texturas planetárias
- Coordenadas heliocêntricas
- Dados temporais para posicionamento preciso
- Sistema de câmera orbital e livre
- **Fatores de escala configuráveis**:
  - `CONFIG.bodyScale`: Controla o tamanho visual dos corpos celestes
  - `CONFIG.scale`: Controla as distâncias orbitais
- Interface de controle completa com informações da câmera
- Timeline astronômica com eventos históricos

### 8. ProceduralTerrainGeneration
**Diretório**: `ProceduralTerrainGeneration/`
- Geração procedural de terrenos
- Noise de Perlin
- Carregamento de modelos OBJ
- Instanciamento de objetos 3D

### 9. Letters
**Arquivo**: `Letters/index.html`
- Renderização de texto 3D
- Iluminação avançada
- TWGL.js para simplificação

### 10. SceneEditor
**Arquivo**: `SceneEditor/index.html`
- Editor interativo de cena
- Manipulação de objetos em tempo real
- Interface de usuário integrada

## 🛠️ Tecnologias Utilizadas

### Core Technologies
- **WebGL 2.0**: API de renderização
- **JavaScript ES6+**: Linguagem principal
- **HTML5 Canvas**: Superfície de renderização
- **GLSL ES 3.00**: Linguagem de shaders

### Bibliotecas
- **gl-matrix**: Operações matemáticas 3D
- **TWGL.js**: Simplificação da API WebGL
- **Perlin.js**: Geração de noise procedural
- **seedrandom.js**: Números aleatórios com seed

### Utilitários
- **model-loader.js**: Carregamento de modelos OBJ
- **drawable-object.js**: Classes base para objetos renderizáveis
- **utils.js**: Funções auxiliares
- **m4.js**: Operações de matriz 4x4

## 🎮 Como Executar

### Pré-requisitos
- Navegador moderno com suporte ao WebGL2
- Servidor HTTP local (recomendado)

### Execução Local

1. **Clone o repositório**:
```bash
git clone [URL_DO_REPOSITORIO]
cd CG
```

2. **Inicie um servidor HTTP**:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (se tiver http-server instalado)
npx http-server

# Live Server (VS Code extension)
# Clique direito em index.html > "Open with Live Server"
```

3. **Acesse no navegador**:
```
http://localhost:8000
```

4. **Navegue pelos projetos**:
- Página principal: `index.html`
- Projetos individuais: `[NomeDoProjeto]/index.html`

### Verificação do WebGL2
Para verificar se seu navegador suporta WebGL2:
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');
console.log(gl ? 'WebGL2 suportado!' : 'WebGL2 não suportado');
```

## 📁 Estrutura do Projeto

```
CG/
├── index.html                 # Página principal
├── README.md                  # Esta documentação
├── LICENSE                    # Licença do projeto
│
├── HelloWorld/               # Projeto básico
├── MultiColorTriangle/       # Triângulo multicolorido
├── SlidingTriangle/         # Transformações interativas
├── SpinningTriangle/        # Animação de rotação
├── SlidingRectangle/        # Retângulo deslizante
├── AutoSlidingRectangle/    # Animação automática
├── Letters/                 # Renderização de texto 3D
├── SceneEditor/            # Editor de cena
│
├── SpinningCube/           # Sistema de cubo 3D
│   ├── camera.js
│   ├── celestial-body.js
│   ├── index.html
│   ├── script.js
│   ├── system.js
│   ├── ui.js
│   ├── documentation/      # Documentação específica
│   └── textures/          # Texturas do projeto
│
├── SolarSystemSimulation/ # Simulação do sistema solar
│   ├── index.html
│   └── assets/
│       └── shaders/
│
├── ProceduralTerrainGeneration/  # Geração de terreno
│   ├── index.html
│   ├── index.js
│   ├── shader.vert
│   ├── shader.frag
│   └── assets/            # Modelos 3D (árvores, etc.)
│
└── static/                # Bibliotecas e utilitários
    ├── drawable-object.js
    ├── model-loader.js
    ├── utils.js
    ├── perlin.js
    ├── gl-matrix/         # Biblioteca de matemática 3D
    ├── twgl/             # Simplificação WebGL
    └── seedrandom/       # Números aleatórios
```

## 💡 Exemplos de Uso

### Criando um Novo Projeto

1. **Crie um novo diretório**:
```bash
mkdir MeuProjeto
cd MeuProjeto
```

2. **HTML básico**:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Meu Projeto WebGL2</title>
    <script src="../static/gl-matrix-min.js"></script>
    <script src="../static/utils.js"></script>
</head>
<body>
    <canvas id="canvas"></canvas>
    <!-- Vertex Shader -->
    <script id="vertexShader" type="x-shader/x-vertex">
        #version 300 es
        in vec4 position;
        uniform mat4 u_worldViewProjection;
        void main() {
            gl_Position = u_worldViewProjection * position;
        }
    </script>
    <!-- Fragment Shader -->
    <script id="fragmentShader" type="x-shader/x-fragment">
        #version 300 es
        precision highp float;
        out vec4 outColor;
        void main() {
            outColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    </script>
    <script src="script.js"></script>
</body>
</html>
```

### Usando a Classe CelestialBody

```javascript
import CelestialBody from './SpinningCube/celestial-body.js';

// Criando um planeta
const earth = new CelestialBody({
    name: "Terra",
    radius: 1.0,
    color: [0.2, 0.6, 1.0, 1.0],
    rotationSpeed: [0, 0.01, 0],
    orbitRadius: 10,
    orbitSpeed: 0.005,
    textureUrl: "textures/earth.jpg"
});

// No loop de renderização
function render(time) {
    earth.update(time);
    earth.render(uniforms);
}
```

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. **Abra** um Pull Request

### Diretrizes de Contribuição
- Mantenha o código limpo e documentado
- Adicione comentários explicativos nos shaders
- Teste em diferentes navegadores
- Inclua documentação para novas features

## 📚 Recursos Adicionais

### Documentação de Referência
- [WebGL2 Specification](https://www.khronos.org/registry/webgl/specs/latest/2.0/)
- [GLSL ES 3.00 Specification](https://www.khronos.org/files/opengles_shading_language_3_00_spec.pdf)
- [gl-matrix Documentation](https://glmatrix.net/docs/)
- [TWGL.js Documentation](https://twgljs.org/)

### Tutoriais Recomendados
- [WebGL2 Fundamentals](https://webgl2fundamentals.org/)
- [Learn OpenGL](https://learnopengl.com/)
- [Real-Time Rendering](http://www.realtimerendering.com/)

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE) - veja o arquivo LICENSE para detalhes.

---

**Desenvolvido durante a disciplina de Computação Gráfica**  
**Universidade Federal de Pelotas (UFPel)**  
**Semestre: 2024/2**
