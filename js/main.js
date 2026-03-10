"use strict";
var controller = (function ( self ) {
    //********************************************  INIT  **************************************************//
    self.init                     = function () {
        const game = new Game();
    };
    return self;
})( controller || {} );

document.addEventListener( "DOMContentLoaded", function ( e ) {
    controller.init();
} );