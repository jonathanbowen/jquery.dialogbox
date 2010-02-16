<?php require_once 'products.php'; ?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" 
"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Tests</title>
    <link rel="stylesheet" type="text/css" href="../jquery.dialogbox.0.2.css" />
    <style type="text/css">
        * html #dialogbox_message_inner div {
            height: 1%;
        }
    </style>
    <script type="text/javascript">//<![CDATA[    	    document.write('<style type="text/css"> .js-hide { display: none; } </style>');    	//]]>    </script>
</head>
<body>
    <h1>Tests</h1>
    <h2>1. Information paragraphs</h2>
    <p>
        Doctor Cuddles pet shop sells <a href="#info-dachshunds">dachshunds</a>, <a href="#info-kittens">kittens</a> and <a href="#info-bunnies">bunny rabbits</a>.
    </p>

    <div class="js-hide">   
        <p id="info-dachshunds">
            Dachshunds are small, cuddly little dogs with very short legs (more information on <a href="http://en.wikipedia.org/wiki/Dachshund">wikipedia</a>).
        </p>
        <p id="info-kittens">
            Kittens are lickle baby cats (more information on <a href="http://en.wikipedia.org/wiki/Kitten">wikipedia</a>).
        </p>
        <p id="info-bunnies">
            Rabbits are small mammals in the family Leporidae (more information on <a href="http://en.wikipedia.org/wiki/Rabbit">wikipedia</a>).
        </p>
    </div> 
    
    <h2>2. Product table</h2>
    
    <div id="product-holder">
        <?php echo $product_table; ?>
    </div>
    <form id="product-add-form" action="demos.php">
        <div>
            <label for="product_add">Product name:</label>
            <input type="text" name="product_add" id="product_add" />
        </div>
        <p>
            <input type="submit" value="Add" />
        </p>
    </form>
    
<script type="text/javascript" src="jquery-1.4.1.min.js"></script>
<script type="text/javascript" src="jquery-ui-1.7.2.custom.min.js"></script>
<script type="text/javascript" src="../jquery.dialogbox.0.2.js"></script>
<script type="text/javascript">	//<![CDATA[(function($) {
    
$(function() {
    
    $.fn.dialogbox.preload().config('transitions', $.browser.msie && $.browser.version.substr(0, 1) < 7 ? 0 : 'normal');
    
    // hide all information paragraphs    
    $('*[id^=info-]').hide();
    $('a[href^=#info-]').dialogbox(function(e) {
        // get id of target paragraph and use its content as the dialog message
        var targetId = $(e.target).attr('href').split('#')[1];
        return $('#' + targetId).html();
    });
    
    function submitForm(box, $form, src) {
                    
        src = src || box;
        
        // add loading indicator
        // (this also prevents the box from automatically closing)
        box.addLoadbar();
        
        // submit form through ajax request
        $.post($form.attr('action'), src.serialize(), function(response) {
            
            // update dialog and product table with response
            $('#product-holder').html(response.table);
            box.open(response.message);
            
            // attach the dialog to submit buttons in the updated table
            productUpdate();
        }, 'json');
    }
    
    $('#product-add-form').hide().before('<a href="#" id="product-add">Add product</a>');
    $('#product-add').dialogbox({
        title: 'Add product',
        message: $('#product-add-form div'),
        type: 'confirm',
        open: function() {
            $('#product-add-form div input').val('');
        },
        confirm: function(box) { submitForm(box, $('#product-add-form')); }
    });
    
    function productUpdate() {
       
        $('.product-edit-form').hide().before('<a href="#" class="product-edit">Edit</a>');
        $('.product-edit-form input[type=submit]').hide();
        $('.product-edit').dialogbox(function(e) {
            var $form = $(e.target).next();
            return {
                title: 'Edit product',
                message: $form.children('div'),
                type: 'confirm',
                confirm: function(box) { submitForm(box, $form); }
            }
        });
        
        // trigger confirm dialog on each submit button in table
        $('input.product-delete').dialogbox(function(e) {
        
            // find the name of the product to be deleted,
            // so it can be shown in the confirmation message
            var $input = $(e.target),
                $row = $input.parents('tr'),
                productName = $row.children('td.product-name').text(),
                $form = $input.parents('form');;
            
            return {
                title: 'Delete product',
                message: 'Really delete ' + productName + '?',
                type: 'confirm',
                focus: '#dialogbox_cancel',
                confirm: function(box) { submitForm(box, $form, $form); }
            }
        });
    }
    productUpdate();
    
});
    
})(jQuery);			//]]></script>
</body>
</html>