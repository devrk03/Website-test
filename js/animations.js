/**
 * Class for handling chess piece animations
 */
class ChessAnimator {
    constructor(chessboard) {
        this.chessboard = chessboard;
        this.animationSpeed = 1.0; // Default speed multiplier
    }
    
    /**
     * Animate a piece movement
     * @param {Object} move - The move to animate
     * @param {string} moveType - The type of move
     * @param {Function} callback - Function to call after animation completes
     */
    animateMove(move, moveType, callback) {
        const { fromRow, fromCol, toRow, toCol } = move;
        
        const fromVisualRow = this.chessboard.getVisualRow(fromRow);
        const fromVisualCol = this.chessboard.getVisualCol(fromCol);
        const toVisualRow = this.chessboard.getVisualRow(toRow);
        const toVisualCol = this.chessboard.getVisualCol(toCol);
        
        const fromSquare = this.chessboard.getSquare(fromVisualRow, fromVisualCol);
        const toSquare = this.chessboard.getSquare(toVisualRow, toVisualCol);
        
        const pieceElement = fromSquare.querySelector('.piece');
        if (!pieceElement) {
            callback();
            return;
        }
        
        // Calculate distance for animation
        const squareSize = fromSquare.offsetWidth;
        const moveX = (toVisualCol - fromVisualCol) * squareSize;
        const moveY = (toVisualRow - fromVisualRow) * squareSize;
        
        // Set CSS variables for the animation
        pieceElement.style.setProperty('--move-x', `${moveX}px`);
        pieceElement.style.setProperty('--move-y', `${moveY}px`);
        
        // Adjust animation duration based on speed setting
        const duration = 300 / this.animationSpeed; // Base duration is 300ms
        pieceElement.style.transition = `transform ${duration}ms ease`;
        
        // Apply special animation classes based on move type
        if (moveType === 'castling') {
            pieceElement.classList.add('castle-animation');
            
            // Also animate the rook
            const rookCol = move.side === 'kingside' ? 7 : 0;
            const newRookCol = move.side === 'kingside' ? 5 : 3;
            
            const rookFromVisualCol = this.chessboard.getVisualCol(rookCol);
            const rookToVisualCol = this.chessboard.getVisualCol(newRookCol);
            const rookSquare = this.chessboard.getSquare(toVisualRow, rookFromVisualCol);
            const rookPiece = rookSquare.querySelector('.piece');
            
            if (rookPiece) {
                const rookMoveX = (rookToVisualCol - rookFromVisualCol) * squareSize;
                rookPiece.style.setProperty('--move-x', `${rookMoveX}px`);
                rookPiece.style.setProperty('--move-y', '0px');
                rookPiece.classList.add('castle-animation');
                rookPiece.style.transform = 'translate(var(--move-x), var(--move-y))';
            }
        } else if (moveType === 'capture') {
            // Add capture animation to the target piece if there is one
            const targetPiece = toSquare.querySelector('.piece');
            if (targetPiece) {
                targetPiece.classList.add('capture-animation');
            }
        }
        
        // Start the animation
        pieceElement.style.transform = 'translate(var(--move-x), var(--move-y))';
        
        // After animation completes
        setTimeout(() => {
            callback();
        }, duration);
    }
    
    /**
     * Set the animation speed
     * @param {number} speed - The animation speed multiplier
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = speed;
    }
    
    /**
     * Animate a pawn promotion
     * @param {Element} pieceElement - The piece element
     * @param {string} newType - The new piece type
     * @param {string} color - The piece color
     */
    animatePromotion(pieceElement, newType, color) {
        // Add fade out animation
        pieceElement.style.opacity = '0';
        pieceElement.style.transform = 'scale(0.5)';
        
        setTimeout(() => {
            // Change the piece image
            pieceElement.style.backgroundImage = `url(/Pieces/${newType}-${color.charAt(0)}.svg)`;
            
            // Add fade in animation
            pieceElement.classList.add('promotion-animation');
            pieceElement.style.opacity = '1';
            pieceElement.style.transform = 'scale(1)';
        }, 300);
    }
    
    /**
     * Animate a check
     * @param {Object} kingPos - The king's position
     */
    animateCheck(kingPos) {
        const visualRow = this.chessboard.getVisualRow(kingPos.row);
        const visualCol = this.chessboard.getVisualCol(kingPos.col);
        
        const square = this.chessboard.getSquare(visualRow, visualCol);
        square.style.animation = 'checkAnimation 1s ease-in-out';
        
        // Remove the animation after it completes
        setTimeout(() => {
            square.style.animation = '';
        }, 1000);
    }
}
