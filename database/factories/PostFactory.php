<?php

namespace Database\Factories;

use App\Models\Board\Post;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        return [
            'user_id'       => 1,
            'post_status'   => 'ACTIVE',
            'post_type'     => 'NORMAL',
            'post_category' => 'test',
            'title'         => fake()->sentence(),
            'content'       => fake()->paragraphs(2, true),
            'hits'          => 0,
            'comment_count' => 0,
            'like_count'    => 0,
            'dislike_count' => 0,
            'is_notice'     => false,
        ];
    }
}
