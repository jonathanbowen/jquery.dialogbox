# Dialogbox - jQuery dialog boxes

Dialogbox is a jQuery plugin for creating custom dialog boxes that float on top of a web page and respond dynamically to user interaction.

The boxes are designed to emulate the standard javasript dialogs, but with many more options to configure content, 
behaviour and handling of user data, a slew of methods for reacting to user input, 
and without the clunkiness and annoyance of regular js dialogs.

The script currently weighs in at 36.2 KB uncompressed, 14.7 KB minified, 4.4 KB gzipped.

This is a very new plugin though, and I don't doubt still has plenty of big, juicy bugs waiting to be discovered...

## Features:

* Can be created as 'alert', 'confirm' or 'prompt' boxes
* Boxes can be customised to contain any content including form elements
* Can be triggered on all kinds of events, and customised according to the event target
* Extensive API for reacting to user input
* Built-in loading indicator for ajax requests
* Many customiseable settings for controlling box appearance and behaviour
* Fully keyboard accessible - return/escape keys can be used to confirm/cancel, and arrow keys to move between Ok and Cancel buttons
* Boxes can be dragged around the window, constrained within the visible viewport
* Appearance of boxes can be changed using CSS
* Compatible with Firefox, Opera, Chrome and Internet Explorer 6+

## Examples:

### Alert box 

    $('#example-1').dialogbox('Alert!');

### Confirm box

    $('#example-2').dialogbox({
        message: 'Confirm?',
        type: 'confirm',
        confirm: function(box) {
            box.open('Confirmed!');
        },
        cancel: function(box) {
            box.open('Cancelled!');
        }
    });

### Prompt box

    $('#example-3').dialogbox({
        message: 'What is your name?',
        type: 'prompt',
        confirm: function(box) {
            var answer = $.trim(box.prompt().replace(/[^a-z0-9\s]/ig, ''));
            box.open('Hello, ' + (answer ? answer : 'anonymous') + '!');
        }
    });

### Custom form inputs and ajax request (hint: password is 'password')

#### HTML:

    <a href="#loginform" id="example-4">Custom form inputs and ajax request</a>
    <form id="loginform" method="post" action="login.php">
        <fieldset>
            <legend>Login to continue:</legend>
            <div id="loginform-inner">
                <label for="username">Username:</label>
                <input type="text" name="username" value="username" id="username" />
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" />
                <span></span>
            </div>
            <input type="submit" value="Login" />
        </fieldset>
    </form>

#### Javascript:

    // hide the form
    $('#loginform').hide();
    $('#example-4').dialogbox({
        
        // use a div within the form as the message
        message: $('#loginform-inner'),
        type: 'confirm',
        
        // get box title and ok button text
        // from the form's legend and submit button respectively
        title: $('#loginform legend').text(),
        okText: $('#loginform input[type=submit]').val(),
        
        // focus on password field
        focus: '#password',
        confirm: function(box) {
            
            // add loading indicator
            // (this also prevents the box from automatically closing)
            box.addLoadbar();
            
            // and send ajax request with the form data from the box
            $.post($('#loginform').attr('action'), box.serialize(), function(response) {
            
                if (!response) {
                    $(document).trigger('ajaxError');
                    return;
                }
                
                // if login successful, open alert box with success message
                if (response.success) {
                    box.open(response.report);
                    
                // otherwise, add error message to box content
                } else {
                    $('#loginform-inner span').text(response.report);
                    
                    // animate the box to accomodate new content
                    box.set();
                }
            }, 'json');
        },
        
        // when the box is closed, the div is restored to its original location,
        // so just need to restore it to its initial state for when the box is reopened
        close: function() {
            $('#loginform-inner span').empty();
            $('#loginform').get(0).reset();
        }
    });

