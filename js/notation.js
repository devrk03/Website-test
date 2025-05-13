/**
 * Class for handling chess notation
 */
class NotationManager {
    constructor() {
        this.fileNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        this.pieceSymbols = {
            king: 'K',
            queen: 'Q',
            rook: 'R',
            bishop: 'B',
            knight: 'N',
            pawn: ''
        };
    }
    
    /**
     * Format a move in algebraic notation
     * @param {Object} move - The move to format
     * @returns {string} - The formatted move
     */
    formatMove(move) {
        if (!move) return '';
        
        const piece = move.piece;
        const fromSquare = this.squareToAlgebraic(move.fromRow, move.fromCol);
        const toSquare = this.squareToAlgebraic(move.toRow, move.toCol);
        
        // Handle castling
        if (move.castlingSide) {
            return move.castlingSide === 'kingside' ? 'O-O' : 'O-O-O';
        }
        
        let notation = '';
        
        // Add piece symbol (except for pawns)
        if (piece.type !== 'pawn') {
            notation += this.pieceSymbols[piece.type];
        }
        
        // Add the starting square for pawns only when capturing
        if (piece.type === 'pawn' && move.capturedPiece) {
            notation += this.fileNames[move.fromCol];
        }
        
        // Add capture symbol
        if (move.capturedPiece || move.enPassant) {
            notation += 'x';
        }
        
        // Add destination square
        notation += toSquare;
        
        // Add promotion piece
        if (move.isPromotion && move.promotedTo) {
            notation += '=' + this.pieceSymbols[move.promotedTo];
        }
        
        // Add check/checkmate symbol
        if (move.isCheckmate) {
            notation += '#';
        } else if (move.isCheck) {
            notation += '+';
        }
        
        return notation;
    }
    
    /**
     * Convert a square's row and column to algebraic notation
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @returns {string} - The square in algebraic notation
     */
    squareToAlgebraic(row, col) {
        return this.fileNames[col] + (8 - row);
    }
    
    /**
     * Convert algebraic notation to row and column
     * @param {string} square - The square in algebraic notation
     * @returns {Object} - The row and column
     */
    algebraicToSquare(square) {
        if (square.length !== 2) {
            return null;
        }
        
        const file = square.charAt(0).toLowerCase();
        const rank = parseInt(square.charAt(1));
        
        if (!this.fileNames.includes(file) || rank < 1 || rank > 8) {
            return null;
        }
        
        const col = this.fileNames.indexOf(file);
        const row = 8 - rank;
        
        return { row, col };
    }
    
