"use strict";

class Viewport {
    
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {HTMLElement}       wrapper  - the parent div
     */
    constructor ( canvas, wrapper ) {
        this.canvas  = canvas;
        this.wrapper = wrapper;
        this.context = canvas.getContext( '2d' );
        
        this.zoom     = 1.0;
        this.min_zoom = 0.2;
        this.max_zoom = 8.0;
        
        this.offset_x = 0;
        this.offset_y = 0;
        
        this.cell_size = 14;
    }
    
    getCellPixels () {
        return this.cell_size * this.zoom;
    }
    
    resize () {
        this.canvas.width  = this.wrapper.clientWidth;
        this.canvas.height = this.wrapper.clientHeight;
    }
    
    /** Center the grid in the viewport */
    centerOn ( grid ) {
        const cell_px = this.getCellPixels();
        this.offset_x = (this.canvas.width - grid.cols * cell_px) / 2;
        this.offset_y = (this.canvas.height - grid.rows * cell_px) / 2;
    }
    
    /**
     * Zoom in/out toward a screen point (mx, my).
     * @param {number} factor  - > 1 to zoom in, < 1 to zoom out
     * @param {number} mx      - screen X of the zoom center
     * @param {number} my      - screen Y of the zoom center
     * @param {Grid}   grid    - used to clamp the offset after zoom
     */
    applyZoom ( factor, mx, my, grid ) {
        const new_zoom = Math.min(
            this.max_zoom,
            Math.max( this.min_zoom, this.zoom * factor )
        );
        
        // Keep the point under the mouse fixed during zoom
        this.offset_x = mx - (mx - this.offset_x) * (new_zoom / this.zoom);
        this.offset_y = my - (my - this.offset_y) * (new_zoom / this.zoom);
        this.zoom     = new_zoom;
        
        this.clampOffset( grid );
    }
    
    /**
     * Prevent panning too far away from the grid.
     * @param {Grid} grid
     */
    clampOffset ( grid ) {
        const cell_px = this.getCellPixels();
        const grid_w  = grid.cols * cell_px;
        const grid_h  = grid.rows * cell_px;
        const w       = this.canvas.width;
        const h       = this.canvas.height;
        const margin  = 200; // px of extra pan allowed beyond the border
        
        this.offset_x = Math.min( margin, Math.max( w - grid_w - margin, this.offset_x ) );
        this.offset_y = Math.min( margin, Math.max( h - grid_h - margin, this.offset_y ) );
    }
    
    /**
     * Convert a screen position to a grid (col, row).
     * Returns null if outside the grid.
     * @param {number} sx - screen X
     * @param {number} sy - screen Y
     * @param {Grid}   grid
     */
    screenToGrid ( sx, sy, grid ) {
        const cell_px = this.getCellPixels();
        const col     = Math.floor( (sx - this.offset_x) / cell_px );
        const row     = Math.floor( (sy - this.offset_y) / cell_px );
        
        if ( !grid.isInside( col, row ) ) {
            return null;
        }
        return { col, row };
    }
    
    draw ( grid ) {
        const cell_px = this.getCellPixels();
        
        this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
        
        // ── compute which cells are visible (avoid drawing off-screen cells) ──
        const col_min = Math.max( 0, Math.floor( -this.offset_x / cell_px ) );
        const row_min = Math.max( 0, Math.floor( -this.offset_y / cell_px ) );
        const col_max = Math.min( grid.cols - 1, Math.ceil( (this.canvas.width - this.offset_x) / cell_px ) );
        const row_max = Math.min( grid.rows - 1, Math.ceil( (this.canvas.height - this.offset_y) / cell_px ) );
        
        // ── dead-cell background ──
        this.context.fillStyle = '#0D1520';
        this.context.fillRect(
            col_min * cell_px + this.offset_x,
            row_min * cell_px + this.offset_y,
            (col_max - col_min + 1) * cell_px,
            (row_max - row_min + 1) * cell_px
        );
        
        // ── grid lines (only when zoomed in enough) ──
        if ( this.zoom >= 0.5 ) {
            this.context.strokeStyle = '#111E2A';
            this.context.lineWidth   = 0.5;
            this.context.beginPath();
            
            for ( let c = col_min; c <= col_max + 1; c++ ) {
                const x = c * cell_px + this.offset_x;
                this.context.moveTo( x, row_min * cell_px + this.offset_y );
                this.context.lineTo( x, (row_max + 1) * cell_px + this.offset_y );
            }
            for ( let r = row_min; r <= row_max + 1; r++ ) {
                const y = r * cell_px + this.offset_y;
                this.context.moveTo( col_min * cell_px + this.offset_x, y );
                this.context.lineTo( (col_max + 1) * cell_px + this.offset_x, y );
            }
            this.context.stroke();
        }
        
        // ── alive cells ──
        this.context.fillStyle = '#00FFC8';
        const pad              = this.zoom >= 1 ? 1 : 0; // small gap between cells when zoomed in
        
        for ( let row = row_min; row <= row_max; row++ ) {
            for ( let col = col_min; col <= col_max; col++ ) {
                if ( grid.getCell( col, row ) ) {
                    this.context.fillRect(
                        col * cell_px + this.offset_x + pad,
                        row * cell_px + this.offset_y + pad,
                        cell_px - pad * 2,
                        cell_px - pad * 2
                    );
                }
            }
        }
        
        // ── glow effect (only when zoomed in) ──
        if ( this.zoom >= 1 ) {
            this.context.fillStyle = 'rgba(0, 255, 200, 0.12)';
            for ( let row = row_min; row <= row_max; row++ ) {
                for ( let col = col_min; col <= col_max; col++ ) {
                    if ( grid.getCell( col, row ) ) {
                        this.context.fillRect(
                            col * cell_px + this.offset_x - 2,
                            row * cell_px + this.offset_y - 2,
                            cell_px + 4,
                            cell_px + 4
                        );
                    }
                }
            }
        }
    }
}