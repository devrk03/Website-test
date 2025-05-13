/**
 * Main application file that initializes the chess game and connects all components
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game components
    const chessGame = new ChessGame();
    const chessboard = new Chessboard(document.getElementById('chessboard'), chessGame);
    const animator = new ChessAnimator(chessboard);
    const notationManager = new NotationManager();
    const soundManager = new SoundEffectsManager();
    const aiPlayer = new AIPlayer(chessGame);
    
    // Game state variables
    let isFlipped = false;
    let gameInProgress = false;
    let playerTimers = {
        white: 10 * 60, // 10 minutes in seconds
        black: 10 * 60
    };
    let timerInterval = null;
    let activeColor = 'white';
    let selectedPiece = null;
    let promotionCallback = null;
    
    // DOM elements
    const statusMessage = document.getElementById('status-message');
    const checkStatus = document.getElementById('check-status');
    const moveHistory = document.getElementById('move-history');
    const whiteTimer = document.querySelector('.white-timer');
    const blackTimer = document.querySelector('.black-timer');
    const whiteCaptured = document.querySelector('.white-captured');
    const blackCaptured = document.querySelector('.black-captured');
    const promotionModal = document.getElementById('promotion-modal');
    const gameOverModal = document.getElementById('game-over-modal');
    const gameOverTitle = document.getElementById('game-over-title');
    const gameOverMessage = document.getElementById('game-over-message');
    
    // Control buttons
    const newGameBtn = document.getElementById('new-game-btn');
    const undoBtn = document.getElementById('undo-btn');
    const flipBoardBtn = document.getElementById('flip-board-btn');
    const resignBtn = document.getElementById('resign-btn');
    const offerDrawBtn = document.getElementById('offer-draw-btn');
    const aiHintBtn = document.getElementById('ai-hint-btn');
    const saveGameBtn = document.getElementById('save-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');
    const themeSelect = document.getElementById('theme-select');
    const showLegalMovesCheckbox = document.getElementById('show-legal-moves');
    const soundEnabledCheckbox = document.getElementById('sound-enabled');
    const animationSpeedSlider = document.getElementById('animation-speed');
    const newGameModalBtn = document.getElementById('new-game-modal-btn');
    const analyzeGameBtn = document.getElementById('analyze-game-btn');
    
    // Initialize the board
    initializeBoard();
    setupEventListeners();
    setupCoordinates();
    applyTheme(themeSelect.value);
    
    /**
     * Initialize the chess board and start a new game
     */
    function initializeBoard() {
        chessGame.resetGame();
        chessboard.render();
        resetTimers();
        updateStatus();
        updateMoveHistory();
        clearCapturedPieces();
        gameInProgress = true;
        activeColor = 'white';
    }
    
    /**
     * Set up click and other event listeners
     */
    function setupEventListeners() {
        // Board interactions
        chessboard.onSquareClick = handleSquareClick;
        chessboard.onPieceDragStart = handlePieceDragStart;
        chessboard.onPieceDragMove = handlePieceDragMove;
        chessboard.onPieceDragEnd = handlePieceDragEnd;
        
        // Game controls
        newGameBtn.addEventListener('click', startNewGame);
        undoBtn.addEventListener('click', undoMove);
        flipBoardBtn.addEventListener('click', flipBoard);
        resignBtn.addEventListener('click', resignGame);
        offerDrawBtn.addEventListener('click', offerDraw);
        aiHintBtn.addEventListener('click', getAIHint);
        saveGameBtn.addEventListener('click', saveGame);
        loadGameBtn.addEventListener('click', loadGame);
        
        // Settings
        themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
        showLegalMovesCheckbox.addEventListener('change', 
            () => chessboard.setShowLegalMoves(showLegalMovesCheckbox.checked));
        soundEnabledCheckbox.addEventListener('change', 
            () => soundManager.setEnabled(soundEnabledCheckbox.checked));
        animationSpeedSlider.addEventListener('input', 
            () => animator.setAnimationSpeed(parseFloat(animationSpeedSlider.value)));
        
        // Promotion modal
        document.querySelectorAll('.promotion-piece').forEach(piece => {
            piece.addEventListener('click', handlePromotionSelection);
        });
        
        // Game over modal
        newGameModalBtn.addEventListener('click', () => {
            hideGameOverModal();
            startNewGame();
        });
        
        analyzeGameBtn.addEventListener('click', analyzeGame);
        
        // Move history navigation
        moveHistory.addEventListener('click', (e) => {
            if (e.target.classList.contains('white-move') || 
                e.target.classList.contains('black-move')) {
                navigateToMove(e.target);
            }
        });
        
        // Key bindings
        document.addEventListener('keydown', handleKeyPress);
    }
    
    /**
     * Set up the board coordinates
     */
    function setupCoordinates() {
        const rankCoords = document.querySelector('.rank-coordinates');
        const fileCoords = document.querySelector('.file-coordinates');
        
        // Create rank (1-8) labels
        for (let i = 8; i >= 1; i--) {
            const rankSpan = document.createElement('span');
            rankSpan.textContent = i;
            rankCoords.appendChild(rankSpan);
        }
        
        // Create file (a-h) labels
        for (let i = 0; i < 8; i++) {
            const fileSpan = document.createElement('span');
            fileSpan.textContent = String.fromCharCode(97 + i); // 'a' to 'h'
            fileCoords.appendChild(fileSpan);
        }
    }
    
    /**
     * Handle a square click event
     * @param {number} row - The row index
     * @param {number} col - The column index
     */
    function handleSquareClick(row, col) {
        if (!gameInProgress) return;
        
        const square = chessboard.getSquare(row, col);
        const piece = chessGame.getPieceAt(row, col);
        
        // If a piece is already selected
        if (selectedPiece) {
            // If clicked on the same piece, deselect it
            if (selectedPiece.row === row && selectedPiece.col === col) {
                deselectPiece();
                return;
            }
            
            // Try to move the selected piece to the clicked square
            const move = {
                fromRow: selectedPiece.row,
                fromCol: selectedPiece.col,
                toRow: row,
                toCol: col
            };
            
            const moveResult = tryMove(move);
            if (!moveResult) {
                // If move failed but clicked on own piece, select that piece instead
                if (piece && piece.color === activeColor) {
                    selectPiece(row, col);
                }
            }
            return;
        }
        
        // If no piece is selected and clicked on a piece of the active color
        if (piece && piece.color === activeColor) {
            selectPiece(row, col);
        }
    }
    
    /**
     * Handle the start of a piece drag
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @returns {boolean} - Whether the drag can start
     */
    function handlePieceDragStart(row, col) {
        const piece = chessGame.getPieceAt(row, col);
        if (!gameInProgress || !piece || piece.color !== activeColor) {
            return false;
        }
        
        selectPiece(row, col);
        return true;
    }
    
    /**
     * Handle the movement of a dragged piece
     * @param {number} x - The x coordinate
     * @param {number} y - The y coordinate
     */
    function handlePieceDragMove(x, y) {
        // This is handled by the Chessboard class
    }
    
    /**
     * Handle the end of a piece drag
     * @param {number} row - The target row index
     * @param {number} col - The target column index
     */
    function handlePieceDragEnd(row, col) {
        if (!selectedPiece) return;
        
        const move = {
            fromRow: selectedPiece.row,
            fromCol: selectedPiece.col,
            toRow: row,
            toCol: col
        };
        
        tryMove(move);
    }
    
    /**
     * Select a piece on the board
     * @param {number} row - The row index
     * @param {number} col - The column index
     */
    function selectPiece(row, col) {
        deselectPiece();
        
        const piece = chessGame.getPieceAt(row, col);
        if (!piece || piece.color !== activeColor) return;
        
        selectedPiece = { row, col, piece };
        chessboard.selectSquare(row, col);
        
        if (showLegalMovesCheckbox.checked) {
            const legalMoves = chessGame.getLegalMovesForPiece(row, col);
            chessboard.showLegalMoves(legalMoves);
        }
        
        soundManager.playSound('select');
    }
    
    /**
     * Deselect the currently selected piece
     */
    function deselectPiece() {
        if (selectedPiece) {
            chessboard.deselectSquare(selectedPiece.row, selectedPiece.col);
            chessboard.hideLegalMoves();
            selectedPiece = null;
        }
    }
    
    /**
     * Try to make a move on the board
     * @param {Object} move - The move to attempt
     * @returns {boolean} - Whether the move was successful
     */
    function tryMove(move) {
        const result = chessGame.makeMove(move);
        
        if (result.valid) {
            // Handle the move
            handleSuccessfulMove(move, result);
            return true;
        } else {
            // Handle invalid move
            if (result.error) {
                console.log('Invalid move:', result.error);
                soundManager.playSound('illegal');
            }
            deselectPiece();
            return false;
        }
    }
    
    /**
     * Handle a successful move
     * @param {Object} move - The move that was made
     * @param {Object} result - The result of the move
     */
    function handleSuccessfulMove(move, result) {
        deselectPiece();
        
        // Handle special moves
        if (result.isPromotion) {
            showPromotionModal(move, result.color);
            return;
        }
        
        completeMove(move, result);
    }
    
    /**
     * Complete a move after any special handling
     * @param {Object} move - The move that was made
     * @param {Object} result - The result of the move
     * @param {string} promotionPiece - The piece to promote to (if applicable)
     */
    function completeMove(move, result, promotionPiece = null) {
        const { fromRow, fromCol, toRow, toCol } = move;
        const moveType = result.moveType || 'normal';
        
        // Handle pawn promotion if applicable
        if (result.isPromotion && promotionPiece) {
            chessGame.promotePawn(toRow, toCol, promotionPiece);
        }
        
        // Animate the move
        animator.animateMove(move, moveType, () => {
            // After animation completes
            chessboard.render();
            chessboard.highlightLastMove(fromRow, fromCol, toRow, toCol);
            
            // Handle captured pieces
            if (result.capturedPiece) {
                addCapturedPiece(result.capturedPiece);
                soundManager.playSound('capture');
            } else {
                soundManager.playSound('move');
            }
            
            // If it was a castle, play a special sound
            if (moveType === 'castling') {
                soundManager.playSound('castle');
            }
            
            // Update game state
            switchActivePlayer();
            updateStatus();
            updateMoveHistory();
            
            // Check for game end
            checkGameEnd();
        });
    }
    
    /**
     * Show the pawn promotion modal
     * @param {Object} move - The move that triggered the promotion
     * @param {string} color - The color of the pawn being promoted
     */
    function showPromotionModal(move, color) {
        const promotionPieces = document.querySelectorAll('.promotion-piece-img');
        
        // Set the correct images for the promotion pieces
        promotionPieces.forEach(img => {
            const pieceType = img.parentElement.getAttribute('data-piece');
            img.src = `/Pieces/${pieceType}-${color.charAt(0)}.svg`;
        });
        
        // Store the callback to complete the move
        promotionCallback = (pieceType) => {
            const result = {
                valid: true,
                isPromotion: true,
                color: color
            };
            completeMove(move, result, pieceType);
        };
        
        // Show the modal
        promotionModal.style.display = 'flex';
    }
    
    /**
     * Handle the selection of a promotion piece
     * @param {Event} e - The click event
     */
    function handlePromotionSelection(e) {
        const pieceType = e.currentTarget.getAttribute('data-piece');
        
        if (promotionCallback) {
            promotionCallback(pieceType);
            promotionCallback = null;
            promotionModal.style.display = 'none';
        }
    }
    
    /**
     * Switch the active player
     */
    function switchActivePlayer() {
        activeColor = activeColor === 'white' ? 'black' : 'white';
    }
    
    /**
     * Update the game status display
     */
    function updateStatus() {
        // Update turn indicator
        statusMessage.textContent = `${activeColor.charAt(0).toUpperCase() + activeColor.slice(1)} to move`;
        
        // Check for check
        if (chessGame.isInCheck(activeColor)) {
            checkStatus.textContent = 'CHECK!';
            chessboard.highlightCheck(chessGame.getKingPosition(activeColor));
            soundManager.playSound('check');
        } else {
            checkStatus.textContent = '';
            chessboard.clearCheckHighlight();
        }
    }
    
    /**
     * Update the move history display
     */
    function updateMoveHistory() {
        const moves = chessGame.getMoveHistory();
        moveHistory.innerHTML = '';
        
        for (let i = 0; i < moves.length; i += 2) {
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = moves[i] ? notationManager.formatMove(moves[i]) : '';
            const blackMove = moves[i + 1] ? notationManager.formatMove(moves[i + 1]) : '';
            
            const moveRow = document.createElement('div');
            moveRow.className = 'move-row';
            
            const numberCell = document.createElement('div');
            numberCell.className = 'move-number';
            numberCell.textContent = moveNumber;
            
            const whiteCell = document.createElement('div');
            whiteCell.className = 'white-move';
            whiteCell.textContent = whiteMove;
            whiteCell.setAttribute('data-move-index', i);
            
            const blackCell = document.createElement('div');
            blackCell.className = 'black-move';
            blackCell.textContent = blackMove;
            if (moves[i + 1]) {
                blackCell.setAttribute('data-move-index', i + 1);
            }
            
            moveRow.appendChild(numberCell);
            moveRow.appendChild(whiteCell);
            moveRow.appendChild(blackCell);
            
            moveHistory.appendChild(moveRow);
        }
        
        // Scroll to the bottom
        moveHistory.scrollTop = moveHistory.scrollHeight;
    }
    
    /**
     * Add a captured piece to the display
     * @param {Object} piece - The captured piece
     */
    function addCapturedPiece(piece) {
        const container = piece.color === 'white' ? blackCaptured : whiteCaptured;
        
        const capturedElement = document.createElement('div');
        capturedElement.className = 'captured-piece';
        capturedElement.style.backgroundImage = `url(/Pieces/${piece.type}-${piece.color.charAt(0)}.svg)`;
        
        container.appendChild(capturedElement);
    }
    
    /**
     * Clear the captured pieces display
     */
    function clearCapturedPieces() {
        whiteCaptured.innerHTML = '';
        blackCaptured.innerHTML = '';
    }
    
    /**
     * Check if the game has ended
     */
    function checkGameEnd() {
        const gameState = chessGame.getGameState();
        
        if (gameState.isCheckmate || gameState.isStalemate || 
            gameState.isDrawByRepetition || gameState.isDrawByInsufficientMaterial || 
            gameState.isDrawByFiftyMoveRule) {
            
            endGame(gameState);
        }
    }
    
    /**
     * End the game and show the game over modal
     * @param {Object} gameState - The final game state
     */
    function endGame(gameState) {
        gameInProgress = false;
        stopTimers();
        
        let title, message;
        
        if (gameState.isCheckmate) {
            const winner = activeColor === 'white' ? 'Black' : 'White';
            title = 'Checkmate!';
            message = `${winner} wins by checkmate.`;
            soundManager.playSound('gameOver');
        } else if (gameState.isStalemate) {
            title = 'Stalemate!';
            message = 'The game is a draw by stalemate.';
            soundManager.playSound('draw');
        } else if (gameState.isDrawByRepetition) {
            title = 'Draw!';
            message = 'The game is a draw by threefold repetition.';
            soundManager.playSound('draw');
        } else if (gameState.isDrawByInsufficientMaterial) {
            title = 'Draw!';
            message = 'The game is a draw by insufficient material.';
            soundManager.playSound('draw');
        } else if (gameState.isDrawByFiftyMoveRule) {
            title = 'Draw!';
            message = 'The game is a draw by the fifty-move rule.';
            soundManager.playSound('draw');
        }
        
        showGameOverModal(title, message);
    }
    
    /**
     * Show the game over modal
     * @param {string} title - The title to display
     * @param {string} message - The message to display
     */
    function showGameOverModal(title, message) {
        gameOverTitle.textContent = title;
        gameOverMessage.textContent = message;
        gameOverModal.style.display = 'flex';
    }
    
    /**
     * Hide the game over modal
     */
    function hideGameOverModal() {
        gameOverModal.style.display = 'none';
    }
    
    /**
     * Reset and start the player timers
     */
    function resetTimers() {
        stopTimers();
        
        playerTimers = {
            white: 10 * 60,
            black: 10 * 60
        };
        
        updateTimerDisplay('white');
        updateTimerDisplay('black');
        
        startTimers();
    }
    
    /**
     * Start the timers
     */
    function startTimers() {
        timerInterval = setInterval(() => {
            playerTimers[activeColor]--;
            
            updateTimerDisplay(activeColor);
            
            if (playerTimers[activeColor] <= 0) {
                timeOut();
            }
        }, 1000);
    }
    
    /**
     * Stop the timers
     */
    function stopTimers() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
    
    /**
     * Update the display for a timer
     * @param {string} color - The color whose timer to update
     */
    function updateTimerDisplay(color) {
        const timerElement = color === 'white' ? whiteTimer : blackTimer;
        const seconds = playerTimers[color];
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // Add warning class if time is low
        if (seconds < 60) {
            timerElement.classList.add('time-warning');
        } else {
            timerElement.classList.remove('time-warning');
        }
    }
    
    /**
     * Handle a timeout
     */
    function timeOut() {
        stopTimers();
        gameInProgress = false;
        
        const winner = activeColor === 'white' ? 'Black' : 'White';
        showGameOverModal('Time Out!', `${winner} wins on time.`);
        soundManager.playSound('gameOver');
    }
    
    /**
     * Start a new game
     */
    function startNewGame() {
        initializeBoard();
        deselectPiece();
        gameInProgress = true;
        soundManager.playSound('newGame');
    }
    
    /**
     * Undo the last move
     */
    function undoMove() {
        if (!gameInProgress || chessGame.getMoveHistory().length === 0) return;
        
        chessGame.undoLastMove();
        chessboard.render();
        chessboard.clearLastMoveHighlight();
        chessboard.clearCheckHighlight();
        
        // If we undid two moves (for both players), switch back to the correct player
        if (chessGame.getMoveHistory().length % 2 === 0) {
            activeColor = 'white';
        } else {
            activeColor = 'black';
        }
        
        updateStatus();
        updateMoveHistory();
        clearCapturedPieces();
        
        // Rebuild captured pieces display
        const capturedPieces = chessGame.getCapturedPieces();
        capturedPieces.forEach(piece => addCapturedPiece(piece));
        
        soundManager.playSound('undo');
    }
    
    /**
     * Flip the board orientation
     */
    function flipBoard() {
        isFlipped = !isFlipped;
        const board = document.getElementById('chessboard');
        
        // Add flip animation class
        board.classList.add('flip-animation');
        
        setTimeout(() => {
            chessboard.setFlipped(isFlipped);
            chessboard.render();
            
            // Restore highlights
            const lastMove = chessGame.getLastMove();
            if (lastMove) {
                chessboard.highlightLastMove(
                    lastMove.fromRow, 
                    lastMove.fromCol, 
                    lastMove.toRow, 
                    lastMove.toCol
                );
            }
            
            if (chessGame.isInCheck(activeColor)) {
                chessboard.highlightCheck(chessGame.getKingPosition(activeColor));
            }
            
            // Remove animation class after animation completes
            setTimeout(() => {
                board.classList.remove('flip-animation');
            }, 500);
            
        }, 250);
        
        soundManager.playSound('flip');
    }
    
    /**
     * Resign the current game
     */
    function resignGame() {
        if (!gameInProgress) return;
        
        gameInProgress = false;
        stopTimers();
        
        const winner = activeColor === 'white' ? 'Black' : 'White';
        showGameOverModal('Resignation', `${winner} wins by resignation.`);
        soundManager.playSound('gameOver');
    }
    
    /**
     * Offer a draw to the opponent
     */
    function offerDraw() {
        if (!gameInProgress) return;
        
        // In a real app, this would interact with the other player
        // For this demo, we'll just show a simulated response
        const accept = confirm('Offer a draw to your opponent?');
        
        if (accept) {
            gameInProgress = false;
            stopTimers();
            showGameOverModal('Draw Agreement', 'The game is a draw by agreement.');
            soundManager.playSound('draw');
        }
    }
    
    /**
     * Get a hint from the AI
     */
    function getAIHint() {
        if (!gameInProgress) return;
        
        const hint = aiPlayer.getBestMove(activeColor);
        if (hint) {
            chessboard.showHint(hint);
            soundManager.playSound('hint');
        }
    }
    
    /**
     * Save the current game state
     */
    function saveGame() {
        const gameData = {
            position: chessGame.getPosition(),
            moveHistory: chessGame.getMoveHistory(),
            activeColor: activeColor,
            timers: playerTimers
        };
        
        localStorage.setItem('savedChessGame', JSON.stringify(gameData));
        alert('Game saved successfully!');
    }
    
    /**
     * Load a saved game state
     */
    function loadGame() {
        const savedGame = localStorage.getItem('savedChessGame');
        
        if (!savedGame) {
            alert('No saved game found!');
            return;
        }
        
        try {
            const gameData = JSON.parse(savedGame);
            
            chessGame.loadPosition(gameData.position);
            chessGame.setMoveHistory(gameData.moveHistory);
            activeColor = gameData.activeColor;
            playerTimers = gameData.timers;
            
            chessboard.render();
            updateStatus();
            updateMoveHistory();
            clearCapturedPieces();
            
            // Rebuild captured pieces display
            const capturedPieces = chessGame.getCapturedPieces();
            capturedPieces.forEach(piece => addCapturedPiece(piece));
            
            // Update timers
            updateTimerDisplay('white');
            updateTimerDisplay('black');
            
            // Highlight last move if there is one
            const lastMove = chessGame.getLastMove();
            if (lastMove) {
                chessboard.highlightLastMove(
                    lastMove.fromRow, 
                    lastMove.fromCol, 
                    lastMove.toRow, 
                    lastMove.toCol
                );
            }
            
            gameInProgress = true;
            startTimers();
            
            soundManager.playSound('loadGame');
        } catch (error) {
            console.error('Error loading game:', error);
            alert('Error loading saved game!');
        }
    }
    
    /**
     * Apply a theme to the chessboard
     * @param {string} theme - The theme to apply
     */
    function applyTheme(theme) {
        document.body.className = ''; // Clear existing themes
        document.body.classList.add(`theme-${theme}`);
    }
    
    /**
     * Navigate to a specific move in the history
     * @param {Element} moveElement - The move element that was clicked
     */
    function navigateToMove(moveElement) {
        const moveIndex = parseInt(moveElement.getAttribute('data-move-index'));
        if (isNaN(moveIndex)) return;
        
        // Reset current move highlights
        document.querySelectorAll('.current-move').forEach(el => {
            el.classList.remove('current-move');
        });
        
        // Highlight the selected move
        moveElement.classList.add('current-move');
        
        // Replay the game up to the selected move
        chessGame.replayToMove(moveIndex);
        chessboard.render();
        
        // Update the board state
        const move = chessGame.getMoveHistory()[moveIndex];
        if (move) {
            chessboard.highlightLastMove(
                move.fromRow, 
                move.fromCol, 
                move.toRow, 
                move.toCol
            );
        }
        
        // Game is temporarily paused in review mode
        const wasInProgress = gameInProgress;
        gameInProgress = false;
        
        // Show a button to return to the current game
        const returnButton = document.createElement('button');
        returnButton.textContent = 'Return to Game';
        returnButton.className = 'btn primary-btn';
        returnButton.style.position = 'absolute';
        returnButton.style.top = '50%';
        returnButton.style.left = '50%';
        returnButton.style.transform = 'translate(-50%, -50%)';
        returnButton.style.zIndex = '10';
        
        returnButton.addEventListener('click', () => {
            document.body.removeChild(returnButton);
            chessGame.replayToLatestMove();
            chessboard.render();
            
            const lastMove = chessGame.getLastMove();
            if (lastMove) {
                chessboard.highlightLastMove(
                    lastMove.fromRow, 
                    lastMove.fromCol, 
                    lastMove.toRow, 
                    lastMove.toCol
                );
            }
            
            gameInProgress = wasInProgress;
        });
        
        document.body.appendChild(returnButton);
    }
    
    /**
     * Handle key press events
     * @param {KeyboardEvent} e - The key event
     */
    function handleKeyPress(e) {
        // Left arrow - undo move
        if (e.key === 'ArrowLeft') {
            undoMove();
        }
        
        // Right arrow - AI hint
        if (e.key === 'ArrowRight') {
            getAIHint();
        }
        
        // Spacebar - flip board
        if (e.key === ' ' && !e.target.matches('input, textarea, select, button')) {
            e.preventDefault();
            flipBoard();
        }
        
        // N key - new game
        if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            startNewGame();
        }
    }
    
    /**
     * Analyze the current game
     */
    function analyzeGame() {
        // In a real app, this would open a detailed analysis view
        // For this demo, we'll just show an alert with basic stats
        
        const moveHistory = chessGame.getMoveHistory();
        const captureCount = chessGame.getCapturedPieces().length;
        const checkCount = moveHistory.filter(move => move.isCheck).length;
        
        alert(`Game Analysis:
        - Total moves: ${moveHistory.length}
        - Captures: ${captureCount}
        - Checks: ${checkCount}
        
        A full analysis would show evaluations, mistakes, and suggested improvements.`);
        
        hideGameOverModal();
    }
});
