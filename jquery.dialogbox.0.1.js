// jQuery dialog boxes
// Jonathan Bowen 2008-2010
// Last modified 2010-02-04

(function($) {

    var
    /**
     * Box configuration settings
     */
        Config = {
            cancel: $.noop,
            cancelText: 'Cancel',
            close: $.noop,
            confirm: $.noop,
            draggable: true,
            easing: 'swing',
            focus: false,
            maskOpacity: 0.3,
            message: '',
            okText: 'Ok',
            open: $.noop,
            position: 'center',
            preventDefault: true,
            stopPropagation: true,
            promptText: '',
            promptType: 'text',
            restore: true,
            title: '',
            transitions: 'fast',
            type: 'alert',
            shakes: true
        },
    /**
     * Variables for storing current box state - only accessed internally
     */
        Current = {
            options: {},
            dragging: false,
            focussed: false,  
            id: 0,
            isIE6: false,
            left: 0,
            msgHeight: 0,
            onCancel: $.noop,
            outerHeight: 0,
            paddingBottom: 0,
            restoreTo: {},
            srcEvent: false,
            top: 0
        };
        
    $.fn.dialogbox = function(options, evt) {
    
        Current.isIE6 = $.browser.msie && $.browser.version.substr(0, 1) < 7 ? true : false;
        $(this)[evt || 'click'](function(e) {
            Current.srcEvent = e;
            $.fn.dialogbox.open(typeof options === 'function' ? options(e) : options);
        });
        return this;
    };
    
    $.fn.dialogbox.open = function(options) {
    
        // close any existing boxes
        storeDimensions();
        if ($('#dialogbox_outer').length) {
            $.fn.dialogbox.close(Current.options.close, false, true);
        }

        // store parameters in a variable that can be accessed by other functions 
        options = typeof options === 'object' ? options : { message: options };
        var pos = options.position;
        options = $.extend({}, Config, options);
        
        // very hackish fix that prevents box from being moved to default position when 
        // replacing an existing box, unless position explicitly set
        options.position = pos;
        if (typeof options.open === 'function') {
            options.open($.fn.dialogbox, Current.srcEvent);
        }
        var callbackRan = false;
        $('<div/>', {
            id: 'dialogbox_mask',
            css: { height: $(document).height() + 'px', opacity: options.maskOpacity }
        }).add(
        $('<form/>', {
            action: '',
            onsubmit: 'return false',
            id: 'dialogbox_outer',
            'class': 'dialogbox_' + options.type + ($.browser.msie ? ' dialogbox_ie' : ''),
            html: '<div id="dialogbox_handle"></div><div id="dialogbox_inner"><div id="dialogbox_message"><div id="dialogbox_message_inner"></div></div><div id="dialogbox_buttons"></div></div>'
        })
        ).appendTo($('body')).hide().fadeIn(Current.outerHeight ? 0 : options.transitions, function() {
            
            // don't let the callback run more than once
            if (callbackRan) {
                return;
            }
            callbackRan = true;
            
            // doesn't fade in if box is taller than the viewport (don't know why), so need to set explicitly
            $('#dialogbox_outer').css('opacity', 1);
            if (Current.isIE6) {
                $('body').children('*[id!=dialogbox_outer]').find('select').css({display: 'none'});
            }
        });
        
        var resize = function() {
            $('#dialogbox_mask').css({
                height: $(document).height() + 'px',
                width: Current.isIE6 ? $('body').outerWidth(true) + 'px' : '100%' // ie6 won't do width:100%
            });
        };
        resize();
        $(window).resize(function() {
            resize();
            $.fn.dialogbox.adjustPosition();
        });
        
        $.fn.dialogbox.set(options);

        // very nasty hacks to mitigate ie6's 'difficulties'
        if (Current.isIE6) {
            $.fn.dialogbox.adjustPosition();
            $(window).scroll($.fn.dialogbox.adjustPosition).resize($.fn.dialogbox.adjustPosition);
        }
        
        if (Current.srcEvent) {
            if (options.preventDefault) {
                Current.srcEvent.preventDefault();
            }
            if (options.stopPropagation) {
                Current.srcEvent.stopImmediatePropagation();
            }
        }
        
        return this; 
    };
    
    $.fn.dialogbox.set = function(options, v) {
    
        var outer = $('#dialogbox_outer'),
            inner = $('#dialogbox_inner'),
            msgholder = $('#dialogbox_message'),
            msgdiv = $('#dialogbox_message_inner'),
            buttons = $('#dialogbox_button, #dialogbox_buttons'),
            promptVal = $.fn.dialogbox.prompt();
        
        if (!outer.length) {
            return this;
        }

        Current.paddingBottom = Current.paddingBottom || Math.round(inner.css('padding-bottom').replace('px', ''));

        // see if there's an existing box
        // if so, get its dimensions for transition animation
        // (this will not be true if called straight from open())
        if ($('#dialogbox_ok').length) {

            storeDimensions();
            $('#dialogbox_loadbar').remove();
        }

        if (v !== undefined) {
            var k = options;
            options = {};
            options[k] = v;
        }
        else if (typeof options !== 'object') {
            options = { message: options };
        }
        
   //     msgdiv.css({height:'auto'});
        
        // apply parameters to box
        if (options.message !== undefined) {
            
            var formVals = $.fn.dialogbox.form();
            if (typeof options.message === 'string') {
                msgdiv.html(options.message);
            }
            else {
                options.message = options.message instanceof jQuery ? options.message : $(options.message);
                var parent = options.message.parent();
                
                // if the message is a DOM element, save its location in the DOM so it can be restored on box close
                if (parent.length && !parent.parents('#dialogbox_outer').length) {
                    
                    if (!$.isEmptyObject(Current.restoreTo)) {
                        restore();
                    }
                    Current.restoreTo = {
                        parent: parent,
                        next: options.message.next(),
                        previous: options.message.prev()
                    };
                }
                msgdiv.append(options.message);
            }
            if (formVals.length) {
                $.fn.dialogbox.form(formVals);
            }
        }
        
        if (options.title !== undefined) {
            $('#dialogbox_handle').text(options.title);
        }

        // merge parameters with existing box parameters
        $.extend(Current.options, options);

        buttons.attr('id', Current.options.type === 'alert' ? 'dialogbox_button' : 'dialogbox_buttons').empty();
        $('<input/>', {
            id: 'dialogbox_ok',
            type: 'submit',
            value: Current.options.okText
        }).appendTo(buttons);
        if (Current.options.type !== 'alert') {
            $('<input/>', {
                id: 'dialogbox_cancel',
                type: 'button',
                value: Current.options.cancelText
            }).appendTo(buttons);
        }
        $('#dialogbox_input').remove();
        if (Current.options.type === 'prompt') {
            ($('<input/>', {                
                type: Current.options.promptType === 'password' ? 'password' : 'text',
                id: 'dialogbox_input',
                name: 'dialogbox_input',
                maxlength: 30,
                // using options rather than Current.options here,
                // because we don't want an inherited option to overwrite any user-entered data
                value: options.promptText !== undefined ? options.promptText : promptVal
            })).appendTo(msgholder);
        }

        // sort out box dimensions and perform transitions if necessary
        inner.css('padding-bottom', 
            (Current.paddingBottom + $('#dialogbox_button, #dialogbox_buttons').outerHeight()) + 'px' );
        var w = 0;
        $('#dialogbox_button input, #dialogbox_buttons input').each(function() {
            w += $(this).css('margin-left', 0).outerWidth(true);
        });

        // should just add a margin, but ie6 doubles it, so use a span instead
        buttons.find('span').remove();
        $('<span/>', {css: {
            float: 'left',
            width: ((outer.outerWidth() / 2) - (w / 2)) + 'px',
            height: '10px',
            display: 'inline'
        }}).prependTo(buttons);

        var newHeight = msgholder.css('height', 'auto').height();
        var oldHeight = Current.msgHeight || newHeight;
        var diff = newHeight - oldHeight;
        var ieAdjust = Current.isIE6 ? $(document).scrollTop() : 0;
        
        if (!Current.outerHeight || options.position !== undefined) {

            options.position = options.position === undefined ? Config.position : options.position;
            var coords = typeof options.position === 'object' ? 
                options.position : options.position.toString().replace(/^\s+|\s+$/, '').split(/\s+/);
            coords = $.extend(['center', 'center'], coords.slice(0, 2));
            var horizontals = ['left', 'right'], verticals = ['top', 'bottom'], strings = horizontals.concat(verticals);
            if ($.inArray(coords[0], verticals) > -1 || $.inArray(coords[1], horizontals) > -1) {               
                coords.reverse();
            }
            var css = {};           
            $.each(coords, function(k, coord) {
                
                var d = k ? 'top' : 'left';
                coord = coord.toString();
                if ($.inArray(coord, strings.slice(k * 2, (k * 2) + 2)) > -1) {
                    
                    switch (coord) {
                        case 'top':
                        case 'left':
                            css[d] = 0;
                            break;
                        case 'bottom':
                            css[d] = $(window).height() - outer.outerHeight();
                            break;
                        case 'right':
                            css[d] = $(document).width() - outer.outerWidth();
                    }
                }
                else if (!coord.match(/^[\d\.-]+(px)?$/)) {
                    
                    css[d] = (k ? (ieAdjust + ($(window).height() / 2) - (outer.outerHeight() / 2))
                                : (($(document).width() / 2) - (outer.outerWidth() / 2))) + 'px';
                }
                else {
                    css[d] = coord.replace(/[^\d\.-]+/g, '');
                    var num = parseFloat(css[d].replace(/[^\d\.]+/g, ''));
                    css[d] = (
                        (css[d].substr(0, 1) === '-' ? 
                            ((k ? $(window).height() - outer.outerHeight() + ieAdjust 
                                : (($(document).width()) - outer.outerWidth())
                              ) - num)
                            : num + (k ? ieAdjust : 0 )
                        )
                    ) + 'px';                               
                }
            });
            if (Current.outerHeight) {
                outer.css({
                    top: Current.top,
                    left: Current.left
                }).animate(css, Current.options.transitions, Current.options.easing, $.fn.dialogbox.adjustPosition);
            } 
            else {
                outer.css(css);
                $.fn.dialogbox.adjustPosition();
            }
        }
        else {
            outer.stop().css({
                top: Current.top,
                left: Current.left
            }).animate({
                top: (diff > 0 ? '-' : '+') + '=' + Math.abs(diff / 2)
            }, Current.options.transitions, Current.options.easing, $.fn.dialogbox.adjustPosition);
        }
        
        msgholder.stop().css('height', oldHeight + 'px').animate({
            height: (diff > 0 ? '+' : '-') + '=' + Math.abs(diff)
        }, Current.options.transitions, Current.options.easing, $.fn.dialogbox.focus);

        addEvents();
        
        if (Current.options.draggable) {
                
            outer.draggable({
                handle: '#dialogbox_handle',
                containment: $('body').height() > $(window).height() ? 'body' : 'window',
                start: function() { Current.dragging = true; },
                stop: function() {
                    Current.dragging = false;
                    $.fn.dialogbox.adjustPosition();
                    storeDimensions();
                }
            });
        }

        return this;
    };
    
    $.fn.dialogbox.close = function(callback, boxId, nofade) {
    
        // prevent from closing newly created/altered boxes
        if (!boxId || boxId === Current.id) {
        
            // if close() is called within confirm or cancel functions,
            // set id to prevent the function from running again after those functions have completed
            setId();
            var elms = $('#dialogbox_outer, #dialogbox_mask');
            elms.stop().fadeOut(nofade ? 0 : Current.options.transitions, function() {
            
                // don't let the callback run more than once
                if (!$('#dialogbox_outer').length) {
                    return;
                }
                // if message has been grabbed from the DOM, try to put it back in its original location
                // so original function can be reused
                restore();
                elms.remove();
                if (Current.isIE6) {
                    $('select').css({display: ''});
                }
                Current.focussed = false;
                if (typeof callback === 'function') {
                    callback($.fn.dialogbox, Current.srcEvent);
                }
            });
        }
        return this;
    };
    
    $.fn.dialogbox.addLoadbar = function() {
    
        if (!$('#dialogbox_outer').length) {
            $.fn.dialogbox.open();
        }
        if (!$('#dialogbox_loadbar').length) {
            
            // reset box id: so this function can be included within onConfirm or onCancel functions
            // without the box being immediately closed after those functions have completed
            setId();
            var buttonholder = $('#dialogbox_buttons, #dialogbox_button');
            $('#dialogbox_ok').focus();
            $('<div/>', {
                id: 'dialogbox_loadbar',
                css: { height: buttonholder.outerHeight() + 'px' }
            }).prependTo(buttonholder);
            if (Current.isIE6) {
                $('#dialogbox_loadbar').css('display', 'block'); // ie6 needs to be told again...
            }
        }
        return this;
    };
    
    $.fn.dialogbox.removeLoadbar = function() {
    
        $('#dialogbox_loadbar').remove();
        addEvents();
        return this;
    };
    
    /**
     * Getter and setter for prompt input value
     * 
     * @param {String}  val  value for input
     * @return {String} new input value
     */
    $.fn.dialogbox.prompt = function(val) {
    
        var result;
        if (val !== undefined) {
            $('#dialogbox_input').val(val);
            result = this;
        }
        else {
            result = $('#dialogbox_input').val(); 
        }
        return result;
    };
    
    /**
     * Getter and setter for default parameters for new boxes
     * 
     * @param {Object|String} k Key/value object of parameters / name of single parameter / empty to get all parameters
     * @param {Mixed}         v Value of selected parameter
     * @return {Mixed}        value of selected parameter, or key/value object of all parameters
     */
    $.fn.dialogbox.config = function(k, v) {
        
        var result;
        if (v !== undefined) {
            if (Config[k] !== undefined) {
                Config[k] = v;
            }
            result = this;
        }
        else if (typeof k === 'object') {
            $.each(k, function(key, value) {
                $.fn.dialogbox.config(key, value);
            });
            result = this;
        }
        else if (k !== undefined) {
            result = Config[k];
        }
        else {
            result = $.extend({}, Config);
        }
        return result;
    };
    
    /**
     * Getter and setter for any and all form fields within the box
     * 
     * @param {Object|String}  k  Key/value object of fields to set /
     *                         array of name/value objects (ie object returned from jQuery serializeArray() function / 
     *                         id of field to get value of / 
     *                         empty to get all fields
     * @param {String|Boolean} v  Value of selected field; if field is checkbox/radio, use a boolean to check/uncheck
     * @return {Object|String} Value of selected field or key/value object of all fields
     */
    $.fn.dialogbox.form = function(k, v) {
        
        var result, field, type;
        if (v !== undefined) {
            
            field = $('#' + k);
            type = field.attr('type');
            if (field.length && (type === 'checkbox' || type === 'radio')) {
                field.get(0).checked = !!v;
            }
            else {
                field.val(v);
            }
            result = this;
        }
        else if (typeof k === 'object') {
            $.each(k, function(index, value) {
                
                if (value.name !== undefined) {
                    $.fn.dialogbox.form(value.name, value.value);
                }
                else {
                    $.fn.dialogbox.form(index, value);
                }
            });
            result = this;
        }
        else if (k !== undefined) {
            
            field = $('#' + k);
            type = field.attr('type');
            if (field.length && (type === 'checkbox' || type === 'radio')) {
                result = field.get(0).checked;
            }
            else {
                result = $('#' + k).val();
            }
        }
        else {
            result = $('#dialogbox_outer').serializeArray();
        }
        return result;
    };
    
    /**
     * Reset all form fields
     */
    $.fn.dialogbox.reset = function() {
        
        var form = $('#dialogbox_outer');
        if (form.length) {
            form.get(0).reset();
        }
        return this;
    };
    
    /**
     * Is there a box on the page?
     */
    $.fn.dialogbox.isOpen = function() {
        return $('#dialogbox_outer').length === 1;
    }
    
    /**
     * Just passes the box form to jquery serialize() function
     */
    $.fn.dialogbox.serialize = function() {
        
        return $('#dialogbox_outer').serialize();
    };
    
    /**
     * Shake the box and refocus if user clicks away
     * 
     * @param {Number} max  number of shakes
     * @param {Number} i    current iteration
     */
    $.fn.dialogbox.shake = function(max, i) {
        
        max = typeof max === 'number' ? max : 2;
        i = i || 0;
        var outer = $('#dialogbox_outer');
        if (i < max && Current.options.shakes) {
            if (!i) {
                outer.stop().css('margin-top', 0);
            }
            outer.animate({
                marginTop: '-=5'
            }, 50, Current.options.easing, function() {
                outer.animate({
                    marginTop: '+=5'
                }, 50, Current.options.easing, function() {
                    $.fn.dialogbox.shake(max, ++i);
                });
            });
        }
        else {
            outer.animate({
                marginTop: 0
            }, 50, Current.options.easing, $.fn.dialogbox.focus);
        }
        return this;
    };
    
    $.fn.dialogbox.adjustPosition = function() {
        
        var outer = $('#dialogbox_outer'), css = {}, offset = outer.offset();
        
        // don't whip it away while dragging
        if (!Current.dragging && outer.length) {
            
            var top = offset.top - $(document).scrollTop(), left = offset.left;
            if (top < 0) {
                css.top = '+=' + (Math.abs(top));
            }
            else {
                var boxHeight = outer.outerHeight(), winHeight = $(window).height();
                if (top > 0 && (offset.top + boxHeight) > ($(document).scrollTop() + winHeight)) {
                    css.top = ((Current.isIE6 ? $(document).scrollTop() : 0) + winHeight - boxHeight) + 'px';
                }
            }
            if (left < 0) {
                css.left = 0;
            }
            else {
                var boxWidth = outer.outerWidth(), winWidth = $(window).width();
                if (left > 0 && ((offset.left + boxWidth) > winWidth)) {
                    css.left = (winWidth - boxWidth) + 'px';
                }
            }
            if (!$.isEmptyObject(css)) {
                outer.stop().animate(css, Current.options.transitions, Current.options.easing, storeDimensions);
            }
        }
        
        return this;
    };
    
    $.fn.dialogbox.focus = function() {

        // when using form elements from the page,
        // ie removes focus from updated boxes when the mouse is moved or user attempts to submit by pressing Enter
        // creating an input, focussing it, then removing it, somehow tricks ie into behaving itself
        if ($.browser.msie && $.browser.version < 8) {
            $('<input/>').appendTo('#dialogbox_outer').focus().remove();
        }
        var fields = $('#dialogbox_outer').find('input:visible, select:visible, textarea:visible, button:visible');
        if (fields.length) {
            fields.unbind('focus')
                .unbind('blur')
                .unbind('mouseover')
                .unbind('mouseout')
                .blur().removeClass('dialogbox_focus');
            var target = typeof Current.options.focus === 'string' && $(Current.options.focus).length && 
                $(Current.options.focus).parents('#dialogbox_inner').length ? $(Current.options.focus) : $(fields[0]);
            target.focus();
            Current.focussed = target.attr('id');
            var type = target.attr('type');
            if (type === 'text' || type === 'password') {
                target.select();
            }
            fields.focus(function() {
                $(this).addClass('dialogbox_focus');
                Current.focussed = $(this).attr('id');
            }).blur(function() {
                $(this).removeClass('dialogbox_focus');
                Current.focussed = false;
            }).mouseover(function() {
                $(this).addClass('dialogbox_hover');
            }).mouseout(function() {
                $(this).removeClass('dialogbox_hover');
            });
        }
        return this;
    };
    
    /**
     * To prevent momentary flash of 'naked box' while its background images are loading,
     * open and then close an empty box - this should make browsers fetch all required background images 
     */
    $.fn.dialogbox.preload = function() {
        
        return $.fn.dialogbox.open().addLoadbar().close();
    };
    
    function setId() {
    
        Current.id = ((new Date()).getTime() + '' + Math.floor(Math.random() * 1000000)).substr(0, 18);
        return Current.id;
    }
    
    function addEvents() {
        
        var outer = $('#dialogbox_outer'), id = setId();
        
        $('#dialobox_mask, #dialogbox_cancel').unbind();
        $('#dialogbox_outer').unbind('submit');
        $('#dialogbox_outer').unbind('keydown');
        
        // ok and cancel functions 
        var func = function(a) {

            // don't allow user to close box if loadbar is present
            if (!$('#dialogbox_loadbar').length) {
                
                if (typeof Current.options[a] === 'function') {
                    Current.options[a]($.fn.dialogbox, Current.srcEvent);
                }
                $.fn.dialogbox.close(Current.options.close, id);
            }
            return false;
        };
        var confirm = function() {
            $('#dialogbox_ok').addClass('dialogbox_active');
            return func('confirm');
        };
        var cancel = function() {
            $('#dialogbox_cancel').addClass('dialogbox_active');
            return func('cancel');
        };
        outer.submit(confirm);
        
        // don't allow separate cancel function for alert boxes
        Current.onCancel = Current.options.type !== 'alert' ? cancel : confirm; 

        $('#dialogbox_cancel').click(cancel);
        
        outer.keydown(keydown);
        
        $(document).keydown($.fn.dialogbox.focus);
        
        $('#dialogbox_mask').mousedown($.fn.dialogbox.shake);
        $('body').children('*[id!=dialogbox_outer]').focusin($.fn.dialogbox.shake);
    }
    
    /**
     * restore box message to its original location in the DOM
     */
    function restore() {
        
        if (Current.options.restore) {
            if (Current.restoreTo.next && Current.restoreTo.next.length) {
                Current.restoreTo.next.before(Current.options.message);
            }
            else if (Current.restoreTo.previous && Current.restoreTo.previous.length) {
                Current.restoreTo.previous.after(Current.options.message);
            }
            else if (Current.restoreTo.parent && Current.restoreTo.parent.length) {
                Current.restoreTo.parent.append(Current.options.message);
            }
        }
        Current.restoreTo = {};
    }
    
    function keydown(evt) {

        var ok = $('#dialogbox_ok');
        var cancel = $('#dialogbox_cancel');
        if (!ok.length) { return; }
        
        var entered = evt.which;
        
        if (entered === 27) {
            Current.onCancel();
            evt.preventDefault();
        }

        // use arrow keys to move focus between buttons like regular popups
        // 37:left, 38:up, 39:right, 40:down (return false to prevent scrolling (opera ignores this))
        else if (entered === 39 || entered === 40) {
            if (Current.focussed === 'dialogbox_ok' && cancel.length) {
               ok.blur();
               cancel.focus();
            }
            if (Current.focussed === 'dialogbox_cancel' || Current.focussed === 'dialogbox_ok') {
                evt.preventDefault();
            }
        }
        else if (entered === 37 || entered === 38) {
            if (Current.focussed === 'dialogbox_cancel' && cancel.length) {
                cancel.blur();
                ok.focus();
            }
            if (Current.focussed === 'dialogbox_cancel' || Current.focussed === 'dialogbox_ok') {
                evt.preventDefault();
            }
        }
        evt.stopPropagation();
    }
    
    function storeDimensions() {

        Current.msgHeight = $('#dialogbox_message').height();
        Current.outerHeight = $('#dialogbox_outer').outerHeight();  
        Current.top = $('#dialogbox_outer').css('top');
        Current.left = $('#dialogbox_outer').css('left');
    }

})(jQuery);