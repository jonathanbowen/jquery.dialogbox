(function($) {

    var x = 0, 
        y = 0, 
        dragging = false,
        defaults = {
            handle: false,
            start: $.noop,
            stop: $.noop
        };
        
    $.fn.simpleDrag = function(options) {
    
        var settings = $.extend({}, defaults, options), handle;
        settings.target = this;
        if (typeof settings.handle === 'string') {
            handle = $(settings.handle);
        } else if (!(settings.handle instanceof jQuery)) {
            handle = this;
        }
        handle.data('simpleDrag', settings);
        
        handle.unbind('mousedown.simpleDrag').bind('mousedown.simpleDrag', function(e) {
            x = e.pageX;
            y = e.pageY;
            dragging = $.data(this, 'simpleDrag');
            typeof dragging.start === 'function' && dragging.start();
        });
        
        document.onselectstart = function() {
            if (dragging) return false;
        };
        $(document)
        .unbind('mousedown.simpleDrag mouseup.simpleDrag mousemove.simpleDrag')
        .bind('mousedown.simpleDrag', function() {
            if (dragging) return false;
        })
        .bind('mouseup.simpleDrag', function() {
            typeof dragging.stop === 'function' && dragging.stop();
            dragging = false;
        })
        .bind('mousemove.simpleDrag', function(e) {
 
            if (!dragging) return;
            
            var win = $(window),
                xpos = e.pageX, 
                ypos = e.pageY, 
                box = dragging.target,
                xOffset = xpos - x,
                yOffset = ypos - y,
                maxX = win.width() - box.outerWidth(),
                maxY = (box.css('position') === 'fixed' ? win.height() : $(document).height()) - box.outerHeight(),
                cssX = (parseInt(box.css('left'), 10) + xOffset),
                cssY = (parseInt(box.css('top'), 10) + yOffset);

            if (cssX > maxX) {
                xpos -= (cssX - maxX);
                cssX = maxX;
            } else if (cssX < 0) {
                xpos -= cssX;
                cssX = 0;
            }
            if (cssY > maxY) {
                ypos -= (cssY - maxY);
                cssY = maxY;
            } else if (cssY < 0) {
                ypos -= cssY;
                cssY = 0;
            }

            x = xpos; y = ypos;
            box.css({left:cssX + 'px',top:cssY + 'px'});
        });
    };

})(jQuery);