### Morphing demonstration

    $('#example-5').dialogbox({
        message: 'Click \'Morph\' to see me change!',
        type: 'confirm',
        title: 'Morphing box',
        className: 'blacknpink',
        morphing: 'normal',
        okText: 'Morph',
        cancelText: 'Close',
        confirm: function(b) {
            var x = Math.random() * 700,
                y = Math.random() * 500,
                w = 250 + (Math.random() * 200),
                s = 'some words... ',
                m = s,
                r = Math.random() * 15;
            for (var i = 0; i < r; i++) {
                m += s;
            }
            b.set({
                message: m,
                position: [x, y],
                width: w
            });
        }
    });

## Usage:

Include the stylesheet in the <head> section of the page:

    <link rel="stylesheet" type="text/css" href="dialogbox.css" />

Add the scripts at the bottom of the page:

    <script type="text/javascript" src="jquery-1.4.min.js"></script>
    <script type="text/javascript" src="jquery.dialogbox.js"></script>  
Attach a box to the click event of any element using the jQuery selector:

    $('a.help').dialogbox('Some helpful information.');
The first argument is an object literal of key/value pairs to configure the box's content and behaviour, or a string to create a simple alert box (see below for a **a full list of options**). The default action and propagation of the event will be prevented unless the **preventDefault** / **stopPropagation** options are set to **false** .
To attach the box to other event types, specify the event in the second argument:

    // show confirm dialog on form submission
    $('form.confirm').dialogbox({
        message: 'Are you sure you want to submit this data?',
        type: 'confirm',
        confirm: function(box, e) {
            // submit the form if user confirms
            $(e.target).unbind().submit();
        }
    }, 'submit');
    
    // show alert dialog when any ajax request fails
    $(document).dialogbox('Connection error! Please try again later.', 'ajaxError');
    
    // open a dialog on page load
    $(window).dialogbox({
        message: 'Do you have 5 minutes to take part in an annoying survey?',
        type: 'confirm',
        confirm: function() {
            window.location = 'annoying-survey.html'
        }
    }, 'load');
Alternatively, a function can be supplied as the first argument to return the required parameters. The argument of this function is the event that was triggered, so that the target element can be located.
In this example, we have a table of products, any of which can be deleted. A confirmation dialog is attached to
each delete button, and if confirmed, submits the button's form through an ajax request:

#### HTML:

    <div id="product-holder">
        <table id="products">
            <tr>
                <td class="product-name">Product One</td>
                <td>
                    <form action="delete.php" method="post">
                        <input type="hidden" name="id" value="1" />
                        <input type="submit" value="Delete" class="product-delete" />
                    </form>
                </td>
            </tr>
            <tr>
                <td class="product-name">Product Two</td>
                <td>
                    <form action="delete.php" method="post">
                        <input type="hidden" name="id" value="2" />
                        <input type="submit" value="Delete" class="product-delete" />
                    </form>
                </td>
            </tr>
        </table>
    </div>

#### Javascript:

    function productDelete() {
        
        // trigger confirm dialog on each submit button in table
        $('input.product-delete').dialogbox(function(e) {
        
            // find the name of the product to be deleted,
            // so it can be shown in the confirmation message
            var $input = $(e.target),
                $row = $input.parents('tr'),
                productName = $row.children('td.product-name').text();
            
            return {
                message: 'Really delete ' + productName + '?',
                title: 'Delete product',
                type: 'confirm',
                confirm: function(box) {
                    
                    // add loading indicator
                    // (this also prevents the box from automatically closing)
                    box.addLoadbar();
                    
                    // submit form through ajax request
                    var $form = $input.parents('form');
                    $.post($form.attr('action'), $form.serialize(), function(response) {
                        
                        // close dialog and update product table with response
                        box.close();
                        $('#product-holder').html(response);
                        
                        // attach the dialog to submit buttons in the updated table
                        productDelete();
                    });
                }
            }
        });
    }
This will degrade gracefully if javascript is disabled.
The dialogbox event can be detached using jQuery's **unbind()** on the target element:

    $('#mylink').unbind('click.dialogbox'); // or 'submit.dialogbox' or whatever event was originally used

