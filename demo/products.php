<?php

session_start();

$_SESSION['products'] = $_POST && isset($_SESSION['products']) 
    ? $_SESSION['products'] 
    : array(1 => 'Product One', 2 => 'Product Two');

if ($_POST) { sleep(1); }

$message = '';

if (isset($_POST['delete'])) {
    
    $newproducts = array();
    foreach ($_SESSION['products'] as $k => $v) {
        if ($k !== (int)$_POST['delete']) {
            $newproducts[$k] = $v;
        }
    }
    $message = 'Product deleted!';
    $_SESSION['products'] = $newproducts;
}
elseif (isset($_POST['edit']) && isset($_POST['product_name']) && isset($_SESSION['products'][$_POST['edit']])) {
    
    $_SESSION['products'][(int)$_POST['edit']] = htmlentities(substr($_POST['product_name'], 0, 20));
    $message = 'Product updated!';
}
elseif (!empty($_POST['product_add'])) {
    
    $_SESSION['products'][] = htmlentities(substr($_POST['product_add'], 0, 20));
    $message = 'Product added!';
}

natcasesort($_SESSION['products']);
$product_table = '<table id="products">';
foreach ($_SESSION['products'] as $k => $v) {
    
    $product_table .= '<tr>
            <td class="product-name">' . $v . '</td>
            <td>
                <form action="demos.php" method="post" class="product-edit-form"><div>
                    <label for="product_' . $k . '">Product name:</label>
                    <input type="hidden" name="edit" value="' . $k . '" />
                    <input type="text" id="product_' . $k . '" name="product_name" value="' . $v . '" />
                    <input type="submit" value="Edit" />
                </div></form>
            </td>
            <td>
                <form action="demos.php" method="post"><div>
                    <input type="hidden" name="delete" value="' . $k . '" />
                    <input type="submit" value="Delete" class="product-delete" />
                </div></form>
            </td>
        </tr>';
}
$product_table .= '</table>';

if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest') {
    die(json_encode(array(
        'message' => $message, 
        'table' => $product_table
    )));
} 

// end of file