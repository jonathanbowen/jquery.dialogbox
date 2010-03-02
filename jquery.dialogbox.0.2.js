// jQuery dialog boxes
// Jonathan Bowen 2008-2010

(function($) {

    var
    /**
     * Box configuration settings
     */
        Config = {
            cancel: $.noop,
            cancelText: 'Cancel',
            className: '',
            close: $.noop,
            confirm: $.noop,
            draggable: true,
            easing: 'swing',
            focus: false,
            loadbar: false,
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
            shakes: true,
            width: 270
        },
    /**
     * Variables for storing current box state - only accessed internally
     */
        Current = {
            dragging: false,
            focussed: false,
            id: 0,
            isIE6: $.browser.msie && $.browser.version.substr(0, 1) < 7 ? true : false,
            left: 0,
            msgHeight: 0,
            onCancel: $.noop,
            options: {},
            outerHeight: 0,
            restoreTo: {},
            srcEvent: false,
            top: 0,
            triggered: false,
            width: 0
        };
    
    /**
     * Attach box-triggering event
     * 
     * @param  {Object} options config options or function to generate same
     * @param  {Object} evt     event to attach box to
     * @return {Object} jQuery
     */    
    $.fn.dialogbox = function(options, evt) {
    
        $(this)[evt || 'click'](function(e) {
            Current.srcEvent = e;
            Current.triggered = true;
            $.fn.dialogbox.open(typeof options === 'function' ? options(e) : options);
        });
        return this;
    };
    
    /**
     * Open a new box
     * 
     * @param  {Object} options config options
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.open = function(options) {
    
        // close any existing boxes
        storeDimensions();
        if ($('#dialogbox_outer').length) {
            $.fn.dialogbox.close(Current.options.close, true);
        }

        // store parameters in a variable that can be accessed by other functions 
        options = typeof options === 'object' ? options : { message: options };
        typeof options.open === 'function' && options.open($.fn.dialogbox, Current.srcEvent);
        var pos = options.position;
        options = $.extend({}, Config, options);
        
        // very hackish fix that prevents box from being moved to default position when 
        // replacing an existing box, unless position explicitly set
        options.position = pos;
        var callbackRan = false;
        $('<div/>', {
            id: 'dialogbox_mask',
            'class': options.className,
            css: { height: $(document).height() + 'px', opacity: options.maskOpacity }
        }).add(
        $('<form/>', {
            action: '',
            onsubmit: 'return false',
            id: 'dialogbox_outer',
            'class': 'dialogbox_' + options.type + ' ' + options.className + ($.browser.msie ? ' dialogbox_ie' : ''),
            html: '<div id="dialogbox_top_left"></div><div id="dialogbox_top_right"></div><div id="dialogbox_handle"><div id="dialogbox_handle_inner"></div></div><div id="dialogbox_inner"><div id="dialogbox_message"><div id="dialogbox_bottom_left"></div><div id="dialogbox_bottom_right"></div><div id="dialogbox_message_inner"></div><div id="dialogbox_buttons"></div></div></div>'
        })
        ).appendTo($('body')).hide().fadeIn(Current.outerHeight ? 0 : options.transitions, function() {
            
            // don't let the callback run more than once
            if (!callbackRan) {
                // doesn't fade in if box is taller than the viewport (don't know why), so need to set explicitly
                $('#dialogbox_outer').css('opacity', 1);
                if (Current.isIE6) {
                    $('body').children('*[id!=dialogbox_outer]').find('select').css({display: 'none'});
                }
                callbackRan = true;
            }
        });
        
        // make sure mask fills entire page on resize
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

        // hacks to mitigate ie6's 'difficulties'
        if (Current.isIE6) {
            $.fn.dialogbox.adjustPosition();
            $('#dialogbox_outer').click();
            $(window).scroll($.fn.dialogbox.adjustPosition).resize($.fn.dialogbox.adjustPosition);
        }
        
        // only prevent default / stop propagation when box first triggered
        // - not when called from callback function
        if (Current.triggered && Current.srcEvent) {
            
            options.preventDefault && Current.srcEvent.preventDefault();
            options.stopPropagation && Current.srcEvent.stopPropagation();
        }
        Current.triggered = false;
        
        return this; 
    };
    
    /**
     * Alter properties of existing box
     * 
     * @param  {Object} options config options or config key
     * @param  {Mixed}  v       config value, if key used for first argument
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.set = function(options, v) {
    
        var outer = $('#dialogbox_outer'),
            inner = $('#dialogbox_inner'),
            msgholder = $('#dialogbox_message'),
            msgdiv = $('#dialogbox_message_inner'),
            buttons = $('#dialogbox_buttons'),
            promptVal = $.fn.dialogbox.prompt();
        
        if (!outer.length) {
            return this;
        }

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
        
        // apply parameters to box
        if (options.message !== undefined) {
            
            var formVals = $.fn.dialogbox.form();
            if (typeof options.message === 'string') {
                msgdiv.html(options.message);
            }
            else {
                options.message = options.message instanceof jQuery ? options.message : $(options.message);
                
                // if the message is DOM element(s), save location in the DOM so it/they can be restored on box close
                // if we've already got saved elements, restore before saving the new ones
                restore();
                options.message.each(function(i) {
                    var $this = $(this);
                    Current.restoreTo[i] = {
                        parent: $this.parent(),
                        next: $this.next(),
                        previous: $this.prev()
                	}
                });
                msgdiv.append(options.message);
            }
            // repopulate the form
            // so entered input does not disappear if fields have been added in an html string
            if (formVals.length) {
                $.fn.dialogbox.form(formVals);
            }
        }
        
        if (options.title !== undefined) {
            $('#dialogbox_handle_inner').text(options.title);
        }

        // merge parameters with existing box parameters
        $.extend(Current.options, options);
        
        buttons.empty();
        $('<input id="dialogbox_ok" type="submit" value="' + Current.options.okText + '" />').appendTo(buttons);
        if (Current.options.type !== 'alert') {
            $('<input id="dialogbox_cancel" type="button" value="' + Current.options.cancelText + '" />').appendTo(buttons);
        }
        $('#dialogbox_input').remove();
        if (Current.options.type === 'prompt') {
            ($('<input id="dialogbox_input" name="dialogbox_input" maxlength="30" type="' +
                (Current.options.promptType === 'password' ? 'password' : 'text') +
                '" value="' +
                // using options rather than Current.options here,
                // because we don't want an inherited option to overwrite any user-entered data
                (options.promptText !== undefined ? options.promptText : promptVal) + '" />')).appendTo(msgdiv);
        }

        // sort out box dimensions and perform transitions if necessary 
        outer.css('width', Current.options.width + 'px');
        $('#dialogbox_outer input[type=hidden]').hide();
        
        var newHeight = msgdiv.css('height', 'auto').css('overflow', 'visible').height(),
            oldHeight = Current.msgHeight || newHeight,
            ieAdjust = Current.isIE6 ? $(document).scrollTop() : 0, 
            hDiff = newHeight - oldHeight,
            wDiff = Current.width ? Current.options.width - parseFloat(Current.width.replace('px', '')) : 0;
            
        Current.width && outer.css('width', Current.width);
     
        if (!Current.outerHeight || options.position !== undefined) {

            options.position = options.position === undefined ? Config.position : options.position;
            var css = {},
                horizontals = ['left', 'right'],
                verticals = ['top', 'bottom'],
                strings = horizontals.concat(verticals),
                coords = typeof options.position === 'object' ? 
                    options.position : options.position.toString().replace(/^\s+|\s+$/, '').split(/\s+/);
            coords = $.extend(['center', 'center'], coords.slice(0, 2));
            if ($.inArray(coords[0], verticals) > -1 || $.inArray(coords[1], horizontals) > -1) {               
                coords.reverse();
            }
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
                            css[d] = $(document).width() - (Current.options.width);
                    }
                }
                else if (!coord.match(/^[\d\.-]+(px)?$/)) {
                    
                    css[d] = (k ? (ieAdjust + ($(window).height() / 2) - (outer.outerHeight() / 2))
                                : (($(document).width() / 2) - (Current.options.width / 2)));
                }
                else {
                    css[d] = coord.replace(/[^\d\.-]+/g, '');
                    var num = parseFloat(css[d].replace(/[^\d\.]+/g, ''));
                    css[d] = (
                        (css[d].substr(0, 1) === '-' ? 
                            ((k ? $(window).height() - outer.outerHeight() + ieAdjust 
                                : ($(document).width() - Current.options.width)
                              ) - num)
                            : num + (k ? ieAdjust : 0)
                        )
                    );                            
                }
            });

            css.top += 'px';
            css.left = (parseFloat(css.left) > 0 ? css.left : 0) + 'px';
            css.width = Current.options.width + 'px';
            if (Current.outerHeight) {
                outer.css({
                    top: Current.top,
                    left: Current.left,
                    width: Current.width
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
                left: Current.left,
                width: Current.width
            }).animate({
                top: (hDiff > 0 ? '-' : '+') + '=' + Math.abs(hDiff / 2),
                width: Current.options.width + 'px',
                left: (parseFloat(Current.left.replace('px', '')) - (wDiff / 2)) + 'px'
            }, Current.options.transitions, Current.options.easing, $.fn.dialogbox.adjustPosition);
        }
        
        msgdiv.stop().css('overflow', 'hidden').css('height', oldHeight + 'px').animate({
            height: (hDiff > 0 ? '+' : '-') + '=' + Math.abs(hDiff)
        }, Current.options.transitions, Current.options.easing, $.fn.dialogbox.focus);

        addEvents();
        
        if (Current.options.draggable) {
                
            outer.draggable({
                handle: '#dialogbox_handle',
                containment: $('body').height() > $(window).height() ? 'body' : 'window',
                start: function() {
                    Current.dragging = true;
                    // chrome/safari only seem to be able to get offset correct when position set to absolute
                    if ($.browser.safari) {
                        outer.css('position', 'absolute');
                    }
                },
                stop: function() {
                    Current.dragging = false;
                    if ($.browser.safari) {
                        outer.css({
                            position: 'fixed',
                            top: (parseFloat(outer.css('top').replace('/px/', '')) - $(document).scrollTop()) + 'px'
                        });
                    }
                    $.fn.dialogbox.adjustPosition();
                    storeDimensions();
                }
            });
        }
        
        if (Current.options.loadbar) {
            $.fn.dialogbox.addLoadbar();
            Current.options.loadbar = false;
        }

        return this;
    };
    
    /**
     * Close box
     * 
     * @param  {Function} callback Function to be called after box has been faded and removed
     * @param  {Boolean}  nofade   Whether to set fade duration to 0
     * @param  {Number}   boxId    Id of current box
     * @return {Object}   $.fn.dialogbox
     */
    $.fn.dialogbox.close = function(callback, nofade, boxId) {
    
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
                typeof callback === 'function' && callback($.fn.dialogbox, Current.srcEvent);
            });
        }
        return this;
    };
    
    /**
     * Add loading indicator and disable confirm/cancel functions
     * 
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.addLoadbar = function() {
    
        if (!$('#dialogbox_outer').length) {
            $.fn.dialogbox.open();
        }
        if (!$('#dialogbox_loadbar').length) {
            
            // reset box id: so this function can be included within confirm or cancel functions
            // without the box being immediately closed after those functions have completed
            setId();
            var buttonholder = $('#dialogbox_buttons');
            $('#dialogbox_ok').focus();
            $('#dialogbox_buttons input').css('visibility', 'hidden');
            $('<div/>', {
                id: 'dialogbox_loadbar',
                css: { height: buttonholder.outerHeight() + 'px', width: buttonholder.outerWidth() + 'px' }
            }).appendTo(buttonholder);
            if (Current.isIE6) {
                $('#dialogbox_loadbar').css('display', 'block'); // ie6 needs to be told again...
            }
        }
        return this;
    };
    
    /**
     * Remove loading indicator if present and reattach events
     * 
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.removeLoadbar = function() {
    
        $('#dialogbox_buttons input').css('visibility', 'visible');
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
    $.fn.dialogbox.form = function(n, v) {
    
        var result;
        if (n === undefined) {
            result = $('#dialogbox_outer').serializeArray();
        }
        else if (typeof n === 'object') {
            $.each(n, function(index, value) {
                var args = value.name !== undefined ? [value.name, value.value] : [index, value];
                result = $.fn.dialogbox.form(args[0], args[1]);
            });
        }
        else {
            var $fields = $('*[name=' + n + ']'),
                type = $fields.attr('type'),
                setting = v !== undefined;
            if (type === 'radio' || type === 'checkbox') {
                if (setting) {
                    v = $.map(typeof v === 'object' ? v : [v], function(a){ return a + ''; });
                }
                $fields.each(function() {
                    var $field = $(this), val = $field.val();
                    if (setting) {
                        $field.get(0).checked = $.inArray(val, v) > -1;
                    }
                    else if ($field.get(0).checked) {
                        result = result && typeof result !== 'object' ? [result] : result;
                        typeof result === 'object' ? result[result.length] = val : result = val;
                    }
                });
            }
            else {
                setting ? $fields.val(v) : result = $fields.val();
            }
            result = setting ? this : result;
        }
        return result;
    };
    
    /**
     * Reset all form fields
     * 
     * @return {Object} $.fn.dialogbox
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
     * 
     * @return {Boolean}
     */
    $.fn.dialogbox.isOpen = function() {
        
        return $('#dialogbox_outer').length > 0;
    };
    
    /**
     * Just passes the box form to jquery serialize() function
     * 
     * @return {String} serialised form data
     */
    $.fn.dialogbox.serialize = function() {
        
        return $('#dialogbox_outer').serialize();
    };
    
    /**
     * Shake the box and refocus if user clicks away
     * 
     * @param  {Number} max  number of shakes
     * @param  {Number} i    current iteration
     * @return {Object} $.fn.dialogbox
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
    
    /**
     * Check box's position; if any part of it's moved out of the viewport,
     * then animate back in if there's enough space
     * 
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.adjustPosition = function() {
        
        var outer = $('#dialogbox_outer'), css = {}, offset = outer.offset();
        
        // don't whip it away while dragging
        if (!Current.dragging && outer.length) {
            
            var top = offset.top - $(document).scrollTop(), left = offset.left;
            if (top < 0) {
                css.top = 0;
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
                outer.stop().animate(css, Current.options.transitions, Current.options.easing, function() {
                    storeDimensions();
                    $.fn.dialogbox.focus();
                });
            }
        }
        
        return this;
    };
    
    /**
     * Focus on a field within the box and add focus/blur/hover/mouseout events to all fields
     * 
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.focus = function() {

        // when using form elements from the page,
        // ie removes focus from updated boxes when the mouse is moved or user attempts to submit by pressing Enter
        // creating an input, focussing it, then removing it, somehow tricks ie into behaving itself
        if ($.browser.msie && $.browser.version < 8) {
            $('<input/>').css('position', 'absolute').appendTo('#dialogbox_outer').focus().remove();
        }
        var fields = $('#dialogbox_outer').find('input:visible, select:visible, textarea:visible, button:visible');
        if (fields.length) {
            Current.focussed = Current.focussed && Current.focussed.is(':visible') ? 
                Current.focussed : 
                (typeof Current.options.focus === 'string' && $(Current.options.focus).length && 
                    $(Current.options.focus).parents('#dialogbox_inner').length ? 
                    $(Current.options.focus) : 
                    $(fields[0])
                );
            Current.focussed.focus();
        }
        return this;
    };
    
    /**
     * To prevent momentary flash of 'naked box' while its background images are loading,
     * open and then close an empty box - this should make browsers fetch all required background images 
     * 
     * @return {Object} $.fn.dialogbox
     */
    $.fn.dialogbox.preload = function() {
        
        return $.fn.dialogbox.open().addLoadbar().close();
    };
    
    /**
     * Set box id for use in close()
     * 
     * @return {Number} the new id
     */
    function setId() {
    
        Current.id = (new Date()).getTime() + '' + Math.floor(Math.random() * 1000000);
        return Current.id;
    }
    
    /**
     * Add confirm, cancel, keydown and other events
     */
    function addEvents() {
        
        $('#dialobox_mask, #dialogbox_cancel').unbind();
        $('#dialogbox_outer').unbind('submit');
        $('#dialogbox_outer').unbind('keydown');
        
        var outer = $('#dialogbox_outer'),
            id = setId(),
            fields = outer.find('input:visible, select:visible, textarea:visible, button:visible'),

            // ok and cancel functions 
            func = function(a) {

                // don't allow user to close box if loadbar is present
                if (!$('#dialogbox_loadbar').length) {                   
                    typeof Current.options[a] === 'function' && Current.options[a]($.fn.dialogbox, Current.srcEvent);
                    $.fn.dialogbox.close(Current.options.close, false, id);
                }
                return false;
            },
            confirm = function() {
                $('#dialogbox_ok').addClass('dialogbox_active');
                 return func('confirm');
            },
            cancel = function() {
                $('#dialogbox_cancel').addClass('dialogbox_active');
                return func('cancel');
            };
        outer.submit(confirm);
                 
        fields.unbind('focus')
            .unbind('blur')
            .unbind('mouseover')
            .unbind('mouseout')
            .removeClass('dialogbox_focus')
            .focus(function() {
                Current.focussed = $(this).addClass('dialogbox_focus');
            }).blur(function() {
                $(this).removeClass('dialogbox_focus');
            }).mouseover(function() {
                $(this).addClass('dialogbox_hover');
            }).mouseout(function() {
                $(this).removeClass('dialogbox_hover');
            });
        
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

        if (Current.restoreTo.length && Current.options.message instanceof jQuery) {
            Current.options.message.each(function(i) {
                var $elm = $(this), r = Current.restoreTo[i];
                $.each({next:'before', previous:'after', parent:'append'}, function(k, v) {
                    if (r && r[k] && r[k].length) {
                        r[k][v]($elm);
                        return false;
                    }
                });
            });
        }
        Current.restoreTo = [];
    }
    
    /**
     * Keydown function - enable arrow keys and Escape for cancelling
     * @param {Object} evt
     */
    function keydown(evt) {

        var ok = $('#dialogbox_ok'),
            cancel = $('#dialogbox_cancel'),
            entered = evt.which,
            focussed = Current.focussed instanceof jQuery ? Current.focussed.attr('id') : false;
        
        if (!ok.length) { return; }
        
        if (entered === 27) {
            Current.onCancel();
            evt.preventDefault();
        }

        // use arrow keys to move focus between buttons like regular dialogs
        // 37:left, 38:up, 39:right, 40:down (using preventDefault to prevent scrolling (opera ignores this))
        else if (entered === 39 || entered === 40) {
            if (focussed === 'dialogbox_ok' && cancel.length) {
               ok.blur();
               cancel.focus();
            }
            if (focussed === 'dialogbox_cancel' || focussed === 'dialogbox_ok') {
                evt.preventDefault();
            }
        }
        else if (entered === 37 || entered === 38) {
            if (focussed === 'dialogbox_cancel' && cancel.length) {
                cancel.blur();
                ok.focus();
            }
            if (focussed === 'dialogbox_cancel' || focussed === 'dialogbox_ok') {
                evt.preventDefault();
            }
        }
        evt.stopPropagation();
    }
    
    /**
     * Store box dimensions for use in animations
     */
    function storeDimensions() {

        var outer = $('#dialogbox_outer');
        Current.msgHeight = $('#dialogbox_message_inner').height();
        Current.outerHeight = outer.outerHeight();
        Current.width = outer.css('width');
        Current.top = outer.css('top');
        Current.left = outer.css('left');
    }

})(jQuery);