## Options:

This is the full list of options that can be applied; these can be passed when attaching the handler, opening a new box using **open()** or changing an existing box with **set()**. All options are optional. Default options can be set with **config()**

### message

The message to be displayed. If a DOM element is supplied, 
it will be converted into a jQuery collection.
Be aware that the box itself is a form, so form fields can be added, but not an entire form element.

If an element from the page is added (as DOM element or jQuery collection) then the script will try to
restore the element to its original location in the page when the box is closed,
or if its content is subsequently replaced by another DOM element using 
**set()**. Note that this may
have unpredictable results if the element's parent or siblings have been moved or deleted since the 
box was opened. If necessary the **restore** option can be set to
**false** to prevent the element from being restored.

#### Type:

String, jQuery collection or DOM element

#### Default:

(empty string)

### title

Title bar text.

#### Type:

String

#### Default:

(empty string)

### type

'alert', 'confirm' or 'prompt'. Similarly to standard javascript dialog boxes, alert shows only 
one button and will only execute the **confirm** option, 
confirm boxes permit the user 
to cancel, and prompt boxes additionally contain a single text or password input (see also 
**promptText** and **promptType** 
options for prompt boxes). 

#### Type:

String

#### Default:

'alert'

### confirm

Function to be executed if ok button is clicked or the form is submitted through the keyboard.
The box will be automatically closed after this function has executed, unless the function opens a new
box, or alters the existing box using **set()** or 
**addLoadbar()**.
This function optionally takes up to two arguments: the first is simply an alias of 
**$.fn.dialogbox** to save typing, the second is the event that was triggered.
These arguments are taken by all function options (**confirm**, 
**cancel**, **open**, 
**close**, **dragStart** and 
**dragStop**).

#### Type:

Function

#### Default:

**$.noop**

### cancel

Function to be executed if cancel button is clicked or user presses Escape. As with the 
**confirm** option, the box will be closed after this function has completed, 
unless it's been altered.
This function takes the same arguments as **confirm**.

#### Type:

Function

#### Default:

**$.noop**

### open

Callback function to be executed before the box has been created and faded onto the page.
This function takes the same arguments as **confirm**. 

#### Type:

Function

#### Default:

**$.noop**

### close

Callback function to be executed after the box has been faded out and removed.
This function takes the same arguments as **confirm**. 
For example, in the **login box above**, we grab a div within a hidden form on the page 
for the box content. This is automatically restored to its original location in the page when the box
is closed, so we use the **close** function
to reset it to its initial state by clearing the fields and removing any 
error message.

#### Type:

Function

#### Default:

**$.noop**

### closeOnBlur

Whether a box can be closed by clicking or tabbing away from it. 
The **cancel** function (if any) will still be triggered 
before the box is closed.

#### Type:

Boolean

#### Default:

false

### okText

Text of OK button.

#### Type:

String

#### Default:

'Ok'

### cancelText

Text of Cancel button.

#### Type:

String

#### Default:

'Cancel'

### promptText

Default text of prompt input.

#### Type:

String

#### Default:

(empty string)

### promptType

Set this to 'password' if you want the prompt field to be a password input.

#### Type:

String

#### Default:

'text'

### loadbar

Whether to add a loading indicator to the box.

#### Type:

Boolean

#### Default:

false

### className

Adds custom class to the containing form, so the appearance of different boxes
can be customised with CSS. 

#### Type:

String

#### Default:

(empty string)

### focus

Focus will be placed by default in the first available field in the box, which will be the Ok button
if no other form fields have been added. To focus on a specific field, this option 
can be supplied as a CSS selector. The target must be a visible form field within the box.

#### Example:

    $('a.dosomethingawful').dialogbox({
        message: 'Are you sure you want to do this terrible thing?',
        focus: '#dialogbox_cancel', // id of cancel button
        confirm: function() {
            // do something awful...
        }
    });

