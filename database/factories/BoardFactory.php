<?php

namespace Database\Factories;

use App\Models\Board\Board;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Board>
 */
class BoardFactory extends Factory
{
    protected $model = Board::class;

    public function definition(): array
    {
        return [
            'board_name'   => fake()->words(2, true),
            'board_order'  => 0,
            'board_type'   => 'NORMAL',
            'board_layout' => 'GENERAL',
            'board_status' => 'ACTIVE',
            'category'     => fake()->unique()->slug(2),
            'options'      => json_encode(['posts_per_page' => 20, 'comment_depth' => 2]),
        ];
    }
}
