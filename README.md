# 🏐 Gerenciador de Quadra de Vôlei

Um aplicativo web completo para gerenciar partidas de vôlei com controle de pontos em tempo real, gerenciamento de jogadores e relatórios detalhados.

## 🚀 Funcionalidades

### ⚙️ Configuração da Partida
- Cadastro de 6 jogadores para cada time (A e B)
- Definição de posições na quadra (1-6)
- Validação automática de preenchimento

### 🎮 Durante a Partida
- **Controle de Pontos**: Adicionar/remover pontos com botões intuitivos
- **Placar em Tempo Real**: Visualização clara dos pontos e sets
- **Quadra Visual**: Representação gráfica das posições dos jogadores
- **Rotação Automática**: Sistema de rotação conforme regras do vôlei
- **Controles por Teclado**: Atalhos rápidos para agilizar o jogo

### 📊 Relatórios e Estatísticas
- Relatório final da partida
- Ranking dos melhores pontuadores por time
- Estatísticas completas da partida
- Histórico de partidas salvas

### 💾 Persistência de Dados
- Salvamento automático a cada 30 segundos
- Histórico de até 50 partidas
- Recuperação de jogo em andamento

## 🎯 Como Usar

### 1. Configuração Inicial
1. Abra o arquivo `index.html` no navegador
2. Preencha os nomes dos 6 jogadores para cada time
3. Clique em "Iniciar Partida"

### 2. Durante o Jogo
- **Adicionar Pontos**: Clique nos botões "+1" para cada time
- **Remover Pontos**: Use os botões "-1" (se necessário)
- **Rotacionar Time**: Clique em "Rotacionar Time A/B" quando o time ganhar o saque
- **Visualizar Posições**: Observe a quadra visual com as posições atuais

### 3. Atalhos de Teclado
- `Ctrl + 1`: Adicionar ponto ao Time A
- `Ctrl + 2`: Adicionar ponto ao Time B
- `Ctrl + Alt + R`: Rotacionar time (será solicitado qual time)

### 4. Final da Partida
- A partida termina automaticamente quando um time vence 3 sets
- Visualize o relatório completo com estatísticas
- Salve a partida no histórico
- Inicie uma nova partida ou visualize o histórico

## 🏆 Regras do Vôlei Implementadas

### Sistema de Pontos
- **Sets 1-4**: Primeiro time a 25 pontos com diferença mínima de 2 pontos
- **Set 5 (Tie-break)**: Primeiro time a 15 pontos com diferença mínima de 2 pontos
- **Vitória da Partida**: Primeiro time a vencer 3 sets

### Sistema de Rotação
- Rotação no sentido horário
- Posição 1 → Posição 6 → Posição 5 → Posição 4 → Posição 3 → Posição 2 → Posição 1
- A rotação deve ser feita quando o time ganha o direito de saque

## 🛠️ Estrutura do Projeto

```
volei/
├── index.html          # Página principal
├── css/
│   └── style.css      # Estilos e layout responsivo
├── js/
│   └── app.js         # Lógica principal da aplicação
└── .github/
    └── copilot-instructions.md
```

## 🎨 Interface

### Design Responsivo
- **Desktop**: Layout completo com quadra visual expandida
- **Tablet**: Interface otimizada para toque
- **Mobile**: Layout vertical com controles adaptados

### Temas Visuais
- Gradientes modernos em azul/roxo
- Quadra com visual realista (verde)
- Botões com efeitos hover e animações suaves
- Cartões com glass morphism

## 📱 Compatibilidade

- ✅ Chrome/Edge (Recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile Browsers
- ✅ Tablets

## 🔧 Recursos Técnicos

### Armazenamento Local
- Utiliza `localStorage` para persistir dados
- Salvamento automático do estado do jogo
- Histórico de partidas limitado a 50 jogos

### Performance
- Código otimizado para dispositivos móveis
- Animações CSS3 suaves
- Interface responsiva sem dependências externas

## 🚀 Como Executar

### Opção 1: Arquivo Local
1. Baixe todos os arquivos do projeto
2. Abra `index.html` diretamente no navegador

### Opção 2: Servidor Local (Recomendado)
1. Use um servidor HTTP simples:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (com http-server)
   npx http-server
   ```
2. Acesse `http://localhost:8000`

## 🎯 Próximas Funcionalidades (Roadmap)

- [ ] Sistema de substituições de jogadores
- [ ] Controle de tempo de jogo
- [ ] Estatísticas avançadas (ataques, bloqueios, saques)
- [ ] Exportação de relatórios em PDF
- [ ] Modo torneio com múltiplas equipes
- [ ] Integração com redes sociais para compartilhar resultados
- [ ] Modo offline completo (PWA)

## 🐛 Problemas Conhecidos

- Em alguns navegadores mais antigos, o salvamento automático pode não funcionar
- O layout mobile pode necessitar de scroll horizontal em telas muito pequenas

## 📝 Contribuição

Sinta-se à vontade para contribuir com melhorias:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

**Desenvolvido com ❤️ para a comunidade de vôlei** 🏐