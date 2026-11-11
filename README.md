# KK ou DD? — Calculadora Poke Alliance

**[Abrir a calculadora online](https://calculadora-kk-dd-pka.vercel.app)** — acesso público, sem login.

Calculadora responsiva em português brasileiro com três pontos de partida: **orçamento em reais**, **meta de KK** e **meta de DD**. Compara os caminhos aplicáveis usando preços de jogadores, market e, na meta de DD, loja oficial com bônus. Site estático em HTML, CSS e JavaScript, sem dependências, banco de dados ou credenciais do jogo.

## Escolha como calcular

| Modo | Informe | Resultado |
| --- | --- | --- |
| **Tenho R$** | Orçamento disponível | KK que consegue diretamente ou comprando DD de jogador para revender; DD inteiros e saldo em reais. |
| **Quero KK** | Quantidade final de KK | Reais necessários comprando KK diretamente; quantidade inteira de DD de jogador para revender, custo e excedente de KK. |
| **Quero DD** | Quantidade final de DD | Custo com jogador; compra mínima na loja oficial com bônus; KK necessários no market e custo desses KK, se precisar comprá-los. |

Os preços de **compra de DD no market** e de **revenda de DD** são independentes. A compra no market usa K/DD: por exemplo, 500 K = 0,5 KK por DD. A taxa de revenda não é aplicada à compra de DD.

Na meta de DD, se já possui os KK, use a quantidade necessária como referência; o custo em reais da rota do market só se aplica caso precise comprar esses KK. A recomendação compara os custos de aquisição em reais, sem presumir um saldo de KK existente.

### Loja oficial: faixas e cupom

Regras do print de doação via Pix, confirmadas pelo usuário em 11/11/2026. O preço-base editável começa em R$ 1 por DD, antes dos bônus, e a compra admite quantidades inteiras.

| DD pagos, antes do bônus | Bônus da faixa | Com cupom de streamer |
| --- | ---: | ---: |
| 1 a 99 | 0% | 10% |
| 100 a 149 | 10% | 20% |
| 150 a 199 | 15% | 25% |
| 200 a 399 | 20% | 30% |
| A partir de 400 | 30% | 40% |

O cupom soma 10 pontos percentuais e vem ativado por padrão. Pode ser desativado. A faixa é definida pelos **DD pagos**, não pela meta final. A calculadora testa todas as faixas e escolhe a compra de menor custo capaz de atingir a meta, incluindo possíveis saltos no bônus.

Por prudência, frações de DD de bônus são arredondadas para baixo; isso pode produzir uma estimativa conservadora se o jogo arredondar de outra forma. Confira a promoção e as condições reais antes da compra. A loja oficial é comparada no modo **Quero DD**; os modos Tenho R$ e Quero KK continuam comparando KK direto com DD de jogador e revenda.

Exemplos com os preços iniciais:

- **Quero 200 KK:** compra direta por R$ 300,00 ou 445 DD de jogador por R$ 267,00, gerando 200,25 KK ao revender a 450 K sem taxa.
- **Quero 500 DD:** jogador por R$ 300,00; market por 250 KK (R$ 375,00 se comprar esses KK); loja por R$ 385,00, com 385 DD pagos e 115 DD inteiros de bônus.
- **Quero 520 DD na loja:** a faixa de 400 DD pagos, com cupom, entrega 560 DD por R$ 400,00. A calculadora considera esse salto.

> **Unidades:** 1 K = 1.000 moedas; 1 KK = 1.000.000 de moedas = 1.000 K. Portanto, **450 K = 0,45 KK**.

## Recursos

- Orçamento e preços em reais, aceitando vírgula ou ponto decimal.
- Metas em KK ou DD, com arredondamento para atingir a quantidade desejada.
- Comparação com loja oficial no modo Quero DD, com faixas de bônus e cupom opcional.
- Revenda por DD em K, taxa percentual e quantidade opcional nas ofertas de compra.
- DD inteiros compráveis, quantidade usada, gasto e saldo em reais.
- KK obtidos por cada caminho, diferença em KK e percentual, com recomendação automática.
- Cenários independentes de 450 K, 475 K e 500 K por DD.
- Equilíbrio por unidade e equilíbrio considerando o orçamento inteiro.
- Validação de campos, botão para restaurar valores e salvamento local quando disponível.
- Layout para computador e celular, navegação por teclado e avisos acessíveis de atualização.

## Abrir no computador

1. Baixe este repositório em **Code → Download ZIP** e extraia os arquivos.
2. Abra **`public/index.html`** no navegador.
3. Altere os campos: os resultados são atualizados automaticamente.

Mantenha os quatro arquivos da pasta `public` juntos. Não é necessário instalar nada nem estar conectado à internet para calcular. Ative o JavaScript do navegador. Os últimos valores válidos ficam salvos no navegador quando o armazenamento local está disponível; ao abrir arquivos locais, esse comportamento pode variar. O botão **Restaurar** recupera os valores iniciais.

## Hospedar na Vercel

1. Na sua conta Vercel, crie um projeto importando **`Pedrinhuu/calculadora-kk-dd-pka`** do GitHub.
2. Mantenha a raiz do projeto na raiz do repositório.
3. O arquivo `vercel.json` já define a publicação estática:

| Configuração | Valor |
| --- | --- |
| Framework Preset | Other |
| Build Command | Vazio, sem compilação |
| Install Command | Vazio, sem instalação |
| Output Directory | `public` |
| Branch de produção | `main` |
| Variáveis de ambiente | Nenhuma |

4. Publique e use o endereço de **produção** retornado pela Vercel.
5. Confirme o acesso em janela anônima. Para compartilhar com qualquer pessoa, o endereço de produção não deve exigir autenticação do visitante; confira a proteção do projeto se aparecer uma tela de login.

Ao vincular o repositório, alterações futuras na branch de produção podem disparar novas publicações conforme a configuração da integração Git. Não é necessário copiar os arquivos manualmente a cada atualização.

Referências: [configuração de build](https://vercel.com/docs/builds/configure-a-build), [vercel.json](https://vercel.com/docs/project-configuration/vercel-json) e [integração Git](https://vercel.com/docs/git).

## Alternativa: Cloudflare Pages

1. No painel da Cloudflare, vá a **Workers & Pages**, crie uma aplicação do tipo **Pages** e importe este repositório GitHub.
2. Configure a branch de produção como `main`.
3. Use nenhum framework, comando de build `exit 0` e diretório de saída **`public`**. A raiz permanece a do repositório.
4. Publique e use o endereço retornado pela Cloudflare.

Não há variáveis de ambiente ou funções de servidor. O arquivo `vercel.json` é específico da Vercel e não é necessário para a Cloudflare. Confira o acesso ao endereço publicado em janela anônima antes de compartilhá-lo.

Referência: [hospedar HTML estático no Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/).

## Entradas e premissas

| Campo | Significado |
| --- | --- |
| Orçamento | Dinheiro disponível em R$, com até duas casas decimais. |
| Preço de 1 DD | Custo em reais de um diamante, maior que zero. |
| Preço de 1 KK | Custo em reais de um milhão de moedas, maior que zero. |
| Revenda por DD | Preço bruto em K, com até três casas decimais. |
| Taxa | Percentual descontado das moedas da revenda, de 0% a 100%. |
| DD nas ofertas de compra | Total inteiro de DD que as ofertas aceitam no preço informado. |
| Meta de KK | Quantidade desejada, de 0,001 a 1.000.000 KK, com até três casas decimais. |
| Meta de DD | Quantidade inteira desejada, de 1 a 1.000.000 DD. |
| Compra de DD no market | Preço de compra em K/DD, separado do preço de revenda. |
| DD à venda no market | Limite opcional de unidades disponíveis para comprar. |
| Preço-base da loja | Reais por DD pago, antes dos bônus; começa em R$ 1,00. |

Use vírgula ou ponto decimal **sem separador de milhar**: `190,00` ou `190.00`. Valores negativos, letras, preços monetários com mais de duas casas decimais e DD fracionários são rejeitados. Limites operacionais: orçamento até R$ 1 bilhão, preços monetários até R$ 1 milhão, revenda até 1 bilhão de K e ofertas até 1 bilhão de DD.

### Liquidez

Em branco, a quantidade disponível significa que a simulação assume compradores para todos os DD compráveis. **Zero significa nenhuma oferta disponível.** Se o orçamento compra 316 DD, mas as ofertas aceitam apenas 100, a simulação compra e revende somente 100 DD. O restante permanece em reais.

Os cenários de 450 K, 475 K e 500 K reutilizam a mesma quantidade para comparação, mas não garantem que existam ofertas com essa quantidade em cada preço. Confirme as condições reais no jogo.

Nos modos de meta, se não houver ofertas suficientes, o site informa o custo teórico e a quantidade necessária, mas exclui essa rota da recomendação. Não recomenda uma compra parcial como se atingisse a meta. Na meta de DD, os cenários variam o preço de compra no market; na meta de KK, variam a revenda.

### Taxa e saldo

A taxa é aplicada proporcionalmente às moedas da revenda. Use 0% ao vender para ofertas de compra conforme a condição informada pelo usuário; para anúncios de venda, informe a taxa aplicável. A calculadora não verifica as regras do jogo em tempo real e não inclui taxas fixas, descontos por volume ou arredondamentos próprios do market.

**No modo Tenho R$, a recomendação compara a quantidade de KK obtida agora.** Na compra direta, todo o orçamento é usado e são admitidas frações de KK. Na rota dos DD, só são compradas unidades inteiras. O saldo em reais aparece separado e **não é convertido automaticamente em KK**. Usar esse saldo para comprar KK seria uma terceira estratégia, fora desta comparação. Nos modos de meta, a recomendação compara os custos para atingir a quantidade final desejada.

## Fórmulas

Nos modos de meta:

```text
DD para meta de KK = teto(meta KK / [revenda em K / 1.000 × (1 − taxa / 100)])
Custo via DD = DD necessários × preço do DD de jogador
Custo direto de KK = meta KK × preço de 1 KK, arredondado para cima ao centavo
KK para meta de DD = meta DD × preço de compra no market em K / 1.000
Custo desses KK = KK necessários × preço de 1 KK, arredondado para cima ao centavo
Loja: DD totais = piso(DD pagos × [1 + (bônus da faixa + cupom) / 100])
```

Para a loja, é escolhido o menor número inteiro de DD pagos que respeita sua faixa e entrega pelo menos a meta. A aritmética inversa usa inteiros escalados para evitar subestimar DD ou centavos por erros de ponto flutuante. Resultados que excedam a precisão segura são sinalizados. Os campos que não pertencem ao modo selecionado não afetam sua validação.

No modo de orçamento:

Considere `B` = orçamento em R$, `D` = preço do DD, `P` = preço de 1 KK, `V` = revenda em K/DD e `t` = taxa percentual / 100.

```text
DD compráveis = piso(B / D)
DD usados = mínimo(DD compráveis, limite das ofertas), se informado
Saldo em R$ = B − DD usados × D
KK direto = B / P
KK revenda = DD usados × V / 1.000 × (1 − t)
Diferença em KK = KK revenda − KK direto
Diferença percentual = diferença em KK / KK direto × 100
Equilíbrio por unidade (K/DD) = D / P × 1.000 / (1 − t)
Equilíbrio do orçamento (K/DD) = KK direto / DD usados × 1.000 / (1 − t)
```

O equilíbrio por unidade iguala o custo unitário. O equilíbrio do orçamento inclui o efeito dos DD inteiros e da disponibilidade de ofertas. Com orçamento zero, não há comparação percentual; com taxa de 100%, não há preço de equilíbrio; sem DD usados, não há equilíbrio do orçamento. A interface arredonda os valores exibidos, mantendo a precisão disponível nos cálculos. Os cálculos de compra em reais usam centavos inteiros.

## Exemplo inicial

Orçamento **R$ 190,00**, DD a **R$ 0,60**, KK direto a **R$ 1,50**, taxa **0%**, sem limite de ofertas informado:

- 316 DD; gasto de R$ 189,60 e saldo de R$ 0,40.
- Compra direta: 126,666666… KK.

| Revenda por DD | KK líquidos | Diferença em KK | Variação |
| --- | ---: | ---: | ---: |
| 450 K | 142,20 | +15,533333… | +12,26% |
| 475 K | 150,10 | +23,433333… | +18,50% |
| 500 K | 158,00 | +31,333333… | +24,74% |

Equilíbrio por unidade: **400 K/DD**. Equilíbrio do orçamento: aproximadamente **400,844 K/DD**.

## Estrutura e manutenção

```text
public/
  index.html       Conteúdo e estrutura
  styles.css       Visual e responsividade
  calculator.js    Validação e fórmulas
  app.js           Interface e armazenamento local
tests.cjs          Testes dos cálculos e validações
vercel.json        Configuração da hospedagem Vercel
README.md          Documentação
```

Somente `public` precisa ser servido pela hospedagem. Para executar os testes, é necessário ter Node.js instalado; ele não é necessário para usar o site:

```sh
node tests.cjs
```

Os 16 grupos de testes verificam os valores iniciais, conversão K/KK, cenários, taxas, limite de ofertas, orçamento zero e insuficiente, empate, precisão de centavos, metas inversas e rejeição de entradas inválidas por modo. A compra mínima da loja é comparada a uma busca exaustiva para metas de 1 a 800 DD, com e sem cupom.

## Privacidade e vínculo com o jogo

Os cálculos são executados no navegador. A aplicação não envia os valores informados para servidores e não contém rastreadores ou bibliotecas externas. A hospedagem pode manter seus próprios registros de acesso.

Projeto independente, sem vínculo oficial com Poke Alliance. Não compra, vende nem movimenta moedas ou diamantes: apenas simula os resultados com os preços informados.
