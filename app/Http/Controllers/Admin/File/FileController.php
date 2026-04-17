<?php

namespace App\Http\Controllers\Admin\File;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\File\File as FileModel;

class FileController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file'      => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:10240',
            'file_kind' => 'required|in:' . implode(',', array_keys(config('config.file_kinds'))),
        ]);

        $file     = $request->file('file');
        $fileKind = strtolower($request->file_kind);
        $dir      = "uploads/{$fileKind}";

        $storedPath   = $file->store($dir, 'public');
        $fileUrl      = '/storage/' . $storedPath;
        $storedName   = basename($storedPath);

        $record = FileModel::create([
            'storage'       => 'LOCAL',
            'file_kind'     => $request->file_kind,
            'ref_id'        => $request->ref_id ?? null,
            'original_name' => $file->getClientOriginalName(),
            'stored_name'   => $storedName,
            'file_path'     => $storedPath,
            'file_url'      => $fileUrl,
            'mime_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
        ]);

        return $this->success([
            'file_id'  => $record->file_id,
            'file_url' => $fileUrl,
        ], '파일이 업로드되었습니다.');
    }
}
