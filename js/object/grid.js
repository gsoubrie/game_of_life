"use strict";

class Grid {
    
    constructor ( cols, rows ) {
        this.cols = cols;
        this.rows = rows;
        
        this.cells      = new Uint8Array( cols * rows );
        this.next_cells = new Uint8Array( cols * rows );
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
            this.cells[ i ] = Math.random() < 0.50 ? 1 : 0;
        }
    }
    
    clear () {
        this.cells.fill( 0 );
    }
    
    countNeighborsAlive ( col, row ) {
        let to_return = 0;
        
        for ( let delta_row = -1; delta_row<2; delta_row++ ) {
            const current_row = row + delta_row;
            if( current_row > this.rows || current_row < 0 ){
                continue;
            }
            for ( let delta_col = -1; delta_col < 2; delta_col++ ) {
                const current_col = col + delta_col;
                if( current_col > this.cols || current_col < 0 ){
                    continue;
                }                
                if ( current_col === col && current_row === row ) {
                    continue; 
                }
                
                to_return += this.cells[ this.index( current_col, current_row ) ];
            }
        }
        
        return to_return;
    }
    compute_next_value (row, col) {
        const is_alive  = this.cells[ this.index( col, row ) ];
        const number_neightbour = this.countNeighborsAlive( col, row );
        
        if ( is_alive && (number_neightbour === 2 || number_neightbour === 3)  ){
            return 1;
        }
        
        return to_return;
    }
    compute_next_value (row, col) {
        const is_alive  = this.cells[ this.index( col, row ) ];
        const number_neightbour = this.countNeighborsAlive( col, row );
        
        if ( is_alive && (number_neightbour === 2 || number_neightbour === 3)  ){
            return 1;
        }
        
        if (!is_alive && number_neightbour === 3 ){
            return 1;
        }
        return 0;
    }
    step () {
        for ( let row = 0; row < this.rows; row++ ) {
            for ( let col = 0; col < this.cols; col++ ) {                
                this.next_cells[ this.index( col, row ) ] = this.compute_next_value(row, col);
            }
        }        
        [this.cells, this.next_cells] = [this.next_cells, this.cells];
    }
}