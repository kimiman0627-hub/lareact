<?php

namespace App\Lib\Common;

trait ResultTrait
{
    public $resultMessage = null;
    public $resultCode = 200;
    public $resultData = null;  

    // 기본적으로 성공과 같은 결과값으로 세팅하고 오류가 있을때만 errorResult를 호출해서 사용한다.
    public function initResult($data = null, $message = null, $code = 200)
    {
        $this->resultData = $data;
        $this->resultMessage = $message;
        $this->resultCode = $code;  
    }

    public function setResult($code = 200, $message = null, $data = null)
    {
        $this->resultData = $data;
        $this->resultMessage = $message;
        $this->resultCode = $code;  
    }

}