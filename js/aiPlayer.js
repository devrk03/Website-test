/**
 * Simple AI player for chess
 */
class AIPlayer {
    constructor(chessGame) {
        this.chessGame = chessGame;
        this.maxDepth = 3; // Default search depth
        this.pieceValues = {
            pawn: 1,
            knight: 3,
            bishop: 3,
            rook: 5,
            queen: 9,
            king: 100
        };
    }
    
    /**
     * Get the best move for a color
     * @param {string} color - The color to find a move for
     * @returns {Object} - The best move
     */
    getBestMove(color) {
        const legalMoves = this.getAllLegalMoves(color);
        if (legalMoves.length === 0) {
            return null;
        }
        
        let bestScore = -Infinity;
        let bestMove = null;
        
        for (const move of legalMoves) {
            // Make the move on a copy of the game
            const gameCopy = this.copyGame();
            gameCopy.makeMove(move);
            
            // Evaluate the position after the move
            const score = -this.minimax(gameCopy, this.maxDepth - 1, -Infinity, Infinity, color === 'white' ? 'black' : 'white');
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        
        return bestMove;
    }
    
    /**
     * Minimax algorithm with alpha-beta pruning
     * @param {Object} game - The game state
     * @param {number} depth - The search depth
     * @param {number} alpha - Alpha value for pruning
     * @param {number} beta - Beta value for pruning
     * @param {string} color - The color to move
     * @returns {number} - The evaluation score
     */
    minimax(game, depth, alpha, beta, color) {
        // Check for terminal node
        if (depth === 0 || this.isGameOver(game)) {
            return this.evaluatePosition(game, color);
        }
        
        const legalMoves = this.getAllLegalMoves(color, game);
        
        if (legalMoves.length === 0) {
            // If no legal moves, either checkmate or stalemate
            if (game.isInCheck(color)) {
                return -1000 - depth; // Checkmate, prefer faster checkmate
            } else {
                return 0; // Stalemate
            }
        }
        
        let bestScore = -Infinity;
        
        for (const move of legalMoves) {
            // Make the move on a copy of the game
            const gameCopy = this.copyGame(game);
            gameCopy.makeMove(move);
            
            // Evaluate recursively
            const score = -this.minimax(gameCopy, depth - 1, -beta, -alpha, color === 'white' ? 'black' : 'white');
            
            bestScore = Math.max(bestScore, score);
            alpha = Math.max(alpha, score);
            
            if (alpha >= beta) {
                break; // Beta cutoff
            }
        }
        
        return bestScore;
    }
    
    /**
     * Check if the game is over
     * @param {Object} game - The game state
     * @returns {boolean} - Whether the game is over
     */
    isGameOver(game) {
        const gameState = game.getGameState();
        return gameState.isCheckmate || gameState.isStalemate || 
               gameState.isDrawByRepetition || gameState.isDrawByInsufficientMaterial || 
               gameState.isDrawByFiftyMoveRule;
    }
    
    /**
     * Evaluate a chess position
     * @param {Object} game - The game state
     * @param {string} color - The color to evaluate for
     * @returns {number} - The evaluation score
     */
    evaluatePosition(game, color) {
        const board = game.board;
        let score = 0;
        
        // Material count
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece) {
                    const pieceValue = this.pieceValues[piece.type];
                    if (piece.color === color) {
                        score += pieceValue;
                        
                        // Add position bonus
                        score += this.getPositionBonus(piece, row, col, color);
                    } else {
                        score -= pieceValue;
                        
                        // Subtract position bonus for opponent
                        score -= this.getPositionBonus(piece, row, col, piece.color);
                    }
                }
            }
        }
        
        // Mobility (number of legal moves)
        const myMoves = this.getAllLegalMoves(color, game).length;
        const opponentMoves = this.getAllLegalMoves(color === 'white' ? 'black' : 'white', game).length;
        score += 0.1 * (myMoves - opponentMoves);
        
        // Check and checkmate
        if (game.isInCheck(color === 'white' ? 'black' : 'white')) {
            score += 0.5; // Small bonus for giving check
            
            if (opponentMoves === 0) {
                score += 100; // Big bonus for checkmate
            }
        }
        
        if (game.isInCheck(color)) {
            score -= 0.5; // Small penalty for being in check
            
            if (myMoves === 0) {
                score -= 100; // Big penalty for being checkmated
            }
        }
        
        return score;
    }
    
    /**
     * Get a position bonus for a piece
     * @param {Object} piece - The piece
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {number} - The position bonus
     */
    getPositionBonus(piece, row, col, color) {
        // Simple position bonuses
        let bonus = 0;
        
        // Adjust row for color perspective
        const adjustedRow = color === 'white' ? row : 7 - row;
        
        switch (piece.type) {
            case 'pawn':
                // Pawns are more valuable as they advance
                bonus += 0.05 * (7 - adjustedRow);
                
                // Promote center pawns early
                if ((col === 3 || col === 4) && adjustedRow > 4) {
                    bonus += 0.1;
                }
                
                // Penalize doubled pawns
                let doubledPawns = 0;
                for (let r = 0; r < 8; r++) {
                    if (r !== row && board[r][col] && 
                        board[r][col].type === 'pawn' && board[r][col].color === color) {
                        doubledPawns++;
                    }
                }
                bonus -= 0.2 * doubledPawns;
                break;
                
            case 'knight':
                // Knights are better in the center
                bonus += 0.05 * (4 - Math.abs(col - 3.5) - Math.abs(adjustedRow - 3.5));
                
                // Knights are best with support points and close to the enemy
                if (adjustedRow < 4) {
                    bonus += 0.1;
                }
                break;
                
            case 'bishop':
                // Bishops control more squares when they have open diagonals
                let openDiagonals = 0;
                
                // Count open diagonals
                const directions = [
                    { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
                    { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
                ];
                
                for (const dir of directions) {
                    let r = row + dir.dr;
                    let c = col + dir.dc;
                    while (r >= 0 && r < 8 && c >= 0 && c < 8 && !board[r][c]) {
                        openDiagonals++;
                        r += dir.dr;
                        c += dir.dc;
                    }
                }
                
                bonus += 0.02 * openDiagonals;
                
                // Bishops are better in open positions
                if (openDiagonals > 6) {
                    bonus += 0.2;
                }
                break;
                
            case 'rook':
                // Rooks on open files
                let openFile = true;
                for (let r = 0; r < 8; r++) {
                    if (r !== row && board[r][col] && board[r][col].type === 'pawn') {
                        openFile = false;
                        break;
                    }
                }
                
                if (openFile) {
                    bonus += 0.3;
                }
                
                // Rooks on 7th rank (2nd rank for black)
                if (adjustedRow === 1) {
                    bonus += 0.3;
                }
                break;
                
            case 'queen':
                // Queen development penalty in early game
                if (this.isEarlyGame(board) && (adjustedRow > 5 || 
                    (col > 2 && col < 5 && adjustedRow > 4))) {
                    bonus -= 0.3;
                }
                
                // Queens on 7th rank
                if (adjustedRow === 1) {
                    bonus += 0.2;
                }
                break;
                
            case 'king':
                // King safety in early/middle game
                if (!this.isEndGame(board)) {
                    // Encourage castling and king safety
                    if (color === 'white') {
                        if (row === 7 && (col === 1 || col === 6)) {
                            bonus += 0.5; // Castled
                        } else if (row === 7 && col === 4) {
                            bonus -= 0.3; // Not castled yet
                        } else {
                            bonus -= 0.5; // Exposed king
                        }
                    } else {
                        if (row === 0 && (col === 1 || col === 6)) {
                            bonus += 0.5; // Castled
                        } else if (row === 0 && col === 4) {
                            bonus -= 0.3; // Not castled yet
                        } else {
                            bonus -= 0.5; // Exposed king
                        }
                    }
                } else {
                    // In endgame, king should be active
                    bonus += 0.05 * (4 - Math.abs(col - 3.5) - Math.abs(adjustedRow - 3.5));
                }
                break;
        }
        
        return bonus;
    }
    
    /**
     * Check if the position is in the early game
     * @param {Array} board - The chess board
     * @returns {boolean} - Whether it's early game
     */
    isEarlyGame(board) {
        let developedPieces = 0;
        
        // Count developed pieces
        for (let col = 0; col < 8; col++) {
            const whitePiece = board[7][col];
            const blackPiece = board[0][col];
            
            if ((col === 1 || col === 6) && (!whitePiece || whitePiece.type !== 'knight')) {
                developedPieces++;
            }
            
            if ((col === 2 || col === 5) && (!whitePiece || whitePiece.type !== 'bishop')) {
                developedPieces++;
            }
            
            if ((col === 1 || col === 6) && (!blackPiece || blackPiece.type !== 'knight')) {
                developedPieces++;
            }
            
            if ((col === 2 || col === 5) && (!blackPiece || blackPiece.type !== 'bishop')) {
                developedPieces++;
            }
        }
        
        return developedPieces < 4;
    }
    
    /**
     * Check if the position is in the end game
     * @param {Array} board - The chess board
     * @returns {boolean} - Whether it's end game
     */
    isEndGame(board) {
        let pieceCount = 0;
        let hasQueens = false;
        
        // Count pieces and check for queens
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type !== 'king' && piece.type !== 'pawn') {
                    pieceCount++;
                    if (piece.type === 'queen') {
                        hasQueens = true;
                    }
                }
            }
        }
        
        return (pieceCount <= 6) || (pieceCount <= 10 && !hasQueens);
    }
    
    /**
     * Get all legal moves for a color
     * @param {string} color - The color to find moves for
     * @param {Object} game - Optional game state to use
     * @returns {Array} - Array of legal moves
     */
    getAllLegalMoves(color, game = this.chessGame) {
        const legalMoves = [];
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = game.getPieceAt(row, col);
                if (piece && piece.color === color) {
                    const pieceMoves = game.getLegalMovesForPiece(row, col);
                    
                    for (const move of pieceMoves) {
                        legalMoves.push({
                            fromRow: row,
                            fromCol: col,
                            toRow: move.row,
                            toCol: move.col
                        });
                    }
                }
            }
        }
        
        return legalMoves;
    }
    
    /**
     * Create a copy of the current game
     * @param {Object} game - Optional game to copy
     * @returns {Object} - A copy of the game
     */
    copyGame(game = this.chessGame) {
        // This is a simplified version
        // In a real implementation, we would need to deep copy the game state
        const gameCopy = new ChessGame();
        
        gameCopy.loadPosition(game.getPosition());
        gameCopy.setMoveHistory([...game.getMoveHistory()]);
        
        return gameCopy;
    }
    
    /**
     * Set the search depth
     * @param {number} depth - The search depth
     */
    setMaxDepth(depth) {
        this.maxDepth = depth;
    }
}
