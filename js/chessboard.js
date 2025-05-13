/**
 * Chessboard UI class - handles the visual representation and user interactions
 */
class Chessboard {
    constructor(boardElement, chessGame) {
        this.boardElement = boardElement;
        this.chessGame = chessGame;
        this.isFlipped = false;
        this.showLegalMoves = true;
        this.selectedSquare = null;
        this.legalMoveSquares = [];
        this.lastMoveHighlight = { from: null, to: null };
        this.checkHighlight = null;
        this.draggedPiece = null;
        this.hintSquare = null;
        
        // Callbacks for board interactions
        this.onSquareClick = null;
        this.onPieceDragStart = null;
        this.onPieceDragMove = null;
        this.onPieceDragEnd = null;
        
        this.initBoard();
    }
    
    /**
     * Initialize the chessboard
     */
    initBoard() {
        this.boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = 'square';
                square.classList.add((row + col) % 2 === 0 ? 'square-light' : 'square-dark');
                square.dataset.row = row;
                square.dataset.col = col;
                
                this.setupSquareEvents(square);
                
                this.boardElement.appendChild(square);
            }
        }
    }
    
    /**
     * Set up event listeners for a square
     * @param {Element} square - The square element
     */
    setupSquareEvents(square) {
        // Click event
        square.addEventListener('click', (e) => {
            if (this.onSquareClick) {
                const row = parseInt(square.dataset.row);
                const col = parseInt(square.dataset.col);
                this.onSquareClick(this.getAdjustedRow(row), this.getAdjustedCol(col));
            }
        });
        
        // Mouse down for drag start
        square.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button
            
            const pieceElement = square.querySelector('.piece');
            if (!pieceElement) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            
            if (this.onPieceDragStart && this.onPieceDragStart(this.getAdjustedRow(row), this.getAdjustedCol(col))) {
                this.draggedPiece = {
                    element: pieceElement,
                    startX: e.clientX,
                    startY: e.clientY,
                    offsetX: 0,
                    offsetY: 0,
                    row: row,
                    col: col
                };
                
                pieceElement.classList.add('dragging');
                
                // Prevent default to avoid text selection
                e.preventDefault();
            }
        });
        
        // Touch start for mobile drag
        square.addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) return;
            
            const pieceElement = square.querySelector('.piece');
            if (!pieceElement) return;
            
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const touch = e.touches[0];
            
            if (this.onPieceDragStart && this.onPieceDragStart(this.getAdjustedRow(row), this.getAdjustedCol(col))) {
                this.draggedPiece = {
                    element: pieceElement,
                    startX: touch.clientX,
                    startY: touch.clientY,
                    offsetX: 0,
                    offsetY: 0,
                    row: row,
                    col: col
                };
                
                pieceElement.classList.add('dragging');
                
                // Prevent default to avoid scrolling
                e.preventDefault();
            }
        });
    }
    
    /**
     * Set up global event listeners for dragging
     */
    setupDragEvents() {
        // Mouse move for drag
        document.addEventListener('mousemove', (e) => {
            if (!this.draggedPiece) return;
            
            this.draggedPiece.offsetX = e.clientX - this.draggedPiece.startX;
            this.draggedPiece.offsetY = e.clientY - this.draggedPiece.startY;
            
            this.updateDraggedPiecePosition();
            
            if (this.onPieceDragMove) {
                this.onPieceDragMove(e.clientX, e.clientY);
            }
        });
        
        // Mouse up for drag end
        document.addEventListener('mouseup', (e) => {
            if (!this.draggedPiece) return;
            
            const targetElement = document.elementFromPoint(e.clientX, e.clientY);
            this.handleDragEnd(targetElement);
        });
        
        // Touch move for mobile drag
        document.addEventListener('touchmove', (e) => {
            if (!this.draggedPiece || e.touches.length !== 1) return;
            
            const touch = e.touches[0];
            this.draggedPiece.offsetX = touch.clientX - this.draggedPiece.startX;
            this.draggedPiece.offsetY = touch.clientY - this.draggedPiece.startY;
            
            this.updateDraggedPiecePosition();
            
            if (this.onPieceDragMove) {
                this.onPieceDragMove(touch.clientX, touch.clientY);
            }
            
            // Prevent default to avoid scrolling
            e.preventDefault();
        });
        
        // Touch end for mobile drag end
        document.addEventListener('touchend', (e) => {
            if (!this.draggedPiece) return;
            
            const touch = e.changedTouches[0];
            const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
            this.handleDragEnd(targetElement);
            
            // Prevent default to avoid unwanted clicks
            e.preventDefault();
        });
    }
    
    /**
     * Update the position of a dragged piece
     */
    updateDraggedPiecePosition() {
        if (!this.draggedPiece) return;
        
        this.draggedPiece.element.style.transform = 
            `translate(${this.draggedPiece.offsetX}px, ${this.draggedPiece.offsetY}px)`;
    }
    
    /**
     * Handle the end of a drag operation
     * @param {Element} targetElement - The element under the cursor
     */
    handleDragEnd(targetElement) {
        if (!this.draggedPiece) return;
        
        // Find the square under the cursor
        let targetSquare = targetElement;
        while (targetSquare && !targetSquare.classList.contains('square')) {
            targetSquare = targetSquare.parentElement;
        }
        
        if (targetSquare) {
            const targetRow = parseInt(targetSquare.dataset.row);
            const targetCol = parseInt(targetSquare.dataset.col);
            
            if (this.onPieceDragEnd) {
                this.onPieceDragEnd(
                    this.getAdjustedRow(targetRow),
                    this.getAdjustedCol(targetCol)
                );
            }
        }
        
        // Reset the dragged piece
        this.draggedPiece.element.style.transform = '';
        this.draggedPiece.element.classList.remove('dragging');
        this.draggedPiece = null;
    }
    
    /**
     * Render the chessboard with the current game state
     */
    render() {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const adjustedRow = this.getAdjustedRow(row);
                const adjustedCol = this.getAdjustedCol(col);
                const piece = this.chessGame.getPieceAt(adjustedRow, adjustedCol);
                
                const square = this.getSquare(row, col);
                
                // Clear the square
                const existingPiece = square.querySelector('.piece');
                if (existingPiece) {
                    square.removeChild(existingPiece);
                }
                
                // Add the piece if there is one
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = 'piece';
                    pieceElement.style.backgroundImage = `url(/Pieces/${piece.type}-${piece.color.charAt(0)}.svg)`;
                    
                    // Add a shadow for depth
                    const shadowElement = document.createElement('div');
                    shadowElement.className = 'piece-shadow';
                    square.appendChild(shadowElement);
                    
                    square.appendChild(pieceElement);
                }
            }
        }
        
        // Restore highlights
        this.updateHighlights();
    }
    
    /**
     * Get a square element by row and column
     * @param {number} row - The row index
     * @param {number} col - The column index
     * @returns {Element} - The square element
     */
    getSquare(row, col) {
        return this.boardElement.children[row * 8 + col];
    }
    
    /**
     * Get the adjusted row based on board orientation
     * @param {number} row - The visual row
     * @returns {number} - The logical row
     */
    getAdjustedRow(row) {
        return this.isFlipped ? 7 - row : row;
    }
    
    /**
     * Get the adjusted column based on board orientation
     * @param {number} col - The visual column
     * @returns {number} - The logical column
     */
    getAdjustedCol(col) {
        return this.isFlipped ? 7 - col : col;
    }
    
    /**
     * Get the visual row from a logical row
     * @param {number} row - The logical row
     * @returns {number} - The visual row
     */
    getVisualRow(row) {
        return this.isFlipped ? 7 - row : row;
    }
    
    /**
     * Get the visual column from a logical column
     * @param {number} col - The logical column
     * @returns {number} - The visual column
     */
    getVisualCol(col) {
        return this.isFlipped ? 7 - col : col;
    }
    
    /**
     * Select a square on the board
     * @param {number} row - The logical row
     * @param {number} col - The logical column
     */
    selectSquare(row, col) {
        this.deselectSquare();
        
        const visualRow = this.getVisualRow(row);
        const visualCol = this.getVisualCol(col);
        
        const square = this.getSquare(visualRow, visualCol);
        square.classList.add('square-selected');
        
        this.selectedSquare = { row: visualRow, col: visualCol };
    }
    
    /**
     * Deselect the currently selected square
     */
    deselectSquare() {
        if (this.selectedSquare) {
            const { row, col } = this.selectedSquare;
            const square = this.getSquare(row, col);
            square.classList.remove('square-selected');
            this.selectedSquare = null;
        }
    }
    
    /**
     * Show legal moves for a selected piece
     * @param {Array} moves - Array of legal moves
     */
    showLegalMoves(moves) {
        this.hideLegalMoves();
        
        for (const move of moves) {
            const visualRow = this.getVisualRow(move.row);
            const visualCol = this.getVisualCol(move.col);
            
            const square = this.getSquare(visualRow, visualCol);
            
            if (move.type === 'capture' || 
                (square.querySelector('.piece') && move.type !== 'castling')) {
                square.classList.add('possible-capture');
            } else {
                square.classList.add('possible-move');
            }
            
            this.legalMoveSquares.push({ row: visualRow, col: visualCol });
        }
    }
    
    /**
     * Hide the legal moves indicators
     */
    hideLegalMoves() {
        for (const { row, col } of this.legalMoveSquares) {
            const square = this.getSquare(row, col);
            square.classList.remove('possible-move', 'possible-capture');
        }
        
        this.legalMoveSquares = [];
    }
    
    /**
     * Highlight the last move made
     * @param {number} fromRow - The starting logical row
     * @param {number} fromCol - The starting logical column
     * @param {number} toRow - The destination logical row
     * @param {number} toCol - The destination logical column
     */
    highlightLastMove(fromRow, fromCol, toRow, toCol) {
        this.clearLastMoveHighlight();
        
        const fromVisualRow = this.getVisualRow(fromRow);
        const fromVisualCol = this.getVisualCol(fromCol);
        const toVisualRow = this.getVisualRow(toRow);
        const toVisualCol = this.getVisualCol(toCol);
        
        const fromSquare = this.getSquare(fromVisualRow, fromVisualCol);
        const toSquare = this.getSquare(toVisualRow, toVisualCol);
        
        fromSquare.classList.add('square-last-move-from');
        toSquare.classList.add('square-last-move-to');
        
        this.lastMoveHighlight = {
            from: { row: fromVisualRow, col: fromVisualCol },
            to: { row: toVisualRow, col: toVisualCol }
        };
    }
    
    /**
     * Clear the last move highlight
     */
    clearLastMoveHighlight() {
        if (this.lastMoveHighlight.from) {
            const fromSquare = this.getSquare(
                this.lastMoveHighlight.from.row,
                this.lastMoveHighlight.from.col
            );
            fromSquare.classList.remove('square-last-move-from');
        }
        
        if (this.lastMoveHighlight.to) {
            const toSquare = this.getSquare(
                this.lastMoveHighlight.to.row,
                this.lastMoveHighlight.to.col
            );
            toSquare.classList.remove('square-last-move-to');
        }
        
        this.lastMoveHighlight = { from: null, to: null };
    }
    
    /**
     * Highlight the king in check
     * @param {Object} kingPos - The king's position
     */
    highlightCheck(kingPos) {
        this.clearCheckHighlight();
        
        const visualRow = this.getVisualRow(kingPos.row);
        const visualCol = this.getVisualCol(kingPos.col);
        
        const square = this.getSquare(visualRow, visualCol);
        square.classList.add('check');
        
        this.checkHighlight = { row: visualRow, col: visualCol };
    }
    
    /**
     * Clear the check highlight
     */
    clearCheckHighlight() {
        if (this.checkHighlight) {
            const square = this.getSquare(this.checkHighlight.row, this.checkHighlight.col);
            square.classList.remove('check');
            this.checkHighlight = null;
        }
    }
    
    /**
     * Show a hint for a suggested move
     * @param {Object} move - The suggested move
     */
    showHint(move) {
        this.clearHint();
        
        const fromVisualRow = this.getVisualRow(move.fromRow);
        const fromVisualCol = this.getVisualCol(move.fromCol);
        const toVisualRow = this.getVisualRow(move.toRow);
        const toVisualCol = this.getVisualCol(move.toCol);
        
        const fromSquare = this.getSquare(fromVisualRow, fromVisualCol);
        const toSquare = this.getSquare(toVisualRow, toVisualCol);
        
        fromSquare.style.animation = 'highlightSquare 2s ease-in-out';
        toSquare.style.animation = 'highlightSquare 2s ease-in-out 0.5s';
        
        this.hintSquare = {
            from: { row: fromVisualRow, col: fromVisualCol },
            to: { row: toVisualRow, col: toVisualCol }
        };
        
        // Clear the hint after animation finishes
        setTimeout(() => {
            this.clearHint();
        }, 3000);
    }
    
    /**
     * Clear the move hint
     */
    clearHint() {
        if (this.hintSquare) {
            const fromSquare = this.getSquare(this.hintSquare.from.row, this.hintSquare.from.col);
            const toSquare = this.getSquare(this.hintSquare.to.row, this.hintSquare.to.col);
            
            fromSquare.style.animation = '';
            toSquare.style.animation = '';
            
            this.hintSquare = null;
        }
    }
    
    /**
     * Update all the highlights on the board
     */
    updateHighlights() {
        // Reapply last move highlight
        if (this.lastMoveHighlight.from && this.lastMoveHighlight.to) {
            const fromSquare = this.getSquare(
                this.lastMoveHighlight.from.row,
                this.lastMoveHighlight.from.col
            );
            const toSquare = this.getSquare(
                this.lastMoveHighlight.to.row,
                this.lastMoveHighlight.to.col
            );
            
            fromSquare.classList.add('square-last-move-from');
            toSquare.classList.add('square-last-move-to');
        }
        
        // Reapply check highlight
        if (this.checkHighlight) {
            const square = this.getSquare(this.checkHighlight.row, this.checkHighlight.col);
            square.classList.add('check');
        }
        
        // Reapply selected square
        if (this.selectedSquare) {
            const square = this.getSquare(this.selectedSquare.row, this.selectedSquare.col);
            square.classList.add('square-selected');
        }
        
        // Reapply legal moves
        for (const { row, col } of this.legalMoveSquares) {
            const square = this.getSquare(row, col);
            const hasPiece = square.querySelector('.piece');
            
            if (hasPiece) {
                square.classList.add('possible-capture');
            } else {
                square.classList.add('possible-move');
            }
        }
    }
    
    /**
     * Set whether the board is flipped
     * @param {boolean} flipped - Whether the board is flipped
     */
    setFlipped(flipped) {
        this.isFlipped = flipped;
    }
    
    /**
     * Set whether to show legal moves
     * @param {boolean} show - Whether to show legal moves
     */
    setShowLegalMoves(show) {
        this.showLegalMoves = show;
        
        if (!show) {
            this.hideLegalMoves();
        }
    }
}
