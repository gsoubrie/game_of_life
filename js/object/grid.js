"use strict";

class Grid {
    
    constructor ( cols, rows ) {
        this.cols = cols;
        this.rows = rows;
        
        this.cells      = new Uint8Array( cols * rows );
        this.next_cells = new Uint8Array( cols * rows ); // buffer for next gen
    }
    
    index ( col, row ) {
        return row * this.cols + col;
    }
    
    isInside ( col, row ) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }
    
    getCell ( col, row ) {
        return this.cells[ this.index( col, row ) ];
    }
    
    setCell ( col, row, value ) {
        if ( this.isInside( col, row ) ) {
            this.cells[ this.index( col, row ) ] = value;
        }
    }
    
    countAlive () {
        let count = 0;
        for ( let i = 0; i < this.cells.length; i++ ) {
            if ( this.cells[ i ] ) {
                count++;
            }
        }
        return count;
    }
    
    randomize () {
        for ( let i = 0; i < this.cells.length; i++ ) {
            this.cells[ i ] = Math.random() < 0.30 ? 1 : 0;
        }
    }
    
    clear () {
        this.cells.fill( 0 );
    }
    
    countNeighbors ( col, row ) {
        let count = 0;
        
        for ( let dr = -1; dr <= 1; dr++ ) {
            for ( let dc = -1; dc <= 1; dc++ ) {
                
                if ( dr === 0 && dc === 0 ) {
                    continue;
                }
                
                const neighbor_row = (row + dr + this.rows) % this.rows;
                const neighbor_col = (col + dc + this.cols) % this.cols;
                
                count += this.cells[ this.index( neighbor_col, neighbor_row ) ];
            }
        }
        
        return count;
    }
    
    step () {
        for ( let row = 0; row < this.rows; row++ ) {
            for ( let col = 0; col < this.cols; col++ ) {
                
                const is_alive  = this.cells[ this.index( col, row ) ];
                const neighbors = this.countNeighbors( col, row );
                
                let next_value = 0;
                
                if ( is_alive ) {
                    next_value = (neighbors === 2 || neighbors === 3) ? 1 : 0;
                }
                else {
                    next_value = (neighbors === 3) ? 1 : 0;
                }
                
                this.next_cells[ this.index( col, row ) ] = next_value;
            }
        }
        
        [this.cells, this.next_cells] = [this.next_cells, this.cells];
    }
}