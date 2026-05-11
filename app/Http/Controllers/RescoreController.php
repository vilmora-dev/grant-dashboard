<?php

namespace App\Http\Controllers;

use App\Actions\RescoreGrants;
use Illuminate\Http\JsonResponse;

class RescoreController extends Controller
{
    public function __invoke(RescoreGrants $action): JsonResponse
    {
        $result = $action->execute();
        return response()->json($result);
    }
}