#### Type:

String, or anything else to focus in the first available field.

#### Default:

false

### restore

If the box message is a jQuery collection or DOM element, then the box will try to restore the element
to its original location in the page when closed. Set this option to **false** 
if this is not required.

#### Type:

Boolean

#### Default:

true

### preventDefault

Whether to prevent the default action of the event.

#### Type:

Boolean

#### Default:

true

### stopPropagation

Whether the event should be prevented from bubbling up the DOM tree.

#### Type:

Boolean

#### Default:

true

### position

Offset from window top left; can be supplied as a string containing x and y coordinates, separated by a space , eg 'left 30', or as an array [x, y]. Coordinates can be strings 'left', 'right', 'top', 'bottom', 'center' or pixel value. Boxes can be offset from the right or bottom by supplying negative coordinates. If only one coordinate is supplied, the second will be assumed to be 'center'.

#### Examples:

**'top right'** / **'right top'**, - top right of viewport,
**'top 20'** / **'20 top'** 
- top edge of viewport, 20 pixels from the left,
**'left -50'** / **'-50 left'** 
- left edge of viewport, 50 pixels from the right, 
**'50 200'** / **[50, 200]** -
50 pixels from the left, 200 pixels from the top,
**50** - 50 pixels from the left, vertically centered,
**'center 50'** / **['center', 50]** - 
horizontally centred, 50 pixels from the top.

#### Type:

String, number or array

#### Default:

'center'

### width

Box width, in pixels.

#### Type:

Number

#### Default:

270

### maskOpacity

Opacity of background mask - should be a number between 0 and 1. Background colour and/or images
can be set in the stylesheet.
This option cannot be changed by **set()** as it's only applied
when the box is initially faded onto the page.

#### Type:

Number

#### Default:

0.3

### fading

Fade duration when box fades into the page. This can be a number in milliseconds, or any of the strings 'slow', 'normal', 'fast' - the same as for any jQuery animation.

#### Type:

String or number

#### Default:

'fast' for proper browsers, or 0 for IE. This is because the latter, even up to version 8, makes a mess of fading transparent pngs, and text in faded elements is very jaggedy, even when fully faded in.

### morphing

Duration of animations when box expands or contracts to fit new content, or is moved to a different position. This can be a number in milliseconds, or any of the strings 'slow', 'normal', 'fast' - the same as for any jQuery animation.

#### Type:

String or number

#### Default:

'fast'

### easing

The type of easing to be used in animations when the box's dimensions change. 
**jquery.easing** is required for anything other
than 'swing' or 'linear'. 

#### Type:

String

#### Default:

'swing'

### shakes

If the user attempts to focus anywhere on the page outside of the box, it will give a little wobble before returning focus to the first available form field within the box. If you think this shaking is going to piss people off, then by all means set this to false.

#### Type:

Boolean

#### Default:

true

### draggable

Whether the box can be dragged around the page.

#### Type:

Boolean

#### Default:

true

### dragStart

Callback function triggered when dragging starts.
This function takes the same arguments as **confirm**.

#### Type:

Function

#### Default:

**$.noop**

### dragStop

Callback function triggered when dragging stops.
This function takes the same arguments as **confirm**.

#### Type:

Function

#### Default:

**$.noop**

## Methods:

These functions can be called from within any of the callback options (**confirm**,
**cancel**, **open** or **close**) or from outside using **$.dialogbox.[function_name]([arguments])**. 

### open([options])

Open a new dialog box. If there's already a box on the page, it will morph smoothly into the new one; otherwise the box will be faded onto the page. Focus will be placed in the first available form field on the box (which will be the Ok button if there are no fields in the message), unless the **focus** option is specified.

#### Arguments

An object of key/value pairs, or a string to create a simple alert box. 

#### Returns

$.fn.dialogbox

### set([options]) / set(option, value)

