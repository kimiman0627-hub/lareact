<?php

namespace App\Lib\Common;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;

/**
 * 파일 저장소 공통 헬퍼.
 *
 * 저장소 종류 (.env FILE_STORAGE, files.storage 컬럼 값):
 *  - LOCAL : 미니PC 디스크 (public 디스크, /storage/... 로 서빙)
 *  - NCP   : 네이버 클라우드 Object Storage 비공개 버킷 (/file/... 프록시로 서빙)
 *  - R2    : Cloudflare R2 비공개 버킷 (/file/... 프록시로 서빙)
 *
 * 외부 공개용 (Blogger 발행 이미지):
 *  - NCP : 같은 버킷에 객체 단위 public ACL + NCP_CDN_URL
 *  - R2  : 객체 단위 ACL 미지원 → 별도 공개 버킷(r2_public) + R2_PUBLIC_URL
 */
class FileStorage
{
    public const LOCAL = 'LOCAL';
    public const NCP   = 'NCP';
    public const R2    = 'R2';

    /** 새 파일을 저장할 저장소 종류 */
    public static function type(): string
    {
        $type = strtoupper((string) config('filesystems.file_storage', self::LOCAL));

        return in_array($type, [self::NCP, self::R2], true) ? $type : self::LOCAL;
    }

    /** 저장소 종류 → 디스크 이름 (null 이면 현재 저장소) */
    public static function diskName(?string $storage = null): string
    {
        return match (strtoupper($storage ?? self::type())) {
            self::NCP => 'ncp',
            self::R2  => 'r2',
            default   => 'public',
        };
    }

    public static function disk(?string $storage = null): Filesystem
    {
        return Storage::disk(self::diskName($storage));
    }

    public static function isRemote(?string $storage = null): bool
    {
        return self::diskName($storage) !== 'public';
    }

    /** 브라우저에서 접근하는 상대 URL */
    public static function publicUrl(string $relativePath, ?string $storage = null): string
    {
        return (self::isRemote($storage) ? '/file/' : '/storage/') . ltrim($relativePath, '/');
    }

    /**
     * /file/... 프록시가 조회할 원격 디스크 목록 (우선순위 순).
     * 현재 저장소를 먼저 보고, 설정된 다른 원격 저장소로 폴백 (NCP → R2 이전 기간 대비).
     *
     * @return Filesystem[]
     */
    public static function proxyDisks(): array
    {
        $order = self::type() === self::R2 ? ['r2', 'ncp'] : ['ncp', 'r2'];

        $disks = [];
        foreach ($order as $name) {
            if (config("filesystems.disks.{$name}.bucket")) {
                $disks[] = Storage::disk($name);
            }
        }

        return $disks;
    }

    /** /file/... 경로의 파일이 실제로 있는 원격 디스크 (없으면 null) */
    public static function findProxyDisk(string $path): ?Filesystem
    {
        foreach (self::proxyDisks() as $disk) {
            if ($disk->exists($path)) {
                return $disk;
            }
        }

        return null;
    }

    /** 외부 공개 파일(Blogger 등)을 올릴 디스크 */
    public static function externalDisk(): Filesystem
    {
        return Storage::disk(self::type() === self::R2 ? 'r2_public' : 'ncp');
    }

    /** 외부 공개 파일의 기본 URL (없으면 빈 문자열) */
    public static function externalBaseUrl(): string
    {
        $url = self::type() === self::R2
            ? config('filesystems.disks.r2_public.url')
            : config('filesystems.ncp_cdn_url');

        return rtrim((string) $url, '/');
    }

    /** 외부 공개 파일 업로드 옵션 (R2 는 ACL 헤더를 보내면 거부하므로 비움) */
    public static function externalPutOptions(): array
    {
        return self::type() === self::R2 ? [] : ['visibility' => 'public'];
    }
}
