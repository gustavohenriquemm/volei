/* SISTEMA DE GERENCIAMENTO DE QUADRA DE VÔLEI
 * 
 * ALTERAÇÕES PRINCIPAIS:
 * 1. Jogadores representados em formato CIRCULAR (não mais quadrados)
 * 2. Estatísticas exibidas APENAS no relatório final (não durante o jogo)
 * 3. Saque inicial SEMPRE no Time B, posição 1 (canto inferior esquerdo)
 * 4. Rotação APENAS quando o time RECUPERA o saque (conquista do adversário)
 *    - Não há rotação em pontos consecutivos do mesmo saque
 * 
 * FUNCIONAMENTO DO SAQUE E ROTAÇÃO:
 * - Jogo começa com Time B sacando
 * - Saque sempre na posição 1 (canto inferior esquerdo da quadra)
 * - Quando um time recupera o saque → ROTACIONA
 * - Enquanto o time continua sacando → NÃO rotaciona
 */

// Estado do jogo
let gameState = {
    teams: {
        A: {
            name: 'Time A',
            score: 0,
            sets: 0,
            players: {},
            reserves: {},
            serving: false,
            rotation: [1, 2, 3, 4, 5, 6],
            servingPosition: 5,  // Saque na posição 5 (canto superior esquerdo para Time A)
            lastServing: false
        },
        B: {
            name: 'Time B',
            score: 0,
            sets: 0,
            players: {},
            reserves: {},
            serving: true,  // Time B sempre começa sacando
            rotation: [1, 2, 3, 4, 5, 6],
            servingPosition: 5,  // Saque começa na posição 5 (canto inferior direito)
            lastServing: false
        }
    },
    currentSet: 1,
    matchStarted: false,
    timer: 0,
    timerInterval: null,
    pendingPoint: null  // Armazena temporariamente o time e posição antes de selecionar o tipo de ponto
};

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Botão iniciar partida
    const startButton = document.getElementById('start-match');
    if (startButton) {
        startButton.addEventListener('click', startMatch);
    }

    // Event listeners para os campos de entrada dos jogadores
    setupPlayerInputListeners();
}

// Configurar listeners para os campos de entrada dos jogadores
function setupPlayerInputListeners() {
    const playerCards = document.querySelectorAll('.player-input-card');
    
    // Carregar dados salvos se existirem
    loadSavedPlayerData();
    
    playerCards.forEach(card => {
        const nameInput = card.querySelector('.player-name-input');
        const positionSelect = card.querySelector('.player-position-select');
        const photoInput = card.querySelector('.player-photo-input');
        const team = card.getAttribute('data-team');
        const index = card.getAttribute('data-index');
        
        if (!nameInput || !positionSelect) {
            return;
        }
        
        // Listener para mudança no nome
        nameInput.addEventListener('input', function() {
            updatePlayerData(team, index, 'name', this.value);
            updateCardAppearance(card);
        });
        
        // Listener para mudança na posição
        positionSelect.addEventListener('change', function() {
            updatePlayerData(team, index, 'position', this.value);
            updateCardAppearance(card);
            updatePositionBadge(card, this.value);
        });
        
        // Listener para mudança na foto
        if (photoInput) {
            photoInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        updatePlayerData(team, index, 'photo', e.target.result);
                        updatePlayerPhoto(card, e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });
}

// Atualizar dados do jogador
function updatePlayerData(team, index, field, value) {
    // Verificar se é reserva
    const isReserve = index.startsWith('R');
    const storage = isReserve ? 'reserves' : 'players';
    
    if (!gameState.teams[team][storage][index]) {
        gameState.teams[team][storage][index] = {};
    }
    gameState.teams[team][storage][index][field] = value;
    
    // Salvar dados automaticamente
    savePlayerData();
    
    // Atualizar contadores
    updatePlayerCounts();
    
    console.log(`${isReserve ? 'Reserva' : 'Jogador'} ${team}-${index} ${field} updated:`, value);
}

// Atualizar aparência do card baseado no preenchimento
function updateCardAppearance(card) {
    const nameInput = card.querySelector('.player-name-input');
    const positionSelect = card.querySelector('.player-position-select');
    
    const hasName = nameInput.value.trim() !== '';
    const hasPosition = positionSelect.value !== '';
    
    if (hasName && hasPosition) {
        card.classList.add('filled');
    } else {
        card.classList.remove('filled');
    }
}

// Atualizar foto do jogador no card
function updatePlayerPhoto(card, photoDataUrl) {
    const playerPhoto = card.querySelector('.player-photo');
    if (playerPhoto && photoDataUrl) {
        // Criar elemento de imagem
        playerPhoto.style.backgroundImage = `url(${photoDataUrl})`;
        playerPhoto.style.backgroundSize = 'cover';
        playerPhoto.style.backgroundPosition = 'center';
        playerPhoto.innerHTML = ''; // Remover emoji
        playerPhoto.style.border = '2px solid #667eea';
    }
}

// Atualizar badge da posição baseado na seleção
function updatePositionBadge(card, position) {
    const badge = card.querySelector('.position-badge');
    const playerPhoto = card.querySelector('.player-photo');
    
    // Remover classes antigas
    badge.className = 'position-badge';
    
    if (position) {
        // Mapear posições para dados visuais
        const positionData = {
            'libero': { text: 'Líbero', class: 'libero', emoji: '🏐' },
            'levantador': { text: 'Levantador', class: 'levantador', emoji: '🙌' },
            'central': { text: 'Central', class: 'central', emoji: '🛡️' },
            'atacante': { text: 'Atacante', class: 'atacante', emoji: '⚡' },
            'oposto': { text: 'Oposto', class: 'oposto', emoji: '💪' },
            'defensor': { text: 'Defensor', class: 'defensor', emoji: '🛡️' }
        };
        
        const data = positionData[position];
        if (data) {
            badge.textContent = data.text;
            badge.classList.add(data.class);
            
            // Atualizar emoji se não tiver foto
            if (!playerPhoto.style.backgroundImage) {
                playerPhoto.textContent = data.emoji;
            }
        }
    } else {
        // Volta ao padrão
        badge.textContent = 'Jogador';
        badge.classList.add('jogador');
        if (!playerPhoto.style.backgroundImage) {
            playerPhoto.textContent = '👤';
        }
    }
}

// Validar se há posições duplicadas nos jogadores titulares
// Função desativada - posições duplicadas são permitidas
function validatePositions() {
    // Validação removida conforme solicitado
    return true;
}

// Mostrar notificação
function showNotification(message, type = 'info') {
    // Criar elemento de notificação se não existir
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(notification);
    }
    
    // Definir cor baseada no tipo
    const colors = {
        info: '#17a2b8',
        success: '#28a745',
        warning: '#ffc107',
        error: '#dc3545'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
    }, 3000);
}

