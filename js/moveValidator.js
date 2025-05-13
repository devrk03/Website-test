/**
 * Class for validating chess moves
 */
class MoveValidator {
    /**
     * Check if a move is valid according to chess rules
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @param {Object} gameState - The current game state
     * @returns {Object} - Result of the validation
     */
    static validateMove(move, board, gameState) {
        const { fromRow, fromCol, toRow, toCol } = move;
        const piece = board[fromRow][fromCol];
        
        // Basic validations
        if (!piece) {
            return { valid: false, error: 'No piece at the starting position' };
        }
        
        if (piece.color !== gameState.currentPlayer) {
            return { valid: false, error: 'Not your turn' };
        }
        
        if (fromRow === toRow && fromCol === toCol) {
            return { valid: false, error: 'Cannot move to the same position' };
        }
        
        // Check if destination contains own piece
        const targetPiece = board[toRow][toCol];
        if (targetPiece && targetPiece.color === piece.color) {
            return { valid: false, error: 'Cannot capture your own piece' };
        }
        
        // Validate based on piece type
        let moveValid = false;
        let moveType = 'normal';
        
        switch (piece.type) {
            case 'pawn':
                const pawnResult = this.validatePawnMove(move, board, gameState);
                moveValid = pawnResult.valid;
                moveType = pawnResult.type;
                if (!moveValid) {
                    return { valid: false, error: pawnResult.error };
                }
                break;
                
            case 'rook':
                moveValid = this.validateRookMove(move, board);
                break;
                
            case 'knight':
                moveValid = this.validateKnightMove(move, board);
                break;
                
            case 'bishop':
                moveValid = this.validateBishopMove(move, board);
                break;
                
            case 'queen':
                moveValid = this.validateQueenMove(move, board);
                break;
                
            case 'king':
                const kingResult = this.validateKingMove(move, board, gameState);
                moveValid = kingResult.valid;
                moveType = kingResult.type;
                if (!moveValid) {
                    return { valid: false, error: kingResult.error };
                }
                break;
        }
        
        if (!moveValid) {
            return { valid: false, error: 'Invalid move for this piece' };
        }
        
        // Check if the move would leave the king in check
        if (!this.isMoveLegal(move, board, gameState)) {
            return { valid: false, error: 'Move would leave your king in check' };
        }
        
        return { 
            valid: true, 
            type: moveType,
            capturePiece: targetPiece,
            isPromotion: piece.type === 'pawn' && (toRow === 0 || toRow === 7)
        };
    }
    
    /**
     * Validate a pawn move
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @param {Object} gameState - The current game state
     * @returns {Object} - Result of the validation
     */
    static validatePawnMove(move, board, gameState) {
        const { fromRow, fromCol, toRow, toCol } = move;
        const piece = board[fromRow][fromCol];
        const direction = piece.color === 'white' ? -1 : 1;
        const startingRow = piece.color === 'white' ? 6 : 1;
        
        // Check for forward moves
        if (fromCol === toCol) {
            // Single square forward
            if (toRow === fromRow + direction) {
                if (!board[toRow][toCol]) {
                    return { valid: true, type: 'normal' };
                }
            }
            // Double square forward from starting position
            else if (toRow === fromRow + 2 * direction && fromRow === startingRow) {
                if (!board[fromRow + direction][fromCol] && !board[toRow][toCol]) {
                    return { valid: true, type: 'double' };
                }
            }
        }
        // Check for diagonal captures
        else if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction) {
            const targetPiece = board[toRow][toCol];
            
            // Normal capture
            if (targetPiece && targetPiece.color !== piece.color) {
                return { valid: true, type: 'capture' };
            }
            // En passant
            else if (!targetPiece && gameState.enPassantTarget &&
                     gameState.enPassantTarget.row === toRow &&
                     gameState.enPassantTarget.col === toCol) {
                return { valid: true, type: 'enPassant' };
            }
        }
        