    /**
     * Parse a move in algebraic notation
     * @param {string} notation - The move in algebraic notation
     * @param {Object} gameState - The current game state
     * @returns {Object} - The parsed move
     */
    parseNotation(notation, gameState) {
        // This is a complex function to implement fully
        // For a complete chess app, this would need to be expanded
        // to handle all algebraic notation parsing
        
        // Handle castling
        if (notation === 'O-O' || notation === '0-0') {
            const row = gameState.currentPlayer === 'white' ? 7 : 0;
            return { fromRow: row, fromCol: 4, toRow: row, toCol: 6 };
        }
        
        if (notation === 'O-O-O' || notation === '0-0-0') {
            const row = gameState.currentPlayer === 'white' ? 7 : 0;
            return { fromRow: row, fromCol: 4, toRow: row, toCol: 2 };
        }
        
        // Handle basic moves like "e4" or "Nf3"
        // For simplicity, this implementation is partial
        let piece = 'pawn';
        let targetSquare = notation;
        
        // Check if the first character is a piece symbol
        if (/[KQRBN]/.test(notation.charAt(0))) {
            const pieceChar = notation.charAt(0);
            for (const [key, value] of Object.entries(this.pieceSymbols)) {
                if (value === pieceChar) {
                    piece = key;
                    break;
                }
            }
            targetSquare = notation.substring(1);
        }
        
        // Extract destination square
        const regex = /[a-h][1-8]/;
        const match = targetSquare.match(regex);
        
        if (!match) {
            return null;
        }
        
        const destination = this.algebraicToSquare(match[0]);
        
        // For a simple implementation, just find a piece of the right type that can move there
        // In a full implementation, we would need to handle disambiguation
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const candidatePiece = gameState.board[row][col];
                if (candidatePiece && 
                    candidatePiece.type === piece && 
                    candidatePiece.color === gameState.currentPlayer) {
                    
                    const move = { 
                        fromRow: row, 
                        fromCol: col, 
                        toRow: destination.row, 
                        toCol: destination.col 
                    };
                    
                    // Check if the move is legal
                    if (MoveValidator.validateMove(move, gameState.board, gameState).valid) {
                        return move;
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * Generate FEN notation for a position
     * @param {Array} board - The chess board
     * @param {Object} gameState - The current game state
     * @returns {string} - The FEN notation
     */
    generateFEN(board, gameState) {
        let fen = '';
        
        // Board position
        for (let row = 0; row < 8; row++) {
            let emptyCount = 0;
            
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                
                if (piece) {
                    if (emptyCount > 0) {
                        fen += emptyCount;
                        emptyCount = 0;
                    }
                    
                    let pieceChar = this.pieceSymbols[piece.type];
                    
                    // Handle pawn (no symbol in algebraic, but 'P' in FEN)
                    if (piece.type === 'pawn') {
                        pieceChar = 'P';
                    }
                    
                    // Handle case
                    if (piece.color === 'black') {
                        pieceChar = pieceChar.toLowerCase();
                    }
                    
                    fen += pieceChar;
                } else {
                    emptyCount++;
                }
            }
            
            if (emptyCount > 0) {
                fen += emptyCount;
            }
            
            if (row < 7) {
                fen += '/';
            }
        }
        
        // Active color
        fen += ' ' + (gameState.currentPlayer === 'white' ? 'w' : 'b');
        
        // Castling rights
        let castling = '';
        if (gameState.castlingRights.white.kingSide) castling += 'K';
        if (gameState.castlingRights.white.queenSide) castling += 'Q';
        if (gameState.castlingRights.black.kingSide) castling += 'k';
        if (gameState.castlingRights.black.queenSide) castling += 'q';
        fen += ' ' + (castling || '-');
        
        // En passant target
        if (gameState.enPassantTarget) {
            fen += ' ' + this.squareToAlgebraic(gameState.enPassantTarget.row, gameState.enPassantTarget.col);
        } else {
            fen += ' -';
        }
        
        // Halfmove clock and fullmove number
        fen += ' ' + gameState.halfMoveClock;
        fen += ' ' + gameState.fullMoveNumber;
        
        return fen;
    }
    
    /**
     * Parse FEN notation and set up a board
     * @param {string} fen - The FEN notation
     * @returns {Object} - The board and game state
     */
    parseFEN(fen) {
        const parts = fen.split(' ');
        if (parts.length !== 6) {
            return null;
        }
        
        const [position, activeColor, castling, enPassant, halfMove, fullMove] = parts;
        
        // Initialize board
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const rows = position.split('/');
        
        if (rows.length !== 8) {
            return null;
        }
        
        // Set up pieces
        for (let row = 0; row < 8; row++) {
            let col = 0;
            for (let i = 0; i < rows[row].length; i++) {
                const char = rows[row].charAt(i);
                
                if (/[1-8]/.test(char)) {
                    col += parseInt(char);
                } else {
                    const color = char === char.toUpperCase() ? 'white' : 'black';
                    let type;
                    
                    switch (char.toUpperCase()) {
                        case 'K': type = 'king'; break;
                        case 'Q': type = 'queen'; break;
                        case 'R': type = 'rook'; break;
                        case 'B': type = 'bishop'; break;
                        case 'N': type = 'knight'; break;
                        case 'P': type = 'pawn'; break;
                    }
                    
                    board[row][col] = { type, color, hasMoved: false };
                    col++;
                }
            }
        }
        
        // Set up game state
        const gameState = {
            currentPlayer: activeColor === 'w' ? 'white' : 'black',
            castlingRights: {
                white: { kingSide: castling.includes('K'), queenSide: castling.includes('Q') },
                black: { kingSide: castling.includes('k'), queenSide: castling.includes('q') }
            },
            enPassantTarget: enPassant !== '-' ? this.algebraicToSquare(enPassant) : null,
            halfMoveClock: parseInt(halfMove),
            fullMoveNumber: parseInt(fullMove),
            kingPositions: { white: null, black: null }
        };
        
        // Find kings
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board[row][col];
                if (piece && piece.type === 'king') {
                    gameState.kingPositions[piece.color] = { row, col };
                }
            }
        }
        
        return { board, gameState };
    }
}
