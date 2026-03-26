"use strict";

class Game {
    
    constructor () {
        this.grid_cols = 1000;
        this.grid_rows = 1000;
        
        this.grid     = new Grid( this.grid_cols, this.grid_rows );
        this.viewport = new Viewport(
            document.getElementById( 'grid-canvas' ),
            document.getElementById( 'viewport' )
        );
        
        this.is_running   = false;
        this.generation   = 0;
        this.target_fps   = 12;
        this.last_time    = 0;
        this.animation_id = null;
        
        this.is_drawing     = false;
        this.draw_value     = 1;
        this.last_drawn_col = -1;
        this.last_drawn_row = -1;
        
        this.is_panning   = false;
        this.pan_start_x  = 0;
        this.pan_start_y  = 0;
        this.pan_origin_x = 0;
        this.pan_origin_y = 0;
        
        this.dom_play_button  = document.getElementById( 'btn-play' );
        this.dom_stat_gen     = document.getElementById( 'stat-gen' );
        this.dom_stat_alive   = document.getElementById( 'stat-alive' );
        this.dom_zoom_label   = document.getElementById( 'zoom-label' );
        this.dom_speed_slider = document.getElementById( 'speed-slider' );
        
        this.init();
    }
    
    init () {
        this.viewport.resize();
        this.viewport.centerOn( this.grid );
        this.initWithGlider();
        this.bindEvents();
        this.updateDomElements();
        this.viewport.draw( this.grid );
    }
    
    initWithGlider () {
        const index_x = Math.floor( this.grid_cols / 2 );
        const index_y = Math.floor( this.grid_rows / 2 );
        
        const initial_glider = [
            [0, 1],
            [1, 2],
            [2, 0], 
            [2, 1],
            [2, 2]
        ];
        
        for ( let i = 0; i < initial_glider.length; i++ ) {
            this.grid.setCell( index_x + initial_glider[i][0], index_y + initial_glider[i][1], 1 );
        }
    }
    
    start () {
        if ( this.is_running ) {
            return;
        }
        this.is_running                = true;
        this.dom_play_button.innerText = '⏸ Pause';
        this.last_time                 = performance.now();
        this.animation_id              = requestAnimationFrame( ( t ) => this.loop( t ) );
    }
    
    /** Stop the automatic simulation */
    pause () {
        this.is_running                = false;
        this.dom_play_button.innerText = '▶ Jouer';
        if ( this.animation_id ) {
            cancelAnimationFrame( this.animation_id );
        }
    }
    
    loop ( timestamp ) {
        if ( !this.is_running ) {
            return;
        }
        
        const interval = 1000 / this.target_fps;
        
        if ( timestamp - this.last_time >= interval ) {
            this.grid.step();
            this.generation++;
            this.last_time = timestamp;
            this.updateDomElements();
        }
        
        this.viewport.draw( this.grid );
        this.animation_id = requestAnimationFrame( ( t ) => this.loop( t ) );
    }
    
    updateDomElements () {
        this.dom_stat_gen.innerText   = this.generation;
        this.dom_stat_alive.innerText = this.grid.countAlive();
        this.dom_zoom_label.innerText = parseInt( this.viewport.zoom * 100 ) + '%';
    }
    
    /**
     * Paint or erase a single cell, then redraw.
     * Skips if the cell was already drawn in the same drag.
     */
    drawCell ( col, row ) {
        if ( col === this.last_drawn_col && row === this.last_drawn_row ) {
            return;
        }
        
        this.grid.setCell( col, row, this.draw_value );
        this.last_drawn_col = col;
        this.last_drawn_row = row;
        
        this.updateDomElements();
        this.viewport.draw( this.grid );
    }
    
    /* ── EVENT BINDING ── */
    
