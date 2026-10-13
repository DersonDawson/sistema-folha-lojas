# FolhaPro — gestão de folha por loja

Sistema web para **simular remuneração mensal de uma rede de lojas de calçados**, com visual corporativo, nomes de funcionários livres, cadastro de lojas, regras por função, histórico mensal e exportação para Excel.

> **Atenção:** o sistema é um simulador gerencial. Não substitui a folha oficial, cálculos tributários e conferência contábil/trabalhista. Ele não inventa regras não confirmadas.

## Funcionalidades

- Cadastro de **quantas lojas forem necessárias**, com nome e código opcionais.
- Vínculo obrigatório de cada lançamento a uma loja, sem cadastro prévio obrigatório de funcionário.
- Competência por mês, filtro de uma loja ou todas, histórico preservado no banco.
- Faturamento por loja/mês, usado nas comissões de gerente/supervisora (incidência da supervisora **a confirmar**).
- Funções iniciais: VENDEDOR, VR, GERENTE, SUPERVISORA, ESTOQUISTA; novas funções configuráveis.
- Mínimo garantido de vendedor e VR confrontado com comissões, sem somar salário-base em duplicidade.
- Gratificações, domingos, anuênio parametrizável, faltas, DSR, descontos e ajuda de custo separada.
- Simulação detalhada por funcionário, pendências de informação, gráficos e totais por loja.
- Cópia dos nomes do mês anterior por loja, **sem repetir vendas/descontos**.
- **Exportação `.xlsx`** com folha completa, resumo por loja, regras aplicadas e orientações.
- E-mail e senha pelo Supabase Auth, dados com RLS por usuário.

## 1. Criar ou selecionar um projeto Supabase

Recomenda-se **um projeto Supabase separado** para o FolhaPro, evitando misturar tabelas com outros sistemas.