        return { valid: false, error: 'Invalid pawn move' };
    }
    
    /**
     * Validate a rook move
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @returns {boolean} - Whether the move is valid
     */
    static validateRookMove(move, board) {
        const { fromRow, fromCol, toRow, toCol } = move;
        
        // Rook moves horizontally or vertically
        if (fromRow !== toRow && fromCol !== toCol) {
            return false;
        }
        
        // Check for pieces in the path
        if (fromRow === toRow) {
            // Horizontal move
            const start = Math.min(fromCol, toCol);
            const end = Math.max(fromCol, toCol);
            
            for (let col = start + 1; col < end; col++) {
                if (board[fromRow][col]) {
                    return false;
                }
            }
        } else {
            // Vertical move
            const start = Math.min(fromRow, toRow);
            const end = Math.max(fromRow, toRow);
            
            for (let row = start + 1; row < end; row++) {
                if (board[row][fromCol]) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Validate a knight move
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @returns {boolean} - Whether the move is valid
     */
    static validateKnightMove(move, board) {
        const { fromRow, fromCol, toRow, toCol } = move;
        
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // Knight moves in an L-shape: 2 squares in one direction and 1 in the other
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
    }
    
    /**
     * Validate a bishop move
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @returns {boolean} - Whether the move is valid
     */
    static validateBishopMove(move, board) {
        const { fromRow, fromCol, toRow, toCol } = move;
        
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // Bishop moves diagonally
        if (rowDiff !== colDiff) {
            return false;
        }
        
        // Check for pieces in the path
        const rowDir = toRow > fromRow ? 1 : -1;
        const colDir = toCol > fromCol ? 1 : -1;
        
        for (let i = 1; i < rowDiff; i++) {
            if (board[fromRow + i * rowDir][fromCol + i * colDir]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Validate a queen move
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @returns {boolean} - Whether the move is valid
     */
    static validateQueenMove(move, board) {
        // Queen can move like a rook or a bishop
        return this.validateRookMove(move, board) || this.validateBishopMove(move, board);
    }
    
    /**
     * Validate a king move
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @param {Object} gameState - The current game state
     * @returns {Object} - Result of the validation
     */
    static validateKingMove(move, board, gameState) {
        const { fromRow, fromCol, toRow, toCol } = move;
        
        const rowDiff = Math.abs(toRow - fromRow);
        const colDiff = Math.abs(toCol - fromCol);
        
        // Normal king move - one square in any direction
        if (rowDiff <= 1 && colDiff <= 1) {
            return { valid: true, type: 'normal' };
        }
        
        // Check for castling
        const color = board[fromRow][fromCol].color;
        const backRank = color === 'white' ? 7 : 0;
        
        if (fromRow === backRank && fromCol === 4 && toRow === backRank && 
            (toCol === 6 || toCol === 2)) {
            
            // King must not be in check
            if (this.isInCheck(board, color, gameState)) {
                return { valid: false, error: 'Cannot castle while in check' };
            }
            
            const castlingRights = gameState.castlingRights[color];
            
            // Kingside castling
            if (toCol === 6 && castlingRights.kingSide) {
                // Check for pieces between king and rook
                if (board[backRank][5] || board[backRank][6]) {
                    return { valid: false, error: 'Cannot castle through pieces' };
                }
                
                // Check if the king passes through check
                if (this.isSquareAttacked(board, backRank, 5, color, gameState)) {
                    return { valid: false, error: 'Cannot castle through check' };
                }
                
                return { valid: true, type: 'castling', side: 'kingside' };
            }
            
            // Queenside castling
            if (toCol === 2 && castlingRights.queenSide) {
                // Check for pieces between king and rook
                if (board[backRank][1] || board[backRank][2] || board[backRank][3]) {
                    return { valid: false, error: 'Cannot castle through pieces' };
                }
                
                // Check if the king passes through check
                if (this.isSquareAttacked(board, backRank, 3, color, gameState)) {
                    return { valid: false, error: 'Cannot castle through check' };
                }
                
                return { valid: true, type: 'castling', side: 'queenside' };
            }
        }
        
        return { valid: false, error: 'Invalid king move' };
    }
    
    /**
     * Check if a move is legal (doesn't leave the king in check)
     * @param {Object} move - The move to validate
     * @param {Array} board - The chess board
     * @param {Object} gameState - The current game state
     * @returns {boolean} - Whether the move is legal
     */
    static isMoveLegal(move, board, gameState) {
        const { fromRow, fromCol, toRow, toCol } = move;
        const piece = board[fromRow][fromCol];
        
        // Make a deep copy of the board for testing
        const tempBoard = JSON.parse(JSON.stringify(board));
        const tempGameState = JSON.parse(JSON.stringify(gameState));
        
        // Simulate the move
        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = null;
        
        // Update king position if moving the king
        if (piece.type === 'king') {
            tempGameState.kingPositions[piece.color] = { row: toRow, col: toCol };
        }
        
        // Check if the king would be in check after the move
        return !this.isInCheck(tempBoard, piece.color, tempGameState);
    }
    
    /**
     * Check if a player is in check
     * @param {Array} board - The chess board
     * @param {string} color - The player's color
     * @param {Object} gameState - The current game state
     * @returns {boolean} - Whether the player is in check
     */
    static isInCheck(board, color, gameState) {
        const kingPos = gameState.kingPositions[color];
        return this.isSquareAttacked(board, kingPos.row, kingPos.col, color, gameState);
    }
    
    /**
     * Check if a square is under attack
     * @param {Array} board - The chess board
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The color of the piece on the square
     * @param {Object} gameState - The current game state
     * @returns {boolean} - Whether the square is attacked
     */
    static isSquareAttacked(board, row, col, color, gameState) {
        // Check for attacks from each piece type
        return this.isAttackedByPawn(board, row, col, color) ||
               this.isAttackedByKnight(board, row, col, color) ||
               this.isAttackedByKing(board, row, col, color) ||
               this.isAttackedByRookOrQueen(board, row, col, color) ||
               this.isAttackedByBishopOrQueen(board, row, col, color);
    }
    
    /**
     * Check if a square is attacked by a pawn
     * @param {Array} board - The chess board
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The color of the piece on the square
     * @returns {boolean} - Whether the square is attacked by a pawn
     */
    static isAttackedByPawn(board, row, col, color) {
        const direction = color === 'white' ? 1 : -1;
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Check the two diagonal squares where an opponent pawn could attack from
        for (const colOffset of [-1, 1]) {
            const attackRow = row + direction;
            const attackCol = col + colOffset;
            
            if (attackRow >= 0 && attackRow < 8 && attackCol >= 0 && attackCol < 8) {
                const piece = board[attackRow][attackCol];
                if (piece && piece.type === 'pawn' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if a square is attacked by a knight
     * @param {Array} board - The chess board
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The color of the piece on the square
     * @returns {boolean} - Whether the square is attacked by a knight
     */
    static isAttackedByKnight(board, row, col, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        const knightMoves = [
            { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
            { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
            { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
            { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
        ];
        
        for (const move of knightMoves) {
            const attackRow = row + move.dr;
            const attackCol = col + move.dc;
            
            if (attackRow >= 0 && attackRow < 8 && attackCol >= 0 && attackCol < 8) {
                const piece = board[attackRow][attackCol];
                if (piece && piece.type === 'knight' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if a square is attacked by a king
     * @param {Array} board - The chess board
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The color of the piece on the square
     * @returns {boolean} - Whether the square is attacked by a king
     */
    static isAttackedByKing(board, row, col, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        const kingMoves = [
            { dr: -1, dc: -1 }, { dr: -1, dc: 0 }, { dr: -1, dc: 1 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
            { dr: 1, dc: -1 }, { dr: 1, dc: 0 }, { dr: 1, dc: 1 }
        ];
        
        for (const move of kingMoves) {
            const attackRow = row + move.dr;
            const attackCol = col + move.dc;
            
            if (attackRow >= 0 && attackRow < 8 && attackCol >= 0 && attackCol < 8) {
                const piece = board[attackRow][attackCol];
                if (piece && piece.type === 'king' && piece.color === opponentColor) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if a square is attacked by a rook or queen
     * @param {Array} board - The chess board
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @param {string} color - The color of the piece on the square
     * @returns {boolean} - Whether the square is attacked by a rook or queen
     */
    static isAttackedByRookOrQueen(board, row, col, color) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        const directions = [
            { dr: -1, dc: 0 }, // Up
            { dr: 1, dc: 0 },  // Down
            { dr: 0, dc: -1 }, // Left
            { dr: 0, dc: 1 }   // Right
        ];
        
        for (const dir of directions) {
            let attackRow = row + dir.dr;
            let attackCol = col + dir.dc;
            
            while (attackRow >= 0 && attackRow < 8 && attackCol >= 0 && attackCol < 8) {
                const piece = board[attackRow][attackCol];
                
                if (piece) {
                    if (piece.color === opponentColor && 
                        (piece.type === 'rook' || piece.type === 'queen')) {
                        return true;
                    }
                    // Stop at any piece
                    break;
