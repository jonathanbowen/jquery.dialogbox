jquery.dialogbox
================

Dialogbox is a jQuery plugin for creating custom dialog boxes that float on top of a web page and respond dynamically to user interaction.

The boxes are designed to emulate the standard javasript dialogs, but with many more options to configure content, behaviour and handling of user data, a slew of methods for reacting to user input, and without the clunkiness and annoyance of regular js dialogs.

![Screenshot](http://github.com/jonathanbowen/jquery.dialogbox/raw/master/demo/box-sample.png)

This is a very new plugin though, and I don't doubt still has plenty of big, juicy bugs waiting to be discovered...

Features:
---------

* Can be created as 'alert', 'confirm' or 'prompt' boxes
* Boxes can be customised to contain any content including form elements
* Can be triggered on all kinds of events, and customised according to the event target
* Easily set or retrieve data from any form fields within the box
* Customiseable 'confirm' and 'cancel' functions to respond to user input
* Many other customiseable settings
* Built-in functions for sending ajax requests
* Fully keyboard accessible - return/escape keys can be used to confirm/cancel, and arrow keys to move between Ok and Cancel buttons
* Boxes can be dragged around the window, constrained within the visible viewport
* Appearance of boxes can be changed using CSS
* Compatible with Firefox, Opera, Chrome and Internet Explorer 6+

Usage:
------

Include the stylesheet in the <head> section of the page:

	<link rel="stylesheet" type="text/css" href="dialogbox.css" />

Add the scripts at the bottom of the page:

	<script type="text/javascript" src="jquery-1.4.min.js"></script>
	<script type="text/javascript" src="jquery-ui-1.7.2.custom.min.js"></script>
	<script type="text/javascript" src="dialogbox.js"></script>  

Attach a box to the click event of any element using the jQuery selector:

	$('a.help').dialogbox('Some helpful information.');

The first argument is an object literal of key/value pairs to configure the box's content and behaviour, or a string to create a simple alert box (see below for a a full list of options). The default action and propagation of the event will be prevented unless the preventDefault / stopPropagation options are set to false .

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

In this example, we attach alert dialogs to links to anchors within the page:

### HTML:
	<p>
		Doctor Cuddles pet shop sells <a href="#info-dachshunds">dachshunds</a>, <a href="#info-kittens">kittens</a> and <a href="#info-bunnies">bunny rabbits</a>.</p>
	</p>
	<p id="info-dachshunds">
		Dachshunds are small, cuddly little dogs with very short legs (more information on <a href="http://en.wikipedia.org/wiki/Dachshund">wikipedia</a>).
	</p>
	<p id="info-kittens">
		Kittens are lickle baby cats (more information on <a href="http://en.wikipedia.org/wiki/Kitten">wikipedia</a>).
	</p>
	<p id="info-bunnies">
		Rabbits are small mammals in the family Leporidae (more information on <a href="http://en.wikipedia.org/wiki/Rabbit">wikipedia</a>).
	</p>

### Javascript:

    // hide all information paragraphs    
    $('*[id^=info-]').hide();
    $('a[href^=#info-]').dialogbox(function(e) {
        // get id of target paragraph and use its content as the dialog message
        var targetId = $(e.target).attr('href').split('#')[1];
        return $('#' + targetId).html();
    });
	
Options:
--------

1. message (*string|object*) message to be displayed
2. title (*string*) text of title bar
3. type (*string*) type of box - alert, confirm or prompt
4. confirm (*function*) function to be executed if user confirms
5. cancel (*function*) function to be executed if user cancels
6. open (*function*) function to be executed before box is created
7. close (*function*) function to be executed after box has been closed
8. okText (*string*) text of Ok button
9. cancelText (*string*) text of Cancel button
10. promptText (*string*) default value of prompt input for prompt boxes
11. promptType (*string*) type of prompt - text or password
12. focus (*string*) css selector of input to be initially focussed when box opens
13. restore (*boolean*) whether to restore message to its original location in the page, if its a DOM element
14. preventDefault (*boolean*) whether to prevent the default action of the event that triggered the box
15. stopPropagation (*boolean*) whether to prevent the event from bubbling up the DOM tree
16. position (*string|array*) position of the box within the viewport
17. maskOpacity (*number*) opacity of background mask
18. transitions (*string|number*) duration of fading and morphing transitions
19. easing (*string*) type of easing to be used during animations
20. shakes (*boolean*) whether the box gives a wobble if user tries to focus away
21. draggable (*boolean*) whether the box can be dragged around the viewport

Methods:
--------

### open([options])

Open a new dialog box. If there's already a box on the page, it will morph smoothly into the new one; otherwise the box will be faded onto the page. Focus will be placed in the first available form field on the box (which will be the Ok button if there are no fields in the message), unless the focus option is specified.

#### Arguments

An object of key/value pairs, or a string to create a simple alert box.

#### Returns

$.fn.dialogbox

### set([options]) / set(option, value)

Alter any of the properties of an existing box. This will also remove the loading indicator, if present (see addLoadbar(). Focus will be placed in the first available form field. Note that if a box does not exist, this function will not create one.

#### Arguments

Options to change; any options not set will be retained from those initially specified. Passing a string to this function will replace the box content, but leave all other options intact (ie, rather than converting to an alert box).

Alternatively, a key/value pair can be passed to change a single option, eg $.fn.dialogbox.set('okText', 'Go').

This function can also be called with no arguments within the confirm or cancel functions to prevent the box from being closed.

#### Returns

$.fn.dialogbox

### close([callback])

Close a box. It's not usually necessary to call this as boxes will be automatically closed when the user confirms or cancels.

#### Arguments

callback: a function to call after the box has been faded out and removed from the page. As with all other callback functions, this takes two arguments: $.fn.dialogbox, and the event which triggered the original box.

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

Removes loading indicator and re-enables confirm and cancel functions. This is called automatically if the box is altered using set().

#### Returns

$.fn.dialogbox

### prompt([value])

For prompt boxes, get or set value of prompt input.

#### Arguments

The value to set the prompt input, or empty to retrieve the current value.

#### Returns

The current value of prompt input (when called with one argument) or $.fn.dialogbox.

### form([parameters]) / form(field, [value])

Get or set values of form field(s) within the box.

#### Arguments

If a single arguement is used, this can be an object of key/value pairs of field values to be set, an array of objects (as returned from jQuery serializeArray(), or a field name to retrieve the value of that field.

Alternatively, a key/value pair can be passed to change a single field.
#### Returns

If getting, the value of the selected field, or if multiple fields set or no arguments supplied, an array of objects (equivalent to calling serializeArray() on the box form. If setting, returns $.fn.dialogbox.

### serialize()

Encode all form fields within the box as a string for submission. Basically returns the jQuery function serialize() on the box form.

#### Returns

A string of form fields - see the jQuery documentation for more information.

### isOpen()

Checks whether there's currently a box in the page.

#### Returns

Boolean true if there is a box, false otherwise.

### config([parameters]) / config(option, [value])

Get or set default options for new boxes.

#### Arguments

If a single arguement is used, this can be an object of key/value pairs of options to be set, or an option name to retrieve the value of that option. Options are the same as for $.fn.dialogbox.open().

Alternatively, a key/value pair can be passed to change a single option.

#### Returns

If getting, the value of the selected option, or a key/value object of all options. If setting, returns $.fn.dialogbox.

Dependencies:
-------------

* jQuery 1.4+.
* jQuery UI, with draggable component, unless the draggable option is globally disabled.
* jquery.easing if using funny easing methods.