1. Entre no [Supabase](https://supabase.com/dashboard) e abra seu projeto.
2. Clique em **SQL Editor** > **New query**.
3. Copie TODO o conteúdo do arquivo `supabase/schema.sql` e execute com **Run**.
4. No menu **Authentication > Users**, crie um usuário com seu e-mail e senha (**Add user**; a interface do Supabase pode variar). Se houver convite ou confirmação por e-mail, conclua-a antes do login.
5. Em **Project Settings > API** (ou **Connect > API Keys**), copie:
   - **Project URL** (`https://...supabase.co`)
   - **Publishable key** (`sb_publishable_...`) ou **anon key** pública, dependendo da versão da interface.
6. **Nunca use a chave `service_role` nem `sb_secret_...` no frontend.** O FolhaPro necessita apenas da chave publicável.

O SQL cria e habilita a **Row Level Security (RLS)** em todas as tabelas. Somente dados do usuário autenticado podem ser consultados pelo app. Por padrão, o aplicativo não possui cadastro público de novas contas; você cria a conta pelo painel do Supabase.

## 2. Executar no computador (opcional, recomendado para teste)

Instale Node.js versão **20 ou superior**.

```bash
npm install
cp .env.example .env.local
```

No **Windows PowerShell**, o equivalente da segunda linha é:

```powershell
Copy-Item .env.example .env.local
```

Edite `.env.local` com os dois valores obtidos no Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SUA_CHAVE_PUBLICAVEL
```

Execute:

```bash
npm run dev
```

Abra **http://localhost:3000** e faça login.

Ao entrar pela primeira vez, o sistema cadastra automaticamente as cinco funções básicas. Depois, crie a primeira loja e informe seu faturamento mensal.

## 3. Publicar na Vercel (passo a passo)

### 3.1. Enviar o projeto ao GitHub

1. Extraia o ZIP desta entrega para uma pasta no seu computador.
2. Crie um repositório **privado** vazio no [GitHub](https://github.com/new), por exemplo `folhapro-lojas`. Não marque a opção de criar README automaticamente.
3. Abra o terminal dentro da pasta extraída e rode (troque o usuário do GitHub):

```bash
git init
git add .
git commit -m "FolhaPro versão inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/folhapro-lojas.git
git push -u origin main
```

**Não envie** o `.env.local`: o `.gitignore` já o impede.

### 3.2. Importar na Vercel

1. Acesse [Vercel](https://vercel.com/new) > **Add New Project**.
2. Escolha **Import Git Repository** e selecione `folhapro-lojas`.
3. A Vercel deve reconhecer o framework **Next.js** automaticamente.
4. Abra **Environment Variables** e adicione:

| Nome | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave publicável/anon do Supabase |

5. Clique em **Deploy**.
6. Depois da publicação, abra a URL `.vercel.app` que a Vercel fornecer.
7. Faça login com o usuário criado no Supabase.

Se você adicionar ou corrigir variáveis de ambiente **depois** do primeiro deploy, faça um **Redeploy** na Vercel. Variáveis públicas do Next.js são incorporadas à aplicação no momento da compilação.

## 4. Operação mensal

1. Em **Minhas lojas**, cadastre as unidades e preencha seu **faturamento para a competência selecionada**.
2. Em **Regras por função**, confira o que foi informado; taxas são percentuais (4 = 4%).
3. Selecione a competência no cabeçalho (por exemplo `2026-10`).
4. Abra **Folha de pagamento** e clique em **Adicionar funcionário**; preencha nome, loja, função e dados mensais.
5. Confira a prévia, preencha os valores manuais obrigatórios e observe as pendências.
6. Use **Baixar Excel**. No modo “Todas as lojas”, o arquivo conterá todas; ao selecionar uma loja, a exportação será daquela unidade.
7. No mês seguinte, selecione uma loja sem lançamentos, troque a competência e use **Copiar mês anterior** para reaproveitar os nomes. Repita para as demais lojas.

## 5. Regras de remuneração incluídas

| Função | Regras configuradas inicialmente |
|---|---|
| VENDEDOR | Mínimo garantido R$ 2.101,25; comissão 4% Seg–Sáb e 6% Dom/Fer |
| VR | Mínimo garantido R$ 2.269,35; comissão 4% Seg–Sáb e 6% Dom/Fer; gratificação R$ 120 |
| GERENTE | Salário R$ 2.420,95; comissão 0,65% sobre vendas da loja; gratificação R$ 250; domingo R$ 133,55 (regra antiga, a confirmar) |
| SUPERVISORA | Salário R$ 5.000; comissão 0,25% sobre vendas da loja (**hipótese provisória**); ajuda de custo R$ 2.000 exibida separadamente |
| ESTOQUISTA | Salário R$ 1.790,26; domingo R$ 92,65 (dados anteriores preservados) |

**Garantia do VENDEDOR e VR**:

```text
comissões = vendas_seg_sab × 0,04 + vendas_dom_fer × 0,06
complemento = max(0, garantia - comissões)
vencimentos = comissões + complemento + gratificação (se houver) + outras verbas
```

**Regra temporal:** quando você salva um lançamento, é gravada a cópia de sua função naquele momento. Alterar uma regra global **não muda retroativamente** lançamentos salvos, protegendo o histórico. Para fazer um recálculo com as regras atuais, clique no ícone de atualização na linha do funcionário, confirme e salve. A tabela de anuênio e o faturamento de uma competência continuam editáveis; mudanças nesses dados afetam os resultados relacionados, inclusive passados.

## 6. Pendências não automatizadas

- **INSS:** digitação manual, até existir configuração oficial por competência, bases e faixas progressivas. Em branco, mostra pendência; `0` indica informação intencional.
- **Vale-transporte:** digitação manual, sem aplicação automática de 6%.
- **FGTS:** campo informativo manual; não é desconto do trabalhador.
- **DSR de comissões:** manual até ser definida a metodologia, calendário, domingos e feriados aplicáveis.
- **Anuênio/quinquênio:** regra por função + anos, ou valor individual manual. Não presume valores.
- **Faltas:** quantidade registrada e desconto monetário manual.
- **Ajuda de custo:** valor da SUPERVISORA mostrado em separado, somado ao desembolso **provisório**, sem incluir automaticamente no bruto tributável; confirmar classificação.
- **Faturamento base da supervisora:** presumido como vendas da loja para permitir simulação. Confirmar se é loja, rede ou outra base.
- **Férias, 13º, rescisão, IRRF, adicionais específicos, encargos patronais e provisões**: ainda não implementados.
- Alterações salariais históricas exigem revisar o lançamento e suas regras congeladas.

O número apresentado como **“Líquido simulado”** nunca equivale, por si só, a uma folha oficialmente apurada.

## 7. Testes e manutenção

```bash
npm run test
npm run typecheck
npm run build
```

Os testes verificam as 5 funções, complementação de garantia, comissões, domingos, anuênio, faltas, descontos, troca de regras e separação do faturamento por loja. Testes reais de integração Supabase, acesso por usuários e deploy Vercel devem ser realizados **no seu ambiente**, pois exigem credenciais e a execução da migração SQL.

## 8. Segurança mínima

Embora seja um sistema de uso pessoal, os valores salariais são confidenciais. O projeto não usa senha hardcoded, não expõe chaves administrativas e configura RLS por usuário. Mantenha a senha da conta do Supabase em segredo, faça backups periódicos e não divulgue a URL de planilhas exportadas.

## 9. Organização do código

- `app/`: páginas e estilo global Next.js.
- `components/dashboard.tsx`: interface e fluxo de telas.
- `lib/calculations.ts`: regras de cálculo e valores iniciais **centralizados**.
- `lib/export.ts`: gerador de Excel com múltiplas abas.
- `lib/supabase.ts`: cliente de conexão do banco.
- `lib/types.ts`: contratos tipados.
- `supabase/schema.sql`: estrutura e regras RLS do banco.
- `tests/`: testes das regras monetárias.

## Fonte da configuração técnica

- Variáveis no Next.js: https://nextjs.org/docs/app/guides/environment-variables
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Vercel / Next.js: https://vercel.com/docs/frameworks/full-stack/nextjs
