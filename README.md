# HubSECTI

Esta pequena aplicação é um hub de acesso aos sistemas da SECTI/BA. O código foi reorganizado para melhorar a semântica e facilitar a manutenção:

## Estrutura de pastas

```
hubSECTI/
├── css/
│   └── styles.css        # regras personalizadas, antes inline
├── components/
│   ├── header.html       # cabeçalho reutilizável
│   └── footer.html       # rodapé reutilizável
├── js/
│   └── app.js            # lógica de montagem das janelas (componentização)
├── assets/               # recursos estáticos (imagens, fontes etc.)
│   └── images/            # subpasta onde guardar fotos/logos utilizados no HTML
├── index.html            # arquivo principal que injeta componentes
└── README.md
```

## Componentização

> **Imagens**
>
> Coloque imagens em `assets/images` e faça referência a elas nos componentes. Exemplo no `header.html`:
>
> ```html
> <img src="../assets/images/logo.png" alt="Logo SECTI" class="w-8 h-8">
> ```


- O `index.html` carrega os componentes `header.html` e `footer.html` usando `fetch` no `js/app.js`.
- As "janelas Safari" são geradas dinamicamente a partir de uma lista de sistemas, tornando fácil adicionar novos portais.
- Marcação HTML usa elementos semânticos (`<header>`, `<main>`, `<article>`, `<footer>`) para acessibilidade e estrutura.

## Como usar

1. Abra `index.html` em um navegador moderno.
2. Para adicionar um novo sistema, edite o array `systems` em `js/app.js`.
3. Atualize os estilos em `css/styles.css` ou use classes utilitárias do Tailwind.

## Observações

- Ainda dependemos da CDN do Tailwind e FontAwesome; em um projeto real pode ser útil instalar localmente ou usar um bundler.
- A organização facilita migrar para frameworks (React/Vue) ou templates no futuro.

---

Sinta-se à vontade para ajustar a estrutura conforme necessário.