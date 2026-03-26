"use strict";

class Grid {
    
    /**
     * @param {number} cols  - number of columns
     * @param {number} rows  - number of rows
     */
    constructor ( cols, rows ) {
        this.cols = cols;
        this.rows = rows;
        
        this.cells      = new Uint8Array( cols * rows );
        this.next_cells = new Uint8Array( cols * rows ); // buffer for next gen
    }
    
    /* ── helpers ── */
    
    /** Convert (col, row) into a flat array index */
    index ( col, row ) {
        return row * this.cols + col;
    }
    
    /** Is this (col, row) inside the grid? */
    isInside ( col, row ) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }
    
    /** Get the value of a cell (0 or 1) */
    getCell ( col, row ) {
        return this.cells[ this.index( col, row ) ];
    }
    
    /** Set the value of a cell (0 or 1) */
    setCell ( col, row, value ) {
        if ( this.isInside( col, row ) ) {
            this.cells[ this.index( col, row ) ] = value;
        }
    }
    
    /** Count all alive cells */
    countAlive () {
        let count = 0;
        for ( let i = 0; i < this.cells.length; i++ ) {
            if ( this.cells[ i ] ) {
                count++;
            }
        }
        return count;
    }
    
    /** Fill the grid randomly (~30% alive) */
    randomize () {
        for ( let i = 0; i < this.cells.length; i++ ) {
            this.cells[ i ] = Math.random() < 0.30 ? 1 : 0;
        }
    }
    
    /** Kill every cell */
    clear () {
        this.cells.fill( 0 );
    }
    
    /* ── simulation ── */
    
    /**
     * Count how many of the 8 neighbours of (col, row) are alive.
     * The grid wraps around (toroidal topology).
     */
    countNeighbors ( col, row ) {
        let count = 0;
        
        for ( let dr = -1; dr <= 1; dr++ ) {
            for ( let dc = -1; dc <= 1; dc++ ) {
                
                // skip the cell itself
                if ( dr === 0 && dc === 0 ) {
                    continue;
                }
                
                // wrap around borders using modulo
                const neighbor_row = (row + dr + this.rows) % this.rows;
                const neighbor_col = (col + dc + this.cols) % this.cols;
                
                count += this.cells[ this.index( neighbor_col, neighbor_row ) ];
            }
        }
        
        return count;
    }
    
    /**
     * Apply Conway's rules and advance to the next generation.
     *
     * Rules:
     *  - A live cell with 2 or 3 neighbours survives.
     *  - A dead cell with exactly 3 neighbours becomes alive.
     *  - Everything else dies or stays dead.
     */
    step () {
        for ( let row = 0; row < this.rows; row++ ) {
            for ( let col = 0; col < this.cols; col++ ) {
                
                const is_alive  = this.cells[ this.index( col, row ) ];
                const neighbors = this.countNeighbors( col, row );
                
                let next_value = 0;
                
                if ( is_alive ) {
                    // survival: 2 or 3 neighbours
                    next_value = (neighbors === 2 || neighbors === 3) ? 1 : 0;
                }
                else {
                    // birth: exactly 3 neighbours
                    next_value = (neighbors === 3) ? 1 : 0;
                }
                
                this.next_cells[ this.index( col, row ) ] = next_value;
            }
        }
        
        // swap buffers (no memory allocation needed)
        [this.cells, this.next_cells] = [this.next_cells, this.cells];
    }
}