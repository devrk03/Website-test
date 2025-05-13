/**
 * Chess game logic class - handles the rules of chess
 */
class ChessGame {
    constructor() {
        this.board = [];
        this.moveHistory = [];
        this.capturedPieces = [];
        this.currentPlayer = 'white';
        this.kings = { 
            white: { row: 7, col: 4 },
            black: { row: 0, col: 4 }
        };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.positionHistory = [];
        
        this.resetGame();
    }
    
    /**
     * Reset the game to the initial position
     */
    resetGame() {
        // Initialize empty board
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set up pawns
        for (let col = 0; col < 8; col++) {
            this.board[1][col] = { type: 'pawn', color: 'black', hasMoved: false };
            this.board[6][col] = { type: 'pawn', color: 'white', hasMoved: false };
        }
        
        // Set up other pieces
        this.setRooksQueensKings();
        this.setKnightsBishops();
        
        // Reset game state
        this.moveHistory = [];
        this.capturedPieces = [];
        this.currentPlayer = 'white';
        this.kings = { 
            white: { row: 7, col: 4 },
            black: { row: 0, col: 4 }
        };
        this.castlingRights = {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        };
        this.enPassantTarget = null;
        this.halfMoveClock = 0;
        this.fullMoveNumber = 1;
        this.positionHistory = [this.getPositionHash()];
    }
    
    /**
     * Set up rooks, queens, and kings on the board
     */
    setRooksQueensKings() {
        // Rooks
        this.board[0][0] = { type: 'rook', color: 'black', hasMoved: false };
        this.board[0][7] = { type: 'rook', color: 'black', hasMoved: false };
        this.board[7][0] = { type: 'rook', color: 'white', hasMoved: false };
        this.board[7][7] = { type: 'rook', color: 'white', hasMoved: false };
        
        // Queens
        this.board[0][3] = { type: 'queen', color: 'black', hasMoved: false };
        this.board[7][3] = { type: 'queen', color: 'white', hasMoved: false };
        
        // Kings
        this.board[0][4] = { type: 'king', color: 'black', hasMoved: false };
        this.board[7][4] = { type: 'king', color: 'white', hasMoved: false };
    }
    
    /**
     * Set up knights and bishops on the board
     */
    setKnightsBishops() {
        // Knights
        this.board[0][1] = { type: 'knight', color: 'black', hasMoved: false };
        this.board[0][6] = { type: 'knight', color: 'black', hasMoved: false };
        this.board[7][1] = { type: 'knight', color: 'white', hasMoved: false };
        this.board[7][6] = { type: 'knight', color: 'white', hasMoved: false };
        
        // Bishops
        this.board[0][2] = { type: 'bishop', color: 'black', hasMoved: false };
        this.board[0][5] = { type: 'bishop', color: 'black', hasMoved: false };
        this.board[7][2] = { type: 'bishop', color: 'white', hasMoved: false };
        this.board[7][5] = { type: 'bishop', color: 'white', hasMoved: false };
    }
    
    /**
     * Get the piece at a specific position
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @returns {Object|null} - The piece or null if the square is empty
     */
    getPieceAt(row, col) {
        if (row < 0 || row > 7 || col < 0 || col > 7) {
            return null;
        }
        return this.board[row][col];
    }
    
    /**
     * Get all legal moves for a piece at a specific position
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @returns {Array} - Array of legal moves
     */
    getLegalMovesForPiece(row, col) {
        const piece = this.getPieceAt(row, col);
        if (!piece) return [];
        
        const pseudoLegalMoves = this.getPseudoLegalMoves(row, col);
        const legalMoves = [];
        
        // Filter out moves that would leave the king in check
        for (const move of pseudoLegalMoves) {
            if (this.isMoveLegal(row, col, move.row, move.col)) {
                legalMoves.push(move);
            }
        }
        
        return legalMoves;
    }
    
