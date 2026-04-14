<?php

namespace App\Models\Setting;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SiteSetting extends Model
{
    protected $primaryKey = 'key';
    protected $keyType    = 'string';
    public    $incrementing = false;

    protected $fillable = ['key', 'value'];

    private const CACHE_KEY = 'site_settings_all';
    private const CACHE_TTL = 3600; // 1시간

    /** 전체 설정을 ['key' => 'value'] 배열로 반환 (캐시 적용) */
    public static function allCached(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            return static::pluck('value', 'key')->toArray();
        });
    }

    /** 단일 값 조회 */
    public static function get(string $key, string $default = ''): string
    {
        return static::allCached()[$key] ?? $default;
    }

    /** 저장 후 캐시 무효화 */
    public static function set(string $key, ?string $value): void
    {
        static::updateOrCreate(['key' => $key], ['value' => $value ?? '']);
        Cache::forget(self::CACHE_KEY);
    }
}
