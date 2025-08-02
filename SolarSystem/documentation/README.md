# SpinningCube - Sistema de Renderização 3D

## Visão Geral

O projeto SpinningCube é uma demonstração avançada de renderização 3D utilizando WebGL2, implementando um sistema completo de corpos celestes com câmera orbital, texturas e iluminação. Este projeto serve como base para simulações espaciais e demonstrações de conceitos 3D avançados.

## Arquitetura do Sistema

### Estrutura de Arquivos

```
SpinningCube/
├── index.html             # Interface principal
├── script.js              # Loop de renderização e lógica principal
├── init.js                # Inicialização do WebGL e configuração
├── camera.js              # Sistema de câmera orbital
├── celestial-body.js      # Classe para objetos 3D
├── system.js              # Sistema de múltiplos objetos
├── ui.js                  # Interface do usuário
├── shaders.js             # Definições de shaders
├── documentation/         # Documentação técnica
│   ├── README.md          # Esta documentação
│   └── CelestialBody.md   # Documentação da classe CelestialBody
└── textures/              # Texturas para os objetos
```

### Fluxo de Execução

1. **Inicialização** (`init.js`)
   - Configuração do contexto WebGL2
   - Compilação de shaders
   - Inicialização dos sistemas

2. **Setup da Cena** (`script.js`)
   - Criação de objetos CelestialBody
   - Configuração da câmera
   - Setup do sistema de renderização

3. **Loop de Renderização**
   - Atualização dos objetos (posição, rotação)
   - Atualização da câmera
   - Renderização da cena

## Características Técnicas

### WebGL2 Features Utilizadas
- **Vertex Array Objects (VAO)**: Para eficiência de renderização
- **Uniform Buffer Objects**: Para dados compartilhados
- **Texturing**: Mapeamento de texturas em objetos 3D
- **Depth Testing**: Para renderização correta de profundidade

### Shaders
- **Vertex Shader**: Transformações 3D, projeção de vértices
- **Fragment Shader**: Cálculos de iluminação, aplicação de texturas

### Sistema de Coordenadas
- **World Space**: Coordenadas globais da cena
- **View Space**: Relativo à posição da câmera
- **Clip Space**: Após projeção perspectiva

## Classes Principais

### CelestialBody
Classe base para todos os objetos renderizáveis na cena.

**Funcionalidades**:
- Geometria esférica procedural
- Sistema de texturas
- Transformações (translação, rotação, escala)
- Cálculos orbitais
- Renderização com iluminação

**Exemplo de uso**:
```javascript
const earth = new CelestialBody({
    name: "Terra",
    radius: 1.0,
    color: [0.2, 0.6, 1.0, 1.0],
    rotationSpeed: [0, 0.01, 0],
    orbitRadius: 10,
    orbitSpeed: 0.005,
    textureUrl: "textures/earth.jpg",
    isEmissive: false
});
```

### Camera
Sistema de câmera orbital com controles interativos.

**Características**:
- Rotação orbital ao redor do centro da cena
- Zoom controlado por scroll
- Projeção perspectiva
- View matrix automática

### System
Gerenciador de múltiplos objetos CelestialBody.

**Funcionalidades**:
- Adição/remoção de objetos
- Update em lote
- Renderização otimizada

## Interface do Usuário

### Controles Disponíveis
- **Mouse**: Rotação da câmera
- **Scroll**: Zoom in/out
- **Teclado**: Controles adicionais (se implementado)

### Indicadores
- **Modo de Câmera**: Mostra o estado atual da câmera
- **Velocidade**: Indicador de velocidade de animação
- **FPS**: Contador de frames por segundo

## Configuração e Personalização

### Adicionando Novos Objetos
```javascript
// Criar um novo planeta
const jupiter = new CelestialBody({
    name: "Júpiter",
    radius: 2.5,
    color: [1.0, 0.7, 0.3, 1.0],
    orbitRadius: 25,
    orbitSpeed: 0.002,
    rotationSpeed: [0, 0.02, 0],
    textureUrl: "textures/jupiter.jpg"
});

// Adicionar ao sistema
system.addBody(jupiter);
```

### Customizando Shaders
Os shaders estão definidos em `shaders.js` e podem ser modificados para:
- Adicionar novos efeitos de iluminação
- Implementar materials diferentes
- Adicionar animações no vertex shader

### Texturas
Adicione texturas na pasta `textures/` e referencie no construtor do CelestialBody:
```javascript
textureUrl: "textures/minha_textura.jpg"
```

## Performance e Otimização

### Técnicas Implementadas
- **Instancing**: Para objetos repetidos
- **Frustum Culling**: Objetos fora da view são ignorados
- **Level of Detail**: Diferentes níveis de detalhe baseados na distância
- **Texture Compression**: Texturas otimizadas

### Métricas de Performance
- **FPS Target**: 60 FPS
- **Draw Calls**: Minimizados através de batching
- **Memory Usage**: Gerenciamento eficiente de buffers

## Debugging e Desenvolvimento

### Console Commands
```javascript
// Adicionar objeto em runtime
system.addBody(new CelestialBody({...}));

// Alterar velocidade de animação
system.setTimeScale(2.0);

// Debug da câmera
camera.debug();
```

### Extensões Recomendadas
- **WebGL Inspector**: Para debug de WebGL
- **Spector.js**: Análise de performance
- **Three.js Inspector**: Para debugging 3D

## Troubleshooting

### Problemas Comuns

**Tela preta/sem renderização**:
- Verificar suporte ao WebGL2
- Checar erros de shader no console
- Validar buffers e VAOs

**Performance baixa**:
- Reduzir resolução de texturas
- Diminuir número de objetos
- Otimizar shaders

**Texturas não carregam**:
- Verificar CORS policy
- Confirmar caminhos dos arquivos
- Checar formatos suportados

### Logs de Debug
```javascript
// Habilitar logs detalhados
window.DEBUG_MODE = true;

// Ver informações de renderização
console.log(gl.getParameter(gl.RENDERER));
console.log(gl.getParameter(gl.VERSION));
```

## Roadmap e Melhorias Futuras

### Features Planejadas
- [ ] Sistema de partículas
- [ ] Post-processing effects
- [ ] Shadows e ambient occlusion
- [ ] Physically Based Rendering (PBR)
- [ ] Audio espacial
- [ ] VR/AR support

### Melhorias de Performance
- [ ] Occlusion culling
- [ ] Texture streaming
- [ ] Compute shaders
- [ ] Multi-threading com Web Workers

## Contribuindo

Para contribuir com o projeto:

1. Documente novas features
2. Mantenha compatibilidade com WebGL2
3. Teste em diferentes navegadores
4. Inclua exemplos de uso

## Licença

Este projeto faz parte do repositório de Computação Gráfica da UFPel e segue a mesma licença MIT do projeto principal.