    /**
     * Check if a move is legal (doesn't leave the king in check)
     * @param {number} fromRow - The starting row
     * @param {number} fromCol - The starting column
     * @param {number} toRow - The destination row
     * @param {number} toCol - The destination column
     * @returns {boolean} - Whether the move is legal
     */
    isMoveLegal(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPieceAt(fromRow, fromCol);
        if (!piece) return false;
        
        // Make a deep copy of the board for testing
        const tempBoard = JSON.parse(JSON.stringify(this.board));
        const tempKings = JSON.parse(JSON.stringify(this.kings));
        
        // Simulate the move
        const capturedPiece = tempBoard[toRow][toCol];
        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = null;
        
        // Update king position if moving the king
        if (piece.type === 'king') {
            tempKings[piece.color] = { row: toRow, col: toCol };
        }
        
        // Check if the king would be in check after the move
        const kingPos = tempKings[piece.color];
        const isInCheck = this.isSquareAttacked(kingPos.row, kingPos.col, piece.color, tempBoard);
        
        return !isInCheck;
    }
    
    /**
     * Get pseudo-legal moves for a piece (moves that follow piece rules but might leave king in check)
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @returns {Array} - Array of pseudo-legal moves
     */
    getPseudoLegalMoves(row, col) {
        const piece = this.getPieceAt(row, col);
        if (!piece) return [];
        
        switch (piece.type) {
            case 'pawn':
                return this.getPawnMoves(row, col, piece.color);
            case 'rook':
                return this.getRookMoves(row, col, piece.color);
            case 'knight':
                return this.getKnightMoves(row, col, piece.color);
            case 'bishop':
                return this.getBishopMoves(row, col, piece.color);
            case 'queen':
                return this.getQueenMoves(row, col, piece.color);
            case 'king':
                return this.getKingMoves(row, col, piece.color);
            default:
                return [];
        }
    }
    
    /**
     * Get possible pawn moves
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible moves
     */
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startingRow = color === 'white' ? 6 : 1;
        
        // Forward move
        if (!this.getPieceAt(row + direction, col)) {
            moves.push({ row: row + direction, col: col, type: 'normal' });
            
            // Double move from starting position
            if (row === startingRow && !this.getPieceAt(row + 2 * direction, col)) {
                moves.push({ row: row + 2 * direction, col: col, type: 'double' });
            }
        }
        
