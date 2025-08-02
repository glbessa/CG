# System Class Documentation

## Visão Geral

A classe `System` é responsável por gerenciar uma coleção de corpos celestes (`CelestialBody`) no sistema solar. Ela fornece métodos para adicionar, remover e buscar corpos celestes dentro do sistema.

## Construtor

### `constructor(options)`

Cria uma nova instância do sistema solar.

**Parâmetros:**
- `options` (Object): Objeto de configuração
  - `celestialBodies` (Array): Array inicial de corpos celestes (padrão: `[]`)

**Exemplo:**
```javascript
import System from './system.js';

// Criar sistema vazio
const solarSystem = new System({});

// Criar sistema com corpos celestes iniciais
const solarSystem = new System({
  celestialBodies: [earth, mars, jupiter]
});
```

## Propriedades

### `celestialBodies`

Array que contém todos os corpos celestes do sistema.

**Tipo:** `Array<CelestialBody>`

## Métodos

### `addCelestialBody(options)`

Adiciona um novo corpo celeste ao sistema.

**Parâmetros:**
- `options` (Object): Opções de configuração para o corpo celeste

**Retorno:**
- `CelestialBody`: A instância do corpo celeste criado

**Exemplo:**
```javascript
const earth = solarSystem.addCelestialBody({
  name: 'Earth',
  radius: 6371,
  color: [0.3, 0.5, 1.0],
  orbitRadius: 149.6,
  orbitSpeed: 0.01
});
```

### `removeCelestialBody(name)`

Remove um corpo celeste do sistema pelo nome.

**Parâmetros:**
- `name` (string): Nome do corpo celeste a ser removido

**Retorno:**
- `boolean`: `true` se o corpo foi removido com sucesso, `false` caso contrário

**Exemplo:**
```javascript
const success = solarSystem.removeCelestialBody('Earth');
if (success) {
  console.log('Terra removida com sucesso');
} else {
  console.log('Terra não encontrada no sistema');
}
```

### `findCelestialBody(name)`

Busca um corpo celeste no sistema pelo nome.

**Parâmetros:**
- `name` (string): Nome do corpo celeste a ser encontrado

**Retorno:**
- `CelestialBody | undefined`: O corpo celeste encontrado ou `undefined` se não encontrado

**Exemplo:**
```javascript
const earth = solarSystem.findCelestialBody('Earth');
if (earth) {
  console.log('Terra encontrada:', earth);
} else {
  console.log('Terra não encontrada no sistema');
}
```

## Exemplo de Uso Completo

```javascript
import System from './system.js';

// Criar um novo sistema solar
const solarSystem = new System({});

// Adicionar o Sol
const sun = solarSystem.addCelestialBody({
  name: 'Sun',
  radius: 696340,
  color: [1.0, 1.0, 0.0],
  orbitRadius: 0,
  orbitSpeed: 0
});

// Adicionar a Terra
const earth = solarSystem.addCelestialBody({
  name: 'Earth',
  radius: 6371,
  color: [0.3, 0.5, 1.0],
  orbitRadius: 149.6,
  orbitSpeed: 0.01
});

// Adicionar Marte
const mars = solarSystem.addCelestialBody({
  name: 'Mars',
  radius: 3390,
  color: [0.8, 0.3, 0.1],
  orbitRadius: 227.9,
  orbitSpeed: 0.005
});

// Buscar um planeta
const foundEarth = solarSystem.findCelestialBody('Earth');
console.log('Terra encontrada:', foundEarth);

// Remover um planeta
const removed = solarSystem.removeCelestialBody('Mars');
console.log('Marte removido:', removed);

// Verificar quantos corpos celestes restam
console.log('Total de corpos celestes:', solarSystem.celestialBodies.length);
```

## Dependências

- `CelestialBody`: Classe que representa um corpo celeste individual

## Notas de Implementação

- A classe utiliza o método `Array.findIndex()` para localizar corpos celestes por nome
- A remoção de corpos celestes é feita usando `Array.splice()`
- Todos os métodos de busca são baseados no nome do corpo celeste, que deve ser único
- A classe não implementa validação de nomes duplicados ao adicionar corpos celestes