// Salvar dados dos jogadores no localStorage
function savePlayerData() {
    try {
        const playerData = {
            teams: gameState.teams,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('volleyballPlayerData', JSON.stringify(playerData));
        console.log('📄 Dados dos jogadores salvos automaticamente');
    } catch (error) {
        console.warn('Erro ao salvar dados dos jogadores:', error);
    }
}

// Carregar dados salvos dos jogadores
function loadSavedPlayerData() {
    try {
        const savedData = localStorage.getItem('volleyballPlayerData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // Restaurar dados dos times
            if (data.teams) {
                // Manter estrutura original mas aplicar dados salvos
                Object.keys(data.teams).forEach(team => {
                    if (gameState.teams[team]) {
                        gameState.teams[team].players = data.teams[team].players || {};
                        gameState.teams[team].reserves = data.teams[team].reserves || {};
                    }
                });
                
                // Aplicar dados salvos aos cards
                setTimeout(() => restorePlayerCards(), 100);
                
                console.log('📄 Dados dos jogadores carregados:', data.timestamp);
            }
        }
    } catch (error) {
        console.warn('Erro ao carregar dados dos jogadores:', error);
    }
}

// Restaurar aparência dos cards com dados salvos
function restorePlayerCards() {
    const playerCards = document.querySelectorAll('.player-input-card');
    
    playerCards.forEach(card => {
        const team = card.getAttribute('data-team');
        const index = card.getAttribute('data-index');
        const isReserve = index.startsWith('R');
        const storage = isReserve ? 'reserves' : 'players';
        
        const playerData = gameState.teams[team][storage][index];
        if (playerData) {
            // Restaurar nome
            if (playerData.name) {
                const nameInput = card.querySelector('.player-name-input');
                if (nameInput) nameInput.value = playerData.name;
            }
            
            // Restaurar posição
            if (playerData.position) {
                const positionSelect = card.querySelector('.player-position-select');
                if (positionSelect) {
                    positionSelect.value = playerData.position;
                    updatePositionBadge(card, playerData.position);
                }
            }
            
            // Restaurar foto
            if (playerData.photo) {
                updatePlayerPhoto(card, playerData.photo);
            }
            
            // Atualizar aparência
            updateCardAppearance(card);
        }
    });
    
    // Revalidar posições após carregar
    validatePositions();
    showNotification('✅ Dados dos jogadores carregados!', 'success');
}

// Verificar se todos os dados obrigatórios estão preenchidos
function validateAllPlayersData() {
    const teams = ['A', 'B'];
    let allValid = true;
    const errors = [];
    
    teams.forEach(team => {
        const requiredPlayers = 6; // Mínimo de jogadores por time
        const teamPlayers = gameState.teams[team].players || {};
        let validPlayers = 0;
        
        for (let i = 1; i <= 6; i++) {
            const player = teamPlayers[i.toString()];
            if (player && player.name && player.position) {
                validPlayers++;
            }
        }
        
        if (validPlayers < requiredPlayers) {
            allValid = false;
            errors.push(`Time ${team}: ${validPlayers}/${requiredPlayers} jogadores completos`);
        }
    });
    
    return { valid: allValid, errors };
}

// Atualizar contadores de jogadores
function updatePlayerCounts() {
    const counts = {
        A: { players: 0, reserves: 0, complete: 0 },
        B: { players: 0, reserves: 0, complete: 0 }
    };
    
    ['A', 'B'].forEach(team => {
        // Contar jogadores titulares
        Object.keys(gameState.teams[team].players || {}).forEach(playerId => {
            const player = gameState.teams[team].players[playerId];
            if (player && Object.keys(player).length > 0) {
                counts[team].players++;
                if (player.name && player.position) {
                    counts[team].complete++;
                }
            }
        });
        
        // Contar reservas
        Object.keys(gameState.teams[team].reserves || {}).forEach(reserveId => {
            const reserve = gameState.teams[team].reserves[reserveId];
            if (reserve && Object.keys(reserve).length > 0) {
                counts[team].reserves++;
            }
        });
    });
    
    return counts;
}

// Limpar todos os dados dos jogadores
function clearAllPlayerData() {
    if (confirm('🗑️ Tem certeza que deseja limpar todos os dados dos jogadores?\n\nEsta ação não pode ser desfeita.')) {
        // Limpar localStorage
        localStorage.removeItem('volleyballPlayerData');
        
        // Resetar gameState
        gameState.teams.A.players = {};
        gameState.teams.A.reserves = {};
        gameState.teams.B.players = {};
        gameState.teams.B.reserves = {};
        
        // Limpar interface
        const playerCards = document.querySelectorAll('.player-input-card');
        playerCards.forEach(card => {
            const nameInput = card.querySelector('.player-name-input');
            const positionSelect = card.querySelector('.player-position-select');
            const photoInput = card.querySelector('.player-photo-input');
            
            if (nameInput) nameInput.value = '';
            if (positionSelect) positionSelect.value = '';
            if (photoInput) photoInput.value = '';
            
            updateCardAppearance(card);
            updatePositionBadge(card, '');
            
            // Resetar foto
            const playerPhoto = card.querySelector('.player-photo');
            if (playerPhoto) {
                playerPhoto.style.backgroundImage = '';
                playerPhoto.textContent = '👤';
                playerPhoto.style.border = '3px solid #ddd';
            }
        });
        
        showNotification('✅ Todos os dados foram limpos!', 'success');
        console.log('Todos os dados dos jogadores foram limpos');
    }
}

// Verificar se pode iniciar a partida
function canStartMatch() {
    let errors = [];
    
    ['A', 'B'].forEach(team => {
        const teamName = team === 'A' ? 'Time A' : 'Time B';
        const players = gameState.teams[team].players;
        
        // Contar jogadores com nome e posição preenchidos
        const playerCount = Object.keys(players).filter(index => 
            players[index].name && players[index].name.trim() !== '' &&
            players[index].position && players[index].position !== ''
        ).length;
        
        if (playerCount < 6) {
            errors.push(`${teamName} precisa de pelo menos 6 jogadores completos (nome + posição)`);
        }
        
        // Verificar posições duplicadas
        const positions = {};
        Object.keys(players).forEach(index => {
            const player = players[index];
            if (player.position && positions[player.position]) {
                errors.push(`${teamName} tem posições duplicadas: ${player.position}`);
            } else if (player.position) {
                positions[player.position] = true;
            }
        });
    });
    
    return errors;
}

// Iniciar partida
function startMatch() {
    const errors = canStartMatch();
    
    if (errors.length > 0) {
        showNotification('Erro: ' + errors[0], 'error');
        return;
    }
    
    // Preparar dados dos times
    setupTeamsForMatch();
    
    // Esconder seção de setup e mostrar jogo
    document.getElementById('setup-section').classList.add('hidden');
    document.getElementById('match-section').classList.remove('hidden');
    
    // Inicializar interface do jogo
    updateCourtDisplay();
    startTimer();
    
    gameState.matchStarted = true;
    showNotification('Partida iniciada! Boa sorte!', 'success');
}

// Preparar times para a partida
function setupTeamsForMatch() {
    ['A', 'B'].forEach(team => {
        const players = gameState.teams[team].players;
        const courtPlayers = {};
        
        // Mapear posições para números da quadra
        const positionMapping = {
            'libero': '1',      // Posição 1 - Sacador/Líbero
            'levantador': '2',  // Posição 2 - Levantador
            'central': '3',     // Posição 3 - Central
            'atacante': '4',    // Posição 4 - Atacante Ponta
            'oposto': '5',      // Posição 5 - Oposto/Saída
            'defensor': '6'     // Posição 6 - Defensor Central
        };
        
        // Organizar jogadores por posição escolhida
        Object.keys(players).forEach(index => {
            const player = players[index];
            if (player.name && player.position) {
                const courtPosition = positionMapping[player.position];
                if (courtPosition) {
                    courtPlayers[courtPosition] = {
                        name: player.name,
                        position: player.position,
                        photo: player.photo || null,
                        originalIndex: index,
                        stats: {
                            points: 0,
                            aces: 0,
                            blocks: 0,
                            errors: {
                                out: 0,
                                invasion: 0
                            },
                            pointTypes: {
                                normal: 0,
                                ace: 0,
                                block: 0
                            }
                        }
                    };
                }
            }
        });
        
        gameState.teams[team].courtPlayers = courtPlayers;
        
        // Preencher posições não ocupadas com jogadores sem posição definida
        fillEmptyPositions(team, courtPlayers, players);
    });
}

// Preencher posições vazias com jogadores restantes
function fillEmptyPositions(team, courtPlayers, players) {
    const occupiedPositions = Object.keys(courtPlayers);
    const allPositions = ['1', '2', '3', '4', '5', '6'];
    const emptyPositions = allPositions.filter(pos => !occupiedPositions.includes(pos));
    
    // Encontrar jogadores sem posição ou com posições duplicadas
    const availablePlayers = [];
    Object.keys(players).forEach(index => {
        const player = players[index];
        if (player.name && (!player.position || player.position === '')) {
            availablePlayers.push({
                name: player.name,
                originalIndex: index
            });
        }
    });
    
    // Atribuir jogadores disponíveis às posições vazias
    emptyPositions.forEach((position, index) => {
        if (availablePlayers[index]) {
            const playerData = players[availablePlayers[index].originalIndex];
            courtPlayers[position] = {
                name: availablePlayers[index].name,
                position: 'substituto',
                photo: playerData.photo || null,
                originalIndex: availablePlayers[index].originalIndex,
                stats: {
                    points: 0,
                    aces: 0,
                    blocks: 0,
                    errors: {
                        out: 0,
                        invasion: 0
                    },
                    pointTypes: {
                        normal: 0,
                        ace: 0,
                        block: 0
                    }
                }
            };
        }
    });
}

// Atualizar display da quadra
function updateCourtDisplay() {
    ['A', 'B'].forEach(team => {
        const courtPlayers = gameState.teams[team].courtPlayers;
        
        if (courtPlayers) {
            Object.keys(courtPlayers).forEach(position => {
                const player = courtPlayers[position];
                const positionElement = document.getElementById(`court${team}-${position}`);
                
                if (positionElement && player) {
                    const nameElement = positionElement.querySelector('.player-name');
                    if (nameElement) {
                        nameElement.textContent = player.name;
                    }
                    
                    // Atualizar foto do jogador na quadra
                    const photoElement = positionElement.querySelector('.player-photo');
                    if (photoElement) {
                        if (player.photo) {
                            photoElement.style.backgroundImage = `url(${player.photo})`;
                            photoElement.style.backgroundSize = 'cover';
                            photoElement.style.backgroundPosition = 'center';
                            photoElement.innerHTML = '';
                            console.log(`✅ Foto aplicada para ${player.name} na posição ${position}`);
                        } else {
                            photoElement.style.backgroundImage = '';
                            photoElement.innerHTML = '👤';
                        }
                    }
                    
                    // Remover classe serving de todas as posições
                    positionElement.classList.remove('serving');
                    const serveBall = positionElement.querySelector('.serve-ball');
                    if (serveBall) {
                        serveBall.classList.add('hidden');
                    }
                }
            });
            
            // Adicionar classe serving na posição correta (posição 1 = canto inferior esquerdo)
            if (gameState.teams[team].serving) {
                const servingPosition = gameState.teams[team].servingPosition;
                const servingElement = document.getElementById(`court${team}-${servingPosition}`);
                if (servingElement) {
                    servingElement.classList.add('serving');
                    const serveBall = servingElement.querySelector('.serve-ball');
                    if (serveBall) {
                        serveBall.classList.remove('hidden');
                    }
                }
            }
        }
    });
    
    // Atualizar indicador de saque
    updateServingIndicator();
}

// Atualizar indicador de saque
function updateServingIndicator() {
    const servingA = document.getElementById('servingA');
    const servingB = document.getElementById('servingB');
    
    if (gameState.teams.A.serving) {
        servingA.classList.remove('hidden');
        servingB.classList.add('hidden');
    } else {
        servingA.classList.add('hidden');
        servingB.classList.remove('hidden');
    }
}

// Iniciar timer
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateTimerDisplay();
    }, 1000);
}