        // Captures
        for (const captureCol of [col - 1, col + 1]) {
            if (captureCol >= 0 && captureCol <= 7) {
                const targetPiece = this.getPieceAt(row + direction, captureCol);
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: row + direction, col: captureCol, type: 'capture' });
                }
                
                // En passant
                if (this.enPassantTarget && 
                    this.enPassantTarget.row === row + direction && 
                    this.enPassantTarget.col === captureCol) {
                    moves.push({ row: row + direction, col: captureCol, type: 'enPassant' });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get possible rook moves
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible moves
     */
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const targetPiece = this.getPieceAt(r, c);
                
                if (!targetPiece) {
                    moves.push({ row: r, col: c, type: 'normal' });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: r, col: c, type: 'capture' });
                    }
                    break;
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }
    
    /**
     * Get possible knight moves
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible moves
     */
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        
        for (const move of knightMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const targetPiece = this.getPieceAt(r, c);
                
                if (!targetPiece) {
                    moves.push({ row: r, col: c, type: 'normal' });
                } else if (targetPiece.color !== color) {
                    moves.push({ row: r, col: c, type: 'capture' });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Get possible bishop moves
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible moves
     */
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [
            { dr: -1, dc: -1 }, // Up-left
            { dr: -1, dc: 1 },  // Up-right
            { dr: 1, dc: -1 },  // Down-left
            { dr: 1, dc: 1 }    // Down-right
        ];
        
        for (const dir of directions) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const targetPiece = this.getPieceAt(r, c);
                
                if (!targetPiece) {
                    moves.push({ row: r, col: c, type: 'normal' });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: r, col: c, type: 'capture' });
                    }
                    break;
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return moves;
    }
    
    /**
     * Get possible queen moves
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible moves
     */
    getQueenMoves(row, col, color) {
        // Queen combines rook and bishop moves
        return [
            ...this.getRookMoves(row, col, color),
            ...this.getBishopMoves(row, col, color)
        ];
    }
    
    /**
     * Get possible king moves
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible moves
     */
    getKingMoves(row, col, color) {
        const moves = [];
        const kingMoves = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];
        
        // Regular king moves
        for (const move of kingMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const targetPiece = this.getPieceAt(r, c);
                
                if (!targetPiece) {
                    // Make sure the king isn't moving into check
                    if (!this.isSquareAttacked(r, c, color)) {
                        moves.push({ row: r, col: c, type: 'normal' });
                    }
                } else if (targetPiece.color !== color) {
                    // Check if the capture would leave the king in check
                    if (!this.isSquareAttacked(r, c, color)) {
                        moves.push({ row: r, col: c, type: 'capture' });
                    }
                }
            }
        }
        
        // Castling
        const castlingMoves = this.getCastlingMoves(row, col, color);
        moves.push(...castlingMoves);
        
        return moves;
    }
    
    /**
     * Get possible castling moves for the king
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The piece color
     * @returns {Array} - Array of possible castling moves
     */
    getCastlingMoves(row, col, color) {
        const moves = [];
        const backRank = color === 'white' ? 7 : 0;
        
        // Check if king is in the correct position and hasn't moved
        if (row !== backRank || col !== 4 || this.board[row][col].hasMoved) {
            return moves;
        }
        
        // Check if king is in check
        if (this.isInCheck(color)) {
            return moves;
        }
        
        // Kingside castling
        if (this.castlingRights[color].kingSide) {
            const rookPiece = this.getPieceAt(row, 7);
            const isPathClear = !this.getPieceAt(row, 5) && !this.getPieceAt(row, 6);
            
            if (rookPiece && rookPiece.type === 'rook' && 
                rookPiece.color === color && !rookPiece.hasMoved && 
                isPathClear) {
                
                // Check if squares between king and rook are attacked
                const isSquare5Attacked = this.isSquareAttacked(row, 5, color);
                const isSquare6Attacked = this.isSquareAttacked(row, 6, color);
                
                if (!isSquare5Attacked && !isSquare6Attacked) {
                    moves.push({ row: row, col: 6, type: 'castling', side: 'kingside' });
                }
            }
        }
        
        // Queenside castling
        if (this.castlingRights[color].queenSide) {
            const rookPiece = this.getPieceAt(row, 0);
            const isPathClear = !this.getPieceAt(row, 1) && 
                               !this.getPieceAt(row, 2) && 
                               !this.getPieceAt(row, 3);
            
            if (rookPiece && rookPiece.type === 'rook' && 
                rookPiece.color === color && !rookPiece.hasMoved && 
                isPathClear) {
                
                // Check if squares between king and rook are attacked
                const isSquare2Attacked = this.isSquareAttacked(row, 2, color);
                const isSquare3Attacked = this.isSquareAttacked(row, 3, color);
                
                if (!isSquare2Attacked && !isSquare3Attacked) {
                    moves.push({ row: row, col: 2, type: 'castling', side: 'queenside' });
                }
            }
        }
        
        return moves;
    }
    
    /**
     * Check if a square is under attack
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The color of the piece on the square
     * @param {Array} board - Optional board to check (for testing)
     * @returns {boolean} - Whether the square is attacked
     */
    isSquareAttacked(row, col, color, board = this.board) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Check for pawn attacks
        const pawnDirection = color === 'white' ? 1 : -1;
        if (row + pawnDirection >= 0 && row + pawnDirection <= 7) {
            if (col - 1 >= 0) {
                const piece = board[row + pawnDirection][col - 1];
                if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                    return true;
                }
            }
            if (col + 1 <= 7) {
                const piece = board[row + pawnDirection][col + 1];
                if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        // Check for knight attacks
        const knightMoves = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        
        for (const move of knightMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const piece = board[r][c];
                if (piece && piece.type === 'knight' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        // Check for king attacks (for adjacent squares)
        const kingMoves = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];
        
        for (const move of kingMoves) {
            const r = row + move.dr;
            const c = col + move.dc;
            
            if (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const piece = board[r][c];
                if (piece && piece.type === 'king' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        // Check for rook/queen attacks (horizontal and vertical)
        const rookDirections = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];
        
        for (const dir of rookDirections) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const piece = board[r][c];
                
                if (piece) {
                    if (piece.color === opponentColor && 
                        (piece.type === 'rook' || piece.type === 'queen')) {
                        return true;
                    }
                    break;
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        // Check for bishop/queen attacks (diagonal)
        const bishopDirections = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
        ];
        
        for (const dir of bishopDirections) {
            let r = row + dir.dr;
            let c = col + dir.dc;
            
            while (r >= 0 && r <= 7 && c >= 0 && c <= 7) {
                const piece = board[r][c];
                
                if (piece) {
                    if (piece.color === opponentColor && 
                        (piece.type === 'bishop' || piece.type === 'queen')) {
                        return true;
                    }
                    break;
                }
                
                r += dir.dr;
                c += dir.dc;
            }
        }
        
        return false;
    }
    
    /**
     * Make a move on the board
     * @param {Object} move - The move to make
     * @returns {Object} - Result of the move
     */
    makeMove(move) {
        const { fromRow, fromCol, toRow, toCol } = move;
        const piece = this.getPieceAt(fromRow, fromCol);
        
        // Check if the move is valid
        if (!piece) {
            return { valid: false, error: 'No piece at the starting position' };
        }
        
        if (piece.color !== this.currentPlayer) {
            return { valid: false, error: 'Not your turn' };
        }
        
        // Get legal moves for the piece
        const legalMoves = this.getLegalMovesForPiece(fromRow, fromCol);
        const targetMove = legalMoves.find(m => m.row === toRow && m.col === toCol);
        
        if (!targetMove) {
            return { valid: false, error: 'Illegal move' };
        }
        
        // Prepare move result
        const result = {
            valid: true,
            piece: piece,
            capturedPiece: null,
            isPromotion: false,
            isCheck: false,
            isCheckmate: false,
            color: piece.color,
            moveType: targetMove.type
        };
        
        // Save the moved piece and any captured piece
        const targetPiece = this.getPieceAt(toRow, toCol);
        
        // Handle different move types
        if (targetMove.type === 'capture' || 
            (targetPiece && targetPiece.color !== piece.color)) {
            result.capturedPiece = targetPiece;
            this.capturedPieces.push(targetPiece);
        } else if (targetMove.type === 'enPassant') {
            const passantPawnRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            result.capturedPiece = this.getPieceAt(passantPawnRow, toCol);
            this.capturedPieces.push(result.capturedPiece);
            this.board[passantPawnRow][toCol] = null;
        } else if (targetMove.type === 'castling') {
            // Handle castling
            const rookCol = targetMove.side === 'kingside' ? 7 : 0;
            const newRookCol = targetMove.side === 'kingside' ? 5 : 3;
            
            // Move the rook
            this.board[toRow][newRookCol] = this.board[toRow][rookCol];
            this.board[toRow][rookCol] = null;
            
            // Mark the rook as moved
            this.board[toRow][newRookCol].hasMoved = true;
            
            result.moveType = 'castling';
            result.castlingSide = targetMove.side;
        }
        
        // Reset en passant target
        this.enPassantTarget = null;
        
        // Set new en passant target if double pawn move
        if (piece.type === 'pawn' && Math.abs(toRow - fromRow) === 2) {
            const passantRow = piece.color === 'white' ? toRow + 1 : toRow - 1;
            this.enPassantTarget = { row: passantRow, col: toCol };
        }
        
        // Update the board
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // Update king position if king was moved
        if (piece.type === 'king') {
            this.kings[piece.color] = { row: toRow, col: toCol };
            
            // Update castling rights
            this.castlingRights[piece.color].kingSide = false;
            this.castlingRights[piece.color].queenSide = false;
        }
        
        // Update castling rights if rook was moved
        if (piece.type === 'rook') {
            const backRank = piece.color === 'white' ? 7 : 0;
            if (fromRow === backRank) {
                if (fromCol === 0) {
                    this.castlingRights[piece.color].queenSide = false;
                } else if (fromCol === 7) {
                    this.castlingRights[piece.color].kingSide = false;
                }
            }
        }
        
        // Update castling rights if rook was captured
        if (result.capturedPiece && result.capturedPiece.type === 'rook') {
            const backRank = result.capturedPiece.color === 'white' ? 7 : 0;
            if (toRow === backRank) {
                if (toCol === 0) {
                    this.castlingRights[result.capturedPiece.color].queenSide = false;
                } else if (toCol === 7) {
                    this.castlingRights[result.capturedPiece.color].kingSide = false;
                }
            }
        }
        
        // Mark the piece as moved
        this.board[toRow][toCol].hasMoved = true;
        
        // Check for pawn promotion
        if (piece.type === 'pawn' && (toRow === 0 || toRow === 7)) {
            result.isPromotion = true;
            return result; // Wait for the promotion choice
        }
        
        // Update fifty-move rule counter
        if (piece.type === 'pawn' || result.capturedPiece) {
            this.halfMoveClock = 0;
        } else {
            this.halfMoveClock++;
        }
        
        // Switch player
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Check if the opponent is in check
        if (this.isInCheck(this.currentPlayer)) {
            result.isCheck = true;
            
            // Check if it's checkmate
            if (this.isCheckmate(this.currentPlayer)) {
                result.isCheckmate = true;
            }
        }
        
        // Check for stalemate
        if (!result.isCheck && this.isStalemate(this.currentPlayer)) {
            result.isStalemate = true;
        }
        
        // Update move history
        this.moveHistory.push({
            piece: piece,
            fromRow: fromRow,
            fromCol: fromCol,
            toRow: toRow,
            toCol: toCol,
            capturedPiece: result.capturedPiece,
            isCheck: result.isCheck,
            isCheckmate: result.isCheckmate,
            isPromotion: result.isPromotion,
            promotedTo: null,
            castlingSide: result.castlingSide,
            enPassant: targetMove.type === 'enPassant'
        });
        
        // Update full move number
        if (this.currentPlayer === 'white') {
            this.fullMoveNumber++;
        }
        
        // Check for draw by repetition
        this.positionHistory.push(this.getPositionHash());
        result.isDrawByRepetition = this.isDrawByRepetition();
        
        // Check for draw by insufficient material
        result.isDrawByInsufficientMaterial = this.isDrawByInsufficientMaterial();
        
        // Check for draw by fifty-move rule
        result.isDrawByFiftyMoveRule = this.halfMoveClock >= 100; // 50 full moves = 100 half moves
        
        return result;
    }
    
    /**
     * Promote a pawn to another piece
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} pieceType - The type to promote to
     */
    promotePawn(row, col, pieceType) {
        const pawn = this.getPieceAt(row, col);
        if (!pawn || pawn.type !== 'pawn') return;
        
        // Create the new piece
        this.board[row][col] = {
            type: pieceType,
            color: pawn.color,
            hasMoved: true
        };
        
        // Update the last move in the history
        const lastMove = this.moveHistory[this.moveHistory.length - 1];
        if (lastMove && lastMove.isPromotion) {
            lastMove.promotedTo = pieceType;
        }
        
        // Check if the promotion puts the opponent in check
        const opponentColor = pawn.color === 'white' ? 'black' : 'white';
        const kingPos = this.kings[opponentColor];
        
        if (this.isInCheck(opponentColor)) {
            lastMove.isCheck = true;
            
            // Check if it's checkmate
            if (this.isCheckmate(opponentColor)) {
                lastMove.isCheckmate = true;
            }
        }
    }
    
    /**
     * Check if a player is in check
     * @param {string} color - The player's color
     * @returns {boolean} - Whether the player is in check
     */
    isInCheck(color) {
        const kingPos = this.kings[color];
        return this.isSquareAttacked(kingPos.row, kingPos.col, color);
    }
    
    /**
     * Check if a player is in checkmate
     * @param {string} color - The player's color
     * @returns {boolean} - Whether the player is in checkmate
     */
    isCheckmate(color) {
        // If not in check, can't be checkmate
        if (!this.isInCheck(color)) {
            return false;
        }
        
        // If any piece has a legal move, not checkmate
        return this.hasNoLegalMoves(color);
    }
    
    /**
     * Check if a player is in stalemate
     * @param {string} color - The player's color
     * @returns {boolean} - Whether the player is in stalemate
     */
    isStalemate(color) {
        // If in check, not stalemate
        if (this.isInCheck(color)) {
            return false;
        }
        
        // If no legal moves, stalemate
        return this.hasNoLegalMoves(color);
    }
    
    /**
     * Check if a player has no legal moves
     * @param {string} color - The player's color
     * @returns {boolean} - Whether the player has no legal moves
     */
    hasNoLegalMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece && piece.color === color) {
                    const legalMoves = this.getLegalMovesForPiece(row, col);
                    if (legalMoves.length > 0) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    /**
     * Check if the game is a draw by repetition
     * @returns {boolean} - Whether the game is a draw by repetition
     */
    isDrawByRepetition() {
        const currentPosition = this.getPositionHash();
        let count = 0;
        
        for (const position of this.positionHistory) {
            if (position === currentPosition) {
                count++;
            }
        }
        
        return count >= 3;
    }
    
    /**
     * Check if the game is a draw by insufficient material
     * @returns {boolean} - Whether the game is a draw by insufficient material
     */
    isDrawByInsufficientMaterial() {
        const pieces = [];
        
        // Collect all pieces on the board
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece) {
                    pieces.push(piece);
                }
            }
        }
        
        // King vs King
        if (pieces.length === 2) {
            return true;
        }
        
        // King and Bishop vs King or King and Knight vs King
        if (pieces.length === 3) {
            const nonKings = pieces.filter(piece => piece.type !== 'king');
            return nonKings.length === 1 && 
                   (nonKings[0].type === 'bishop' || nonKings[0].type === 'knight');
        }
        
        // King and 2 Knights vs King
        if (pieces.length === 4) {
            const whiteNonKings = pieces.filter(piece => piece.type !== 'king' && piece.color === 'white');
            const blackNonKings = pieces.filter(piece => piece.type !== 'king' && piece.color === 'black');
            
            if (whiteNonKings.length === 2 && blackNonKings.length === 0) {
                return whiteNonKings.every(piece => piece.type === 'knight');
            }
            
            if (blackNonKings.length === 2 && whiteNonKings.length === 0) {
                return blackNonKings.every(piece => piece.type === 'knight');
            }
        }
        
        return false;
    }
    
    /**
     * Get a unique hash for the current position
     * @returns {string} - A hash of the position
     */
    getPositionHash() {
        let hash = '';
        
        // Add board position
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece) {
                    hash += piece.type[0] + piece.color[0];
                } else {
                    hash += '-';
                }
            }
        }
        
        // Add castling rights
        hash += this.castlingRights.white.kingSide ? 'K' : '-';
        hash += this.castlingRights.white.queenSide ? 'Q' : '-';
        hash += this.castlingRights.black.kingSide ? 'k' : '-';
        hash += this.castlingRights.black.queenSide ? 'q' : '-';
        
        // Add en passant target
        if (this.enPassantTarget) {
            hash += `e${this.enPassantTarget.row}${this.enPassantTarget.col}`;
        } else {
            hash += '-';
        }
        
        // Add current player
        hash += this.currentPlayer[0];
        
        return hash;
    }
    
    /**
     * Undo the last move
     */
    undoLastMove() {
        if (this.moveHistory.length === 0) {
            return;
        }
        
        const lastMove = this.moveHistory.pop();
        
        // Restore the piece to its original position
        this.board[lastMove.fromRow][lastMove.fromCol] = lastMove.piece;
        
        // For en passant, the captured pawn is not at the destination
        if (lastMove.enPassant) {
            const capturedPawnRow = lastMove.piece.color === 'white' ? lastMove.toRow + 1 : lastMove.toRow - 1;
            this.board[capturedPawnRow][lastMove.toCol] = lastMove.capturedPiece;
            this.board[lastMove.toRow][lastMove.toCol] = null;
        } else if (lastMove.capturedPiece) {
            // Restore captured piece
            this.board[lastMove.toRow][lastMove.toCol] = lastMove.capturedPiece;
        } else if (lastMove.castlingSide) {
            // Undo castling
            const backRank = lastMove.piece.color === 'white' ? 7 : 0;
            const rookFromCol = lastMove.castlingSide === 'kingside' ? 5 : 3;
            const rookToCol = lastMove.castlingSide === 'kingside' ? 7 : 0;
            
            // Move the rook back
            this.board[backRank][rookToCol] = this.board[backRank][rookFromCol];
            this.board[backRank][rookFromCol] = null;
            
            // Reset hasMovedProperty
            this.board[backRank][rookToCol].hasMoved = false;
            this.board[lastMove.toRow][lastMove.toCol] = null;
        } else {
            // Clear the destination square
            this.board[lastMove.toRow][lastMove.toCol] = null;
        }
        
        // Restore king position if king was moved
        if (lastMove.piece.type === 'king') {
            this.kings[lastMove.piece.color] = { row: lastMove.fromRow, col: lastMove.fromCol };
        }
        
        // Restore piece's move status
        this.board[lastMove.fromRow][lastMove.fromCol].hasMoved = false;
        
        // Remove captured piece from captured list if there was one
        if (lastMove.capturedPiece) {
            const index = this.capturedPieces.findIndex(p => 
                p.type === lastMove.capturedPiece.type && p.color === lastMove.capturedPiece.color);
            if (index !== -1) {
                this.capturedPieces.splice(index, 1);
            }
        }
        
        // Restore current player
        this.currentPlayer = lastMove.piece.color;
        
        // Restore position history
        this.positionHistory.pop();
        
        // TODO: Restore en passant target, castling rights, half move clock, etc.
        // These would need to be saved in the move history to be fully restored
    }
    
    /**
     * Get the king position for a player
     * @param {string} color - The player's color
     * @returns {Object} - The king's position
     */
    getKingPosition(color) {
        return this.kings[color];
    }
    
    /**
     * Get the current game state
     * @returns {Object} - The game state
     */
    getGameState() {
        return {
            currentPlayer: this.currentPlayer,
            isCheck: this.isInCheck(this.currentPlayer),
            isCheckmate: this.isCheckmate(this.currentPlayer),
            isStalemate: this.isStalemate(this.currentPlayer),
            isDrawByRepetition: this.isDrawByRepetition(),
            isDrawByInsufficientMaterial: this.isDrawByInsufficientMaterial(),
            isDrawByFiftyMoveRule: this.halfMoveClock >= 100
        };
    }
    
    /**
     * Get the move history
     * @returns {Array} - The move history
     */
    getMoveHistory() {
        return this.moveHistory;
    }
    
    /**
     * Get the captured pieces
     * @returns {Array} - The captured pieces
     */
    getCapturedPieces() {
        return this.capturedPieces;
    }
    
    /**
     * Get the last move made
     * @returns {Object|null} - The last move or null if no moves
     */
    getLastMove() {
        if (this.moveHistory.length === 0) {
            return null;
        }
        return this.moveHistory[this.moveHistory.length - 1];
    }
    
    /**
     * Get the current board position
     * @returns {Array} - The current board
     */
    getPosition() {
        return JSON.parse(JSON.stringify(this.board));
    }
    
    /**
     * Load a board position
     * @param {Array} position - The position to load
     */
    loadPosition(position) {
        this.board = JSON.parse(JSON.stringify(position));
        
        // Find kings
        this.kings = { white: null, black: null };
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPieceAt(row, col);
                if (piece && piece.type === 'king') {
                    this.kings[piece.color] = { row, col };
                }
            }
        }
    }
    
    /**
     * Set the move history
     * @param {Array} history - The move history to set
     */
    setMoveHistory(history) {
        this.moveHistory = JSON.parse(JSON.stringify(history));
    }
    
    /**
     * Replay the game to a specific move
     * @param {number} moveIndex - The move index to replay to
     */
    replayToMove(moveIndex) {
        // Save the current state
        const savedHistory = [...this.moveHistory];
        
        // Reset the game
        this.resetGame();
        
        // Replay moves up to the specified index
        for (let i = 0; i <= moveIndex && i < savedHistory.length; i++) {
            const move = savedHistory[i];
            
            // Make the move
            this.makeMove({
                fromRow: move.fromRow,
                fromCol: move.fromCol,
                toRow: move.toRow,
                toCol: move.toCol
            });
            
            // Handle promotion if needed
            if (move.isPromotion && move.promotedTo) {
                this.promotePawn(move.toRow, move.toCol, move.promotedTo);
            }
        }
        
        // Update current player based on the last move made
        if (moveIndex >= 0 && moveIndex < savedHistory.length) {
            // If we're stopping at a particular move, the current player should be the opposite
            this.currentPlayer = savedHistory[moveIndex].piece.color === 'white' ? 'black' : 'white';
        } else {
            // If we're at the start, white goes first
            this.currentPlayer = 'white';
        }
    }
    
    /**
     * Replay the game to the latest move
     */
    replayToLatestMove() {
        this.replayToMove(this.moveHistory.length - 1);
    }
}
