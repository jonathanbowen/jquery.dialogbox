<?php

    if (isset($_POST['username']) && isset($_POST['password'])) {

        sleep(1);
        $result = $_POST['username'] === 'username' && $_POST['password'] === 'password'
            ? array('success' => 1, 'report' => 'Login successful!')
            : array('success' => 0, 'report' => 'Invalid username/password!');
        die(
            isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest'
            ? json_encode($result)
            : $result['report']
        );
    }