// Atualizar display do timer
function updateTimerDisplay() {
    const minutes = Math.floor(gameState.timer / 60);
    const seconds = gameState.timer % 60;
    const timerElement = document.getElementById('timer');
    
    if (timerElement) {
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Mostrar seleção de jogador para ponto
function showPlayerSelection(team) {
    // Armazenar o time que vai receber o ponto
    gameState.pendingPoint = { team };
    
    // Mostrar modal de tipo de ponto PRIMEIRO
    const modal = document.getElementById('point-type-modal');
    const teamNameEl = document.getElementById('point-type-team-name');
    
    if (teamNameEl) {
        teamNameEl.textContent = gameState.teams[team].name;
    }
    modal.classList.remove('hidden');
}

// Mostrar seleção de jogador DEPOIS de escolher o tipo
function showPlayerSelectionAfterType(team, isError = false) {
    const modal = document.getElementById('player-modal');
    const teamName = document.getElementById('modal-team');
    const playerGrid = document.getElementById('player-grid');
    
    if (!modal || !teamName || !playerGrid) return;
    
    teamName.textContent = `${isError ? '⚠️ ' : ''}${gameState.teams[team].name}`;
    playerGrid.innerHTML = '';
    
    // Adicionar jogadores do time à grid
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (courtPlayers) {
        Object.keys(courtPlayers).forEach(position => {
            const player = courtPlayers[position];
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-option';
            playerDiv.style.cssText = `
                background: #f8f9fa;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 5px;
            `;
            playerDiv.innerHTML = `
                <div style="font-weight: bold; color: ${isError ? '#dc3545' : '#667eea'}; margin-bottom: 5px;">Posição ${position}</div>
                <div style="color: #333;">${player.name}</div>
            `;
            playerDiv.onmouseover = () => {
                playerDiv.style.borderColor = isError ? '#dc3545' : '#667eea';
                playerDiv.style.transform = 'translateY(-2px)';
            };
            playerDiv.onmouseout = () => {
                playerDiv.style.borderColor = '#ddd';
                playerDiv.style.transform = 'translateY(0)';
            };
            playerDiv.onclick = () => selectPlayerForPoint(team, position, isError);
            playerGrid.appendChild(playerDiv);
        });
    }
    
    modal.classList.remove('hidden');
}

// Selecionar jogador para marcar ponto
function selectPlayerForPoint(team, position, isError = false) {
    console.log('=== selectPlayerForPoint ===', { team, position, isError, errorType: gameState.errorType, pendingPoint: gameState.pendingPoint });
    
    if (isError) {
        // Se for erro, team já é o time adversário que cometeu o erro
        console.log('Chamando selectErrorPlayer...');
        
        // Verificar se errorType existe, senão pegar do pendingPointType
        if (!gameState.errorType && gameState.pendingPointType) {
            gameState.errorType = gameState.pendingPointType;
            console.log('errorType restaurado de pendingPointType:', gameState.errorType);
        }
        
        selectErrorPlayer(team, position);
    } else {
        // Se for ponto normal, adiciona o ponto
        const pointType = gameState.pendingPointType;
        console.log('Chamando addPoint...', { team, position, pointType });
        addPoint(team, position, pointType);
        closePlayerModal();
        gameState.pendingPoint = null;
        gameState.pendingPointType = null;
    }
}

// Mostrar modal de tipo de ponto
function showPointTypeModal(team, position) {
    const player = gameState.teams[team].courtPlayers[position];
    const modal = document.getElementById('point-type-modal');
    const playerNameEl = document.getElementById('point-type-player-name');
    
    playerNameEl.textContent = player.name;
    modal.classList.remove('hidden');
}

// Fechar modal de tipo de ponto
function closePointTypeModal() {
    const modal = document.getElementById('point-type-modal');
    modal.classList.add('hidden');
    // NÃO limpar pendingPoint aqui - ele é necessário para a seleção de jogador
}

// Adicionar ponto com tipo específico
function addPointWithType(pointType) {
    console.log('=== addPointWithType ===', { pointType, pendingPoint: gameState.pendingPoint });
    
    if (!gameState.pendingPoint) {
        console.error('pendingPoint não definido!');
        return;
    }
    
    const { team } = gameState.pendingPoint;
    
    // Armazenar o tipo de ponto
    gameState.pendingPointType = pointType;
    
    closePointTypeModal();
    
    // Se for erro (bola fora ou invasão), mostrar jogadores do time ADVERSÁRIO
    if (pointType === 'out' || pointType === 'invasion') {
        const opponentTeam = team === 'A' ? 'B' : 'A';
        gameState.errorType = pointType;
        console.log('Erro detectado! Mostrando time adversário:', { opponentTeam, errorType: pointType });
        showPlayerSelectionAfterType(opponentTeam, true);
    } else {
        // Se for ponto de ataque (normal, ace, bloqueio), mostrar jogadores do próprio time
        console.log('Ponto de ataque! Mostrando próprio time:', { team, pointType });
        showPlayerSelectionAfterType(team, false);
    }
}

// Selecionar jogador que cometeu o erro (CHAMADO DO selectPlayerForPoint)
function selectErrorPlayer(opponentTeam, errorPosition) {
    console.log('=== selectErrorPlayer ===', { opponentTeam, errorPosition, pendingPoint: gameState.pendingPoint, errorType: gameState.errorType });
    
    if (!gameState.pendingPoint || !gameState.errorType) {
        console.error('pendingPoint ou errorType não definido!');
        return;
    }
    
    const { team } = gameState.pendingPoint;
    const errorType = gameState.errorType;
    
    console.log('Chamando addPointByError...', { team, opponentTeam, errorPosition, errorType });
    
    // Time que fez o ponto recebe o ponto, mas não atribui ao jogador
    // O erro é atribuído ao jogador adversário
    addPointByError(team, opponentTeam, errorPosition, errorType);
    
    closePlayerModal();
    gameState.pendingPoint = null;
    gameState.errorType = null;
    gameState.pendingPointType = null;
}

// Fechar modal de seleção de erro
function closeErrorPlayerModal() {
    const modal = document.getElementById('error-player-modal');
    modal.classList.add('hidden');
    gameState.pendingPoint = null;
    gameState.errorType = null;
}

// Adicionar ponto por erro do adversário
function addPointByError(team, opponentTeam, errorPosition, errorType) {
    const wasOpponentServing = gameState.teams[opponentTeam].serving;
    
    gameState.teams[team].score++;
    
    // Atualizar estatísticas de erro do jogador adversário
    const errorPlayer = gameState.teams[opponentTeam].courtPlayers[errorPosition];
    if (errorPlayer) {
        if (!errorPlayer.stats.errors) {
            errorPlayer.stats.errors = { out: 0, invasion: 0 };
        }
        
        if (errorType === 'out') {
            errorPlayer.stats.errors.out++;
        } else if (errorType === 'invasion') {
            errorPlayer.stats.errors.invasion++;
        }
    }
    
    // Lógica de saque e rotação
    if (wasOpponentServing) {
        gameState.teams[opponentTeam].serving = false;
        gameState.teams[team].serving = true;
        
        const isFirstPoint = (team === 'A' && gameState.teams.A.score === 1 && gameState.teams.B.score === 0);
        
        if (!gameState.teams[team].lastServing && !isFirstPoint) {
            rotateTeamAuto(team);
        }
        
        gameState.teams[team].lastServing = true;
        gameState.teams[opponentTeam].lastServing = false;
    } else {
        gameState.teams[team].lastServing = true;
    }
    
    // Atualizar display
    updateScoreDisplay();
    updateCourtDisplay();
    
    // Verificar se ganhou o set
    checkSetWin(team);
    
    // Mostrar notificação (reutilizando errorPlayer já declarado acima)
    const errorTypeNames = {
        out: 'Bola Fora',
        invasion: 'Invasão'
    };
    if (errorPlayer) {
        showNotification(`${errorTypeNames[errorType]} de ${errorPlayer.name}! Ponto para ${gameState.teams[team].name} 🎉`, 'success');
    }
}

// Adicionar ponto
function addPoint(team, position, pointType = 'normal') {
    const opponentTeam = team === 'A' ? 'B' : 'A';
    const wasOpponentServing = gameState.teams[opponentTeam].serving;
    
    gameState.teams[team].score++;
    
    // Atualizar estatísticas do jogador
    if (gameState.teams[team].courtPlayers[position]) {
        const player = gameState.teams[team].courtPlayers[position];
        player.stats.points++;
        
        // Atualizar estatísticas por tipo de ponto
        if (!player.stats.pointTypes) {
            player.stats.pointTypes = {
                normal: 0,
                ace: 0,
                block: 0
            };
        }
        player.stats.pointTypes[pointType]++;
    }
    
    /* LÓGICA DE SAQUE E ROTAÇÃO - REGRAS DO VÔLEI:
     * 1. Rotação ocorre APENAS quando um time recupera o saque (conquista o saque do adversário)
     * 2. Enquanto o time continua sacando e fazendo pontos, NÃO há rotação
     * 3. EXCEÇÃO: No primeiro ponto do Time A, ele NÃO rotaciona (apenas recupera o saque)
     * 4. Exemplo:
     *    - Time B está sacando e Time A faz ponto → Time A recupera saque (NÃO rotaciona no 1º ponto)
     *    - Time A continua sacando e faz mais pontos → NÃO rotaciona
     *    - Time B faz ponto → Time B recupera saque e ROTACIONA
     */
    if (wasOpponentServing) {
        // Time que fez o ponto não estava sacando, então recupera o saque
        gameState.teams[opponentTeam].serving = false;
        gameState.teams[team].serving = true;
        
        // Verificar se precisa rotacionar
        // Rotaciona apenas se o time NÃO estava sacando antes (acabou de recuperar o saque)
        // EXCEÇÃO: Time A não rotaciona no primeiro ponto (quando placar é 1-0 ou 0-1)
        const isFirstPoint = (team === 'A' && gameState.teams.A.score === 1 && gameState.teams.B.score === 0);
        
        if (!gameState.teams[team].lastServing && !isFirstPoint) {
            rotateTeamAuto(team);
        }
        
        gameState.teams[team].lastServing = true;
        gameState.teams[opponentTeam].lastServing = false;
    } else {
        // Time que fez o ponto já estava sacando, mantém o saque e NÃO rotaciona
        gameState.teams[team].lastServing = true;
    }
    
    // Atualizar display
    updateScoreDisplay();
    updateCourtDisplay();
    
    // Verificar se ganhou o set
    checkSetWin(team);
    
    const pointTypeNames = {
        normal: 'Cortada',
        ace: 'Ace',
        block: 'Bloqueio'
    };
    const player = gameState.teams[team].courtPlayers[position];
    showNotification(`${pointTypeNames[pointType]} de ${player.name}! 🎉`, 'success');
}

// Remover ponto
function removePoint(team) {
    if (gameState.teams[team].score > 0) {
        gameState.teams[team].score--;
        updateScoreDisplay();
        showNotification(`Ponto removido do ${gameState.teams[team].name}`, 'info');
    }
}

// Atualizar display do placar
function updateScoreDisplay() {
    const scoreA = document.getElementById('scoreA');
    const scoreB = document.getElementById('scoreB');
    const setsA = document.getElementById('setsA');
    const setsB = document.getElementById('setsB');
    const currentSet = document.getElementById('currentSet');
    
    if (scoreA) scoreA.textContent = gameState.teams.A.score;
    if (scoreB) scoreB.textContent = gameState.teams.B.score;
    if (setsA) setsA.textContent = gameState.teams.A.sets;
    if (setsB) setsB.textContent = gameState.teams.B.sets;
    if (currentSet) currentSet.textContent = gameState.currentSet;
}

// Verificar vitória do set
function checkSetWin(team) {
    const score = gameState.teams[team].score;
    const opponentTeam = team === 'A' ? 'B' : 'A';
    const opponentScore = gameState.teams[opponentTeam].score;
    
    // Regras do vôlei: 25 pontos com 2 de diferença, ou primeiro a 15 no tie-break
    const isSetPoint = (gameState.currentSet <= 4 && score >= 25) || 
                      (gameState.currentSet === 5 && score >= 15);
    const hasAdvantage = score - opponentScore >= 2;
    
    if (isSetPoint && hasAdvantage) {
        gameState.teams[team].sets++;
        showNotification(`${gameState.teams[team].name} ganhou o set ${gameState.currentSet}!`, 'success');
        
        // Verificar vitória da partida
        if (gameState.teams[team].sets >= 3) {
            endMatch();
        } else {
            startNewSet();
        }
    }
}

// Iniciar novo set
function startNewSet() {
    gameState.currentSet++;
    gameState.teams.A.score = 0;
    gameState.teams.B.score = 0;
    
    // Alternar saque - mantém Time B começando
    gameState.teams.A.serving = false;
    gameState.teams.B.serving = true;
    gameState.teams.A.lastServing = false;
    gameState.teams.B.lastServing = false;
    
    // Resetar posição de saque para posição 5
    // Time A: posição 5 (canto superior esquerdo)
    // Time B: posição 5 (canto inferior direito)
    gameState.teams.A.servingPosition = 5;
    gameState.teams.B.servingPosition = 5;
    
    updateScoreDisplay();
    updateCourtDisplay();
    updateServingIndicator();
}

// Rotacionar time (manual)
function rotateTeam(team) {
    rotateTeamAuto(team);
    showNotification(`${gameState.teams[team].name} rotacionou manualmente!`, 'info');
}

// Rotacionar time automaticamente (lógica interna)
function rotateTeamAuto(team) {
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (!courtPlayers) return;
    
    // Criar mapeamento temporário dos jogadores
    const tempPlayers = {};
    Object.keys(courtPlayers).forEach(pos => {
        tempPlayers[pos] = { ...courtPlayers[pos] };
    });
    
    // Rotação horária (para a direita): 1→2→3→4→5→6→1
    const rotationMap = {
        '1': '2',
        '2': '3',
        '3': '4',
        '4': '5',
        '5': '6',
        '6': '1'
    };
    
    // Aplicar rotação
    Object.keys(tempPlayers).forEach(oldPos => {
        const newPos = rotationMap[oldPos];
        if (newPos) {
            courtPlayers[newPos] = tempPlayers[oldPos];
        }
    });
    
    // Atualizar posição de saque
    // Time A: saque na posição 5 (canto superior esquerdo)
    // Time B: saque na posição 5 (canto inferior direito)
    gameState.teams[team].servingPosition = 5;
    
    updateCourtDisplay();
}

// Fechar modal do jogador
function closePlayerModal() {
    const modal = document.getElementById('player-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// Finalizar partida
function endMatch() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
    }
    
    // Esconder seção do jogo e mostrar relatório
    document.getElementById('match-section').classList.add('hidden');
    document.getElementById('report-section').classList.remove('hidden');
    
    generateMatchReport();
}

// Gerar relatório da partida
function generateMatchReport() {
    const reportDiv = document.getElementById('match-report');
    const winner = gameState.teams.A.sets > gameState.teams.B.sets ? 'A' : 'B';
    const winnerName = gameState.teams[winner].name;
    
    const reportHTML = `
        <div style="text-align: center; padding: 20px; background: linear-gradient(45deg, #28a745, #20c997); color: white; border-radius: 15px; margin-bottom: 20px;">
            <h3 style="margin: 0; font-size: 2em;">🏆 ${winnerName} Venceu!</h3>
            <p style="margin: 10px 0; font-size: 1.2em;">Placar Final: ${gameState.teams.A.sets} x ${gameState.teams.B.sets}</p>
            <p style="margin: 10px 0;">Tempo de Jogo: ${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}</p>
        </div>
        
        <h3 style="text-align: center; color: #667eea; margin: 30px 0 20px;">📊 Estatísticas da Partida</h3>
        
        <div style="display: flex; gap: 20px; justify-content: space-between; margin-bottom: 30px;">
            <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid #2196F3;">
                <h4 style="color: #2196F3; text-align: center; margin-bottom: 15px;">🔵 ${gameState.teams.A.name}</h4>
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 8px 0;"><strong>Sets Vencidos:</strong> ${gameState.teams.A.sets}</p>
                    <p style="margin: 8px 0;"><strong>Pontos Totais:</strong> ${getTotalPoints('A')}</p>
                    <p style="margin: 8px 0;"><strong>Cortadas:</strong> ${getTotalPointsByType('A', 'normal')}</p>
                    <p style="margin: 8px 0;"><strong>Aces:</strong> ${getTotalPointsByType('A', 'ace')}</p>
                    <p style="margin: 8px 0;"><strong>Bloqueios:</strong> ${getTotalPointsByType('A', 'block')}</p>
                </div>
                ${getTopScorers('A')}
            </div>
            
            <div style="flex: 1; background: #f8f9fa; padding: 20px; border-radius: 10px; border-left: 5px solid #f44336;">
                <h4 style="color: #f44336; text-align: center; margin-bottom: 15px;">🔴 ${gameState.teams.B.name}</h4>
                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <p style="margin: 8px 0;"><strong>Sets Vencidos:</strong> ${gameState.teams.B.sets}</p>
                    <p style="margin: 8px 0;"><strong>Pontos Totais:</strong> ${getTotalPoints('B')}</p>
                    <p style="margin: 8px 0;"><strong>Cortadas:</strong> ${getTotalPointsByType('B', 'normal')}</p>
                    <p style="margin: 8px 0;"><strong>Aces:</strong> ${getTotalPointsByType('B', 'ace')}</p>
                    <p style="margin: 8px 0;"><strong>Bloqueios:</strong> ${getTotalPointsByType('B', 'block')}</p>
                </div>
                ${getTopScorers('B')}
            </div>
        </div>
        
        <h3 style="text-align: center; color: #667eea; margin: 40px 0 20px;">👥 Relatório Individual de Jogadores</h3>
        
        <div style="display: flex; gap: 20px; justify-content: space-between;">
            <div style="flex: 1;">
                <h4 style="color: #2196F3; text-align: center; margin-bottom: 15px;">🔵 ${gameState.teams.A.name}</h4>
                ${generateIndividualPlayerReport('A')}
            </div>
            
            <div style="flex: 1;">
                <h4 style="color: #f44336; text-align: center; margin-bottom: 15px;">🔴 ${gameState.teams.B.name}</h4>
                ${generateIndividualPlayerReport('B')}
            </div>
        </div>
    `;
    
    reportDiv.innerHTML = reportHTML;
}

// Gerar relatório individual de cada jogador
function generateIndividualPlayerReport(team) {
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (!courtPlayers) return '<p>Nenhum jogador registrado</p>';
    
    const players = [];
    Object.keys(courtPlayers).forEach(position => {
        const player = courtPlayers[position];
        players.push({
            name: player.name,
            position: player.position,
            stats: player.stats
        });
    });
    
    // Ordenar por pontos totais
    players.sort((a, b) => (b.stats.points || 0) - (a.stats.points || 0));
    
    let html = '<div style="display: flex; flex-direction: column; gap: 10px;">';
    
    players.forEach((player, index) => {
        const pointTypes = player.stats.pointTypes || { normal: 0, ace: 0, block: 0 };
        const totalPoints = player.stats.points || 0;
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏐';
        
        html += `
            <div style="background: white; padding: 15px; border-radius: 10px; border: 2px solid ${index < 3 ? '#ffd700' : '#e0e0e0'}; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div>
                        <span style="font-size: 1.3em;">${medal}</span>
                        <strong style="font-size: 1.1em; margin-left: 8px;">${player.name}</strong>
                        <span style="color: #666; font-size: 0.9em; margin-left: 8px;">(${getPositionName(player.position)})</span>
                    </div>
                    <div style="background: linear-gradient(45deg, #667eea, #764ba2); color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
                        ${totalPoints} ${totalPoints === 1 ? 'ponto' : 'pontos'}
                    </div>
                </div>
                <div style="display: flex; gap: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #666; font-size: 0.8em;">⚡ Cortadas</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #FF6B35;">${pointTypes.normal}</div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #666; font-size: 0.8em;">🎯 Aces</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #28a745;">${pointTypes.ace}</div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div style="color: #666; font-size: 0.8em;">🛡️ Bloqueios</div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #2196F3;">${pointTypes.block}</div>
                    </div>
                </div>
                ${getPlayerErrors(player.stats.errors)}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
}

// Obter erros do jogador formatado
function getPlayerErrors(errors) {
    if (!errors || (!errors.out && !errors.invasion)) {
        return '';
    }
    
    const totalErrors = (errors.out || 0) + (errors.invasion || 0);
    
    return `
        <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <div style="color: #856404; font-size: 0.85em; font-weight: bold; margin-bottom: 5px;">⚠️ Erros: ${totalErrors}</div>
            <div style="display: flex; gap: 10px; justify-content: space-around;">
                ${errors.out ? `<div style="text-align: center;">
                    <div style="font-size: 0.75em; color: #666;">🚫 Bola Fora</div>
                    <div style="font-size: 1.1em; font-weight: bold; color: #dc3545;">${errors.out}</div>
                </div>` : ''}
                ${errors.invasion ? `<div style="text-align: center;">
                    <div style="font-size: 0.75em; color: #666;">⚠️ Invasão</div>
                    <div style="font-size: 1.1em; font-weight: bold; color: #ff9800;">${errors.invasion}</div>
                </div>` : ''}
            </div>
        </div>
    `;
}

// Obter nome da posição formatado
function getPositionName(position) {
    const positions = {
        'libero': 'Líbero',
        'levantador': 'Levantador',
        'central': 'Central',
        'atacante': 'Atacante Ponta',
        'oposto': 'Oposto',
        'defensor': 'Defensor Central'
    };
    return positions[position] || position || 'Jogador';
}

// Obter total de pontos por tipo
function getTotalPointsByType(team, pointType) {
    let total = 0;
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (courtPlayers) {
        Object.keys(courtPlayers).forEach(position => {
            const player = courtPlayers[position];
            if (player.stats.pointTypes && player.stats.pointTypes[pointType]) {
                total += player.stats.pointTypes[pointType];
            }
        });
    }
    return total;
}

// Obter total de erros (mantido para compatibilidade)
function getTotalErrors(team) {
    let total = 0;
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (courtPlayers) {
        Object.keys(courtPlayers).forEach(position => {
            total += courtPlayers[position].stats.errors || 0;
        });
    }
    return total;
}

// Obter maiores pontuadores
function getTopScorers(team) {
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (!courtPlayers) return '';
    
    const players = [];
    Object.keys(courtPlayers).forEach(position => {
        const player = courtPlayers[position];
        if (player.stats.points > 0) {
            players.push({
                name: player.name,
                points: player.stats.points
            });
        }
    });
    
    // Ordenar por pontos
    players.sort((a, b) => b.points - a.points);
    
    if (players.length === 0) {
        return '<div style="background: white; padding: 10px; border-radius: 8px; text-align: center; color: #999;">Nenhum ponto marcado</div>';
    }
    
    let html = '<div style="background: white; padding: 10px; border-radius: 8px;"><h5 style="margin: 0 0 10px 0; color: #667eea;">⭐ Maiores Pontuadores:</h5>';
    players.slice(0, 3).forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
        html += `<p style="margin: 5px 0;">${medal} <strong>${player.name}:</strong> ${player.points} pontos</p>`;
    });
    html += '</div>';
    
    return html;
}

// Obter total de pontos do time
function getTotalPoints(team) {
    let total = 0;
    const courtPlayers = gameState.teams[team].courtPlayers;
    
    if (courtPlayers) {
        Object.keys(courtPlayers).forEach(position => {
            total += courtPlayers[position].stats.points || 0;
        });
    }
    
    return total;
}

// Nova partida
function newMatch() {
    // Reset do estado
    gameState = {
        teams: {
            A: {
                name: 'Time A',
                score: 0,
                sets: 0,
                players: {},
                reserves: {},
                serving: true,
                rotation: [1, 2, 3, 4, 5, 6]
            },
            B: {
                name: 'Time B',
                score: 0,
                sets: 0,
                players: {},
                reserves: {},
                serving: false,
                rotation: [1, 2, 3, 4, 5, 6]
            }
        },
        currentSet: 1,
        matchStarted: false,
        timer: 0,
        timerInterval: null
    };
    
    // Limpar campos
    document.querySelectorAll('.player-name-input').forEach(input => {
        input.value = '';
    });
    
    document.querySelectorAll('.player-position-select').forEach(select => {
        select.value = '';
    });
    
    document.querySelectorAll('.player-input-card').forEach(card => {
        card.classList.remove('filled');
    });
    
    // Mostrar seção de setup
    document.getElementById('setup-section').classList.remove('hidden');
    document.getElementById('match-section').classList.add('hidden');
    document.getElementById('report-section').classList.add('hidden');
    
    showNotification('Nova partida iniciada!', 'info');
}

// Exportar relatório
function exportReport() {
    const reportData = {
        winner: gameState.teams.A.sets > gameState.teams.B.sets ? 'A' : 'B',
        finalScore: `${gameState.teams.A.sets} x ${gameState.teams.B.sets}`,
        duration: `${Math.floor(gameState.timer / 60)}:${(gameState.timer % 60).toString().padStart(2, '0')}`,
        teams: gameState.teams
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `relatorio-volei-${new Date().toLocaleDateString()}.json`;
    link.click();
    
    showNotification('Relatório exportado!', 'success');
}

// Variável para armazenar a substituição pendente
let pendingSubstitution = {
    team: null,
    playerOut: null,
    playerIn: null
};

// Mostrar painel de substituição
function showSubstitutionPanel(team) {
    pendingSubstitution.team = team;
    pendingSubstitution.playerOut = null;
    pendingSubstitution.playerIn = null;
    
    const panel = document.getElementById('substitution-panel');
    const teamName = document.getElementById('substitution-team');
    
    teamName.textContent = gameState.teams[team].name;
    
    // Preencher jogadores em quadra
    const playersOut = document.getElementById('players-out');
    playersOut.innerHTML = '';
    
    const courtPlayers = gameState.teams[team].courtPlayers;
    if (courtPlayers) {
        Object.keys(courtPlayers).forEach(position => {
            const player = courtPlayers[position];
            const playerDiv = document.createElement('div');
            playerDiv.className = 'substitution-player-card';
            playerDiv.innerHTML = `
                <div class="player-photo-sub" style="${player.photo ? `background-image: url(${player.photo}); background-size: cover; background-position: center;` : ''}">
                    ${!player.photo ? '👤' : ''}
                </div>
                <div class="player-info-sub">
                    <strong>${player.name}</strong>
                    <small>Posição ${position}</small>
                </div>
            `;
            playerDiv.onclick = () => selectPlayerOut(position);
            playersOut.appendChild(playerDiv);
        });
    }
    
    // Preencher jogadores reservas
    const playersIn = document.getElementById('players-in');
    playersIn.innerHTML = '';
    
    const reserves = gameState.teams[team].reserves;
    if (reserves && Object.keys(reserves).length > 0) {
        Object.keys(reserves).forEach(index => {
            const player = reserves[index];
            if (player.name) {
                const playerDiv = document.createElement('div');
                playerDiv.className = 'substitution-player-card';
                playerDiv.innerHTML = `
                    <div class="player-photo-sub" style="${player.photo ? `background-image: url(${player.photo}); background-size: cover; background-position: center;` : ''}">
                        ${!player.photo ? '👤' : ''}
                    </div>
                    <div class="player-info-sub">
                        <strong>${player.name}</strong>
                        <small>Reserva</small>
                    </div>
                `;
                playerDiv.onclick = () => selectPlayerIn(index);
                playersIn.appendChild(playerDiv);
            }
        });
    } else {
        playersIn.innerHTML = '<p style="text-align: center; color: #999;">Nenhum jogador reserva cadastrado</p>';
    }
    
    panel.classList.remove('hidden');
}

// Selecionar jogador que vai sair
function selectPlayerOut(position) {
    // Remover seleção anterior
    document.querySelectorAll('#players-out .substitution-player-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Marcar selecionado
    event.currentTarget.classList.add('selected');
    pendingSubstitution.playerOut = position;
}

// Selecionar jogador que vai entrar
function selectPlayerIn(index) {
    // Remover seleção anterior
    document.querySelectorAll('#players-in .substitution-player-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Marcar selecionado
    event.currentTarget.classList.add('selected');
    pendingSubstitution.playerIn = index;
}

// Confirmar substituição
function confirmSubstitution() {
    if (!pendingSubstitution.playerOut || !pendingSubstitution.playerIn) {
        showNotification('Selecione um jogador para sair e outro para entrar!', 'warning');
        return;
    }
    
    const team = pendingSubstitution.team;
    const positionOut = pendingSubstitution.playerOut;
    const indexIn = pendingSubstitution.playerIn;
    
    // Pegar os dados dos jogadores
    const playerOut = gameState.teams[team].courtPlayers[positionOut];
    const playerIn = gameState.teams[team].reserves[indexIn];
    
    // Fazer a substituição
    gameState.teams[team].courtPlayers[positionOut] = {
        name: playerIn.name,
        position: playerIn.position || 'substituto',
        photo: playerIn.photo || null,
        originalIndex: indexIn,
        stats: {
            points: 0,
            aces: 0,
            blocks: 0,
            errors: {
                out: 0,
                invasion: 0
            },
            pointTypes: {
                normal: 0,
                ace: 0,
                block: 0
            }
        }
    };
    
    // Mover jogador que saiu para reserva (opcional)
    // gameState.teams[team].reserves[`SUB-${positionOut}`] = playerOut;
    
    // Atualizar display
    updateCourtDisplay();
    closeSubstitutionPanel();
    
    showNotification(`${playerIn.name} entrou no lugar de ${playerOut.name}!`, 'success');
}

// Fechar painel de substituição
function closeSubstitutionPanel() {
    const panel = document.getElementById('substitution-panel');
    panel.classList.add('hidden');
    pendingSubstitution = { team: null, playerOut: null, playerIn: null };
}

// Tempo técnico
function callTimeout(team) {
    showNotification(`⏱️ Tempo solicitado pelo ${gameState.teams[team].name}`, 'info');
}