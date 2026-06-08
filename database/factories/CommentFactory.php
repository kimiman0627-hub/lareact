<?php

namespace Database\Factories;

use App\Models\Board\Comment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'post_id'   => 1,
            'user_id'   => 1,
            'parent_id' => null,
            'depth'     => 1,
            'content'   => fake()->sentence(),
        ];
    }
}