Alter any of the properties of an existing box. This will also remove the loading indicator, if present (see 
**addLoadbar()**. 
Focus will be placed in the first available form field. Note that if a box does not exist, this function
will not create one.

#### Arguments

Options to change;
any options not set will be retained from those initially specified. 
Passing a string to this function will replace the box content, but leave all other options intact 
(ie, rather than converting to an alert box). 
Alternatively, a key/value pair can be passed to change a single option, eg **$.fn.dialogbox.set('okText', 'Go')**.
This function can also be called with no arguments within the **confirm** or **cancel**
functions to prevent the box from being closed.

#### Returns

$.fn.dialogbox

### close([callback])

Close a box. It's not usually necessary to call this as boxes will be automatically closed 
when the user confirms or cancels.

#### Arguments

**callback**: a function to call after the box has been faded out and removed from the page.
As with all other callback functions, this takes two arguments: $.fn.dialogbox, and the event which triggered
the original box.

#### Returns

$.fn.dialogbox

### preload()

Preload the box's background images and loading indicator - this is done by simply opening the box, adding a loading indicator, and immediately closing. Though invisible to the user, it's enough to trick the browser into fetching the necessary images. This prevents the first opened box showing momentarily without its background while images are loading.

#### Returns

$.fn.dialogbox

### addLoadbar()

Adds a loading indicator on top of the box buttons. Confirm and cancel functions are disabled while the loader is present.

#### Returns

$.fn.dialogbox

### removeLoadbar()

Removes loading indicator and re-enables confirm and cancel functions. This is called automatically if the box is altered using
**set()**. 

#### Returns

$.fn.dialogbox

### prompt([value])

For prompt boxes, get or set value of prompt input.

#### Arguments

The value to set the prompt input, or empty to retrieve the current value.

#### Returns

The current value of prompt input (when called with one argument) or $.fn.dialogbox.

### form([fields]) / form(field, [value])

Get or set values of form field(s) within the box.

#### Arguments

If a single arguement is used, this can be an object of key/value pairs of field values to be set,
an array of objects (as returned from jQuery **serializeArray()**,
or a field name to retrieve the value of that field.
Alternatively, a key/value pair can be passed to change a single field.

#### Returns

If getting, the value of the selected field, or if no arguments supplied, an array of objects (equivalent to calling **serializeArray()** on the box form.
If setting, returns $.fn.dialogbox.

### serialize()

Encode all form fields within the box as a string for submission. Basically returns the jQuery function 
**serialize()** on the box form.

#### Returns

A string of form fields - see the jQuery documentation for more information.

### isOpen()

Checks whether there's currently a box in the page.

#### Returns

Boolean true if there is a box, false otherwise.

### reset()

Simply resets all form fields to initial values.

#### Returns

$.fn.dialogbox

### config([options]) / config(option, [value])

Get or set default options for new boxes.

#### Arguments

If a single arguement is used, this can be an object of key/value pairs of options to be set, or an option name
to retrieve the value of that option.
Alternatively, a key/value pair can be passed to change a single option.

#### Returns

If getting, the value of the selected option, or a key/value object of all
options. If setting, returns $.fn.dialogbox.

### shake([num])

Give the box a shake and focus into last focussed field. This happens automatically when the user clicks away from the box; you shouldn't generally need to call it unless you're really on a mission to annoy your users. The box will not shake if the **shakes** option has been set to **false**.

#### Arguments

**num:** number of shakes.

#### Returns

$.fn.dialogbox

### adjustPosition()

Adjust box position if any part of it has moved outside of the viewport. This is generally handled automatically, so there shouldn't be any need to call this unless the box has been directly manipulated.

#### Returns

$.fn.dialogbox

### focus()

Place focus into last focussed form element within the box.

#### Returns

$.fn.dialogbox

## Dependencies

* **jQuery 1.4+**.
* **jquery.easing** if using funny easing methods.
* If using alpha-transparent pngs, a png-fix for IE6 such as **DD_belatedPNG**.