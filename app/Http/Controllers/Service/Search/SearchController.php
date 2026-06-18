<?php

namespace App\Http\Controllers\Service\Search;

use App\Http\Controllers\Controller;
use App\Lib\Search\ElasticsearchService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function index(Request $request, ElasticsearchService $es)
    {
        Inertia::setRootView('app');

        $q       = trim($request->input('q', ''));
        $perPage = 20;
        $page    = max(1, (int) $request->input('page', 1));

        if ($q === '') {
            return Inertia::render('Search/SearchResult', [
                'query' => '',
                'list'  => null,
            ]);
        }

        $result = $es->search($q, $page, $perPage);

        $paginated = new LengthAwarePaginator(
            $result['items'],
            $result['total'],
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Search/SearchResult', [
            'query' => $q,
            'list'  => $paginated,
        ]);
    }
}
