<?php

namespace Tests\Feature;

use App\Models\Admin\Admin;
use App\Models\Banner\Banner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminBannerTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): Admin
    {
        return Admin::create([
            'name'     => '테스트관리자',
            'email'    => 'admin@example.com',
            'password' => Hash::make('admin1234'),
            'is_super' => true,
        ]);
    }

    private function bannerPayload(array $overrides = []): array
    {
        return array_merge([
            'title'           => '테스트배너',
            'banner_type'     => 'IMAGE',
            'image_url'       => 'https://example.com/image.jpg',
            'link_url'        => 'https://example.com',
            'is_new_tab'      => true,
            'banner_status'   => 'ACTIVE',
            'banner_position' => 'MAIN_TOP',
            'sort_order'      => 0,
        ], $overrides);
    }

    private function makeBanner(array $overrides = []): Banner
    {
        return Banner::create(array_merge([
            'title'           => '기존배너',
            'banner_type'     => 'IMAGE',
            'image_url'       => 'https://example.com/image.jpg',
            'link_url'        => 'https://example.com',
            'is_new_tab'      => false,
            'banner_status'   => 'ACTIVE',
            'banner_position' => 'MAIN_TOP',
            'sort_order'      => 0,
        ], $overrides));
    }

    // ────────────────────────────────────────────────
    // 인증 보호
    // ────────────────────────────────────────────────

    public function test_비인증_배너_생성_차단(): void
    {
        $response = $this->post('/admin/banners', $this->bannerPayload());

        $response->assertRedirect();
    }

    // ────────────────────────────────────────────────
    // 배너 생성
    // ────────────────────────────────────────────────

    public function test_배너_생성_성공(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/banners', $this->bannerPayload());

        $response->assertRedirect();
        $this->assertDatabaseHas('banners', ['title' => '테스트배너']);
    }

    public function test_배너_생성_필수값_누락_422(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/banners', $this->bannerPayload(['title' => '']));

        $response->assertSessionHasErrors('title');
    }

    public function test_배너_생성_잘못된_position_422(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/banners', $this->bannerPayload(['banner_position' => 'INVALID_POS']));

        $response->assertSessionHasErrors('banner_position');
    }

    public function test_배너_IMAGE_타입_image_url_필수(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/banners', $this->bannerPayload(['image_url' => '']));

        $response->assertSessionHasErrors('image_url');
    }

    public function test_배너_HTML_타입_content_필수(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/banners', $this->bannerPayload([
                'banner_type' => 'HTML',
                'image_url'   => '',
                'content'     => '',
            ]));

        $response->assertSessionHasErrors('content');
    }

    // ────────────────────────────────────────────────
    // 배너 수정
    // ────────────────────────────────────────────────

    public function test_배너_수정_성공(): void
    {
        $admin  = $this->makeAdmin();
        $banner = $this->makeBanner(['title' => '수정전']);

        $response = $this->actingAs($admin, 'admin')
            ->put("/admin/banners/{$banner->banner_id}", $this->bannerPayload(['title' => '수정후']));

        $response->assertRedirect();
        $this->assertDatabaseHas('banners', [
            'banner_id' => $banner->banner_id,
            'title'     => '수정후',
        ]);
    }

    // ────────────────────────────────────────────────
    // 배너 삭제
    // ────────────────────────────────────────────────

    public function test_배너_삭제_성공(): void
    {
        $admin  = $this->makeAdmin();
        $banner = $this->makeBanner();

        $response = $this->actingAs($admin, 'admin')
            ->delete("/admin/banners/{$banner->banner_id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('banners', ['banner_id' => $banner->banner_id]);
    }

    // ────────────────────────────────────────────────
    // 배너 순서 변경
    // ────────────────────────────────────────────────

    public function test_배너_순서_up_변경(): void
    {
        $admin   = $this->makeAdmin();
        $banner1 = $this->makeBanner(['sort_order' => 0, 'title' => '배너1']);
        $banner2 = $this->makeBanner(['sort_order' => 10, 'title' => '배너2']);

        $response = $this->actingAs($admin, 'admin')
            ->patch("/admin/banners/{$banner2->banner_id}/order", ['direction' => 'up']);

        $response->assertRedirect();
        // banner2가 위로 이동 → banner2의 sort_order가 banner1보다 작아야 함
        $this->assertLessThan(
            Banner::find($banner1->banner_id)->sort_order,
            Banner::find($banner2->banner_id)->sort_order
        );
    }

    public function test_배너_순서_잘못된_direction_422(): void
    {
        $admin  = $this->makeAdmin();
        $banner = $this->makeBanner();

        $response = $this->actingAs($admin, 'admin')
            ->patch("/admin/banners/{$banner->banner_id}/order", ['direction' => 'sideways']);

        $response->assertSessionHasErrors('direction');
    }
}
