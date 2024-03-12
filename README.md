# StockShift 📦

O StockShift é uma aplicação desenvolvida com [Next.js](https://nextjs.org/), projetada para resolver os desafios de gerenciamento de pequenos estoques de produtos. A ferramenta é ideal para pequenas empresas e empreendedores que buscam uma solução eficiente e acessível para controlar o fluxo de seus itens em estoque.

<img src="https://i.imgur.com/TtEkKMA.png" width="400"/>

## Tecnologias Utilizadas 💻

<a href="https://nextjs.org/"><img src="https://i.imgur.com/VYlsYev.png" width="100"/></a>\
\
<a href="https://www.prisma.io/"><img src="https://i.imgur.com/MWawZiX.png" width="100"/></a>\
\
<a href="https://www.mongodb.com/pt-br"><img src="https://i.imgur.com/YdvEb85.png" width="100"/></a>\
\
<a href="https://ui.shadcn.com/"><img src="https://i.imgur.com/rGWZujA.png" width="100"/></a>\
\
<a href="https://lucide.dev/"><img src="https://i.imgur.com/QHkMslx.png" width="100"/></a>

## Primeiros Passos 🚀

Este projeto utiliza dois arquivos distintos para gerenciar as variáveis de ambiente necessárias para a configuração do Prisma e do Next.js:

1. **`.env`**: Este arquivo é utilizado exclusivamente para definir as variáveis de ambiente necessárias para a configuração do Prisma.
2. **`.env.local`**: Este arquivo é destinado às variáveis de ambiente específicas do Next.js.

Para facilitar a configuração inicial, fornecemos modelos para ambos os arquivos de variáveis de ambiente:

- **`.env-example`**: Modelo para as variáveis de ambiente do Prisma.
- **`.env.local-example`**: Modelo para as variáveis de ambiente do Next.js.

## Configurando os ENVS

Para configurar o seu ambiente de desenvolvimento, siga os passos abaixo:

1. **Crie o arquivo `.env`**:

   - Duplique o arquivo `.env-example`.
   - Renomeie a cópia para `.env`.
   - Abra o arquivo `.env` e preencha os valores das variáveis de ambiente conforme necessário para o seu ambiente de desenvolvimento.

2. **Crie o arquivo `.env.local`**:
   - Duplique o arquivo `.env.local-example`.
   - Renomeie a cópia para `.env.local`.
   - Abra o arquivo `.env.local` e ajuste as variáveis de ambiente de acordo com as necessidades específicas do Next.js para o seu projeto.

## Instalando as dependências

Para instalar as dependências utilize seu gerenciador de pacotes preferido.

```bash
npm install
# ou
yarn
#ou
bun install
```

## Gerando os schemas do Prisma e Zod

O projeto utiliza o Prisma e o Zod através da biblioteca [Prisma Zod Generator](https://github.com/omar-dulaimi/prisma-zod-generator), por isso é necessário gerar os schemas.

```bash
npx prisma generate
# ou
prisma generate
```

Após essas configurações, o projeto está pronto para rodar no servidor de desenvolvimento.

## Executando o Projeto 🖥

Para começar a utilizar o StockShift em desenvolvimento, siga os passos abaixo para rodar o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
# ou
bun dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

O projeto StockShift combina MongoDB Serverless e as [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) do Next.js, facilitando a hospedagem na Vercel. Essa abordagem otimiza a gestão de banco de dados e roteamento de APIs, proporcionando eficiência e simplicidade no deploy.
