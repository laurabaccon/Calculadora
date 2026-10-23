# Calculadora científica TEK RENKK

Aplicação web responsiva construída com Vite, React e TypeScript. A lógica matemática fica isolada em `src/lib/`, usando tokenizer e parser recursivo próprios, sem `eval` ou `new Function`. A interface oferece funções básicas e científicas, alternância DEG/RAD, histórico reaproveitável e atalhos de teclado.

## Requisitos

- Node.js 18 ou superior
- npm

## Rodar localmente

```bash
npm install
npm run dev
```

O Vite exibirá o endereço local no terminal.

## Testes e build

```bash
npm test
npm run build
npm run preview
```

Os testes unitários são executados pelo Vitest e cobrem precedência, porcentagem, funções científicas, mensagens de erro, precisão numérica e reducer de teclado.

## Deploy na Vercel via GitHub

1. Envie este repositório para o GitHub.
2. Entre em [vercel.com](https://vercel.com), escolha **Add New → Project** e importe o repositório.
3. A Vercel detecta Vite automaticamente. Confira o preset **Vite**, o comando de build `npm run build` e a pasta de saída `dist`.
4. Selecione **Deploy**. Novos pushes na branch conectada gerarão deployments automaticamente.

## Deploy na Vercel via CLI

Instale e autentique a CLI, na raiz do projeto:

```bash
npm install -g vercel
vercel login
vercel
```

Responda às perguntas para vincular ou criar o projeto. Para publicar em produção:

```bash
vercel --prod
```

O projeto usa o preset Vite e não precisa de configuração adicional da Vercel.

## Atalhos

- `0–9`, `.` e operadores para editar a expressão
- `Enter` ou `=` para calcular
- `Backspace` para apagar o último caractere
- `Esc` para limpar