    bindEvents () {
        const wrapper = this.viewport.wrapper;
        
        // ── buttons ──
        this.dom_play_button.addEventListener( 'click', () => {
            this.is_running ? this.pause() : this.start();
        } );
        
        document.getElementById( 'btn-step' ).addEventListener( 'click', () => {
            this.pause();
            this.grid.step();
            this.generation++;
            this.updateDomElements();
            this.viewport.draw( this.grid );
        } );
        
        document.getElementById( 'btn-clear' ).addEventListener( 'click', () => {
            this.pause();
            this.grid.clear();
            this.generation = 0;
            this.updateDomElements();
            this.viewport.draw( this.grid );
        } );
        
        document.getElementById( 'btn-random' ).addEventListener( 'click', () => {
            this.grid.randomize();
            this.generation = 0;
            this.updateDomElements();
            this.viewport.draw( this.grid );
        } );
        
        this.dom_speed_slider.addEventListener( 'input', () => {
            this.target_fps = parseInt( this.dom_speed_slider.value, 10 );
        } );
        
        // ── mouse: draw or pan ──
        wrapper.addEventListener( 'mousedown', ( e ) => this.onMouseDown( e ) );
        window.addEventListener( 'mousemove', ( e ) => this.onMouseMove( e ) );
        window.addEventListener( 'mouseup', () => this.onMouseUp() );
        wrapper.addEventListener( 'contextmenu', ( e ) => e.preventDefault() );
        
        // ── wheel: zoom ──
        wrapper.addEventListener( 'wheel', ( e ) => this.onWheel( e ), { passive: false } );
        
        // ── resize ──
        new ResizeObserver( () => {
            this.viewport.resize();
            this.viewport.draw( this.grid );
        } ).observe( wrapper );
    }
    
    /* ── EVENT HANDLERS ── */
    
    onMouseDown ( e ) {
        const rect = this.viewport.wrapper.getBoundingClientRect();
        
        // Right-click or middle-click → pan
        if ( e.button === 1 || e.button === 2 ) {
            this.is_panning                    = true;
            this.pan_start_x                   = e.clientX;
            this.pan_start_y                   = e.clientY;
            this.pan_origin_x                  = this.viewport.offset_x;
            this.pan_origin_y                  = this.viewport.offset_y;
            this.viewport.wrapper.style.cursor = 'grabbing';
            return;
        }
        
        // Left-click → draw or erase
        if ( e.button === 0 ) {
            const pos = this.viewport.screenToGrid(
                e.clientX - rect.left,
                e.clientY - rect.top,
                this.grid
            );
            if ( !pos ) {
                return;
            }
            
            this.is_drawing     = true;
            this.draw_value     = e.shiftKey ? 0 : 1;  // shift = erase
            this.last_drawn_col = -1;
            this.last_drawn_row = -1;
            this.drawCell( pos.col, pos.row );
        }
    }
    
    onMouseMove ( e ) {
        // Pan
        if ( this.is_panning ) {
            this.viewport.offset_x = this.pan_origin_x + (e.clientX - this.pan_start_x);
            this.viewport.offset_y = this.pan_origin_y + (e.clientY - this.pan_start_y);
            this.viewport.clampOffset( this.grid );
            this.viewport.draw( this.grid );
            return;
        }
        
        // Draw
        if ( this.is_drawing ) {
            const rect = this.viewport.wrapper.getBoundingClientRect();
            const pos  = this.viewport.screenToGrid(
                e.clientX - rect.left,
                e.clientY - rect.top,
                this.grid
            );
            if ( pos ) {
                this.drawCell( pos.col, pos.row );
            }
        }
    }
    
    onMouseUp () {
        this.is_panning                    = false;
        this.is_drawing                    = false;
        this.viewport.wrapper.style.cursor = 'crosshair';
    }
    
    onWheel ( e ) {
        e.preventDefault();
        const rect   = this.viewport.wrapper.getBoundingClientRect();
        const mx     = e.clientX - rect.left;
        const my     = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        
        this.viewport.applyZoom( factor, mx, my, this.grid );
        this.updateDomElements();
        this.viewport.draw( this.grid );
    }
}