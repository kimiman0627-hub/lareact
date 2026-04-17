<?php

namespace App\Http\Controllers\Service\File;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\File\File as FileModel;

class FileController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:10240',
        ]);

        $file         = $request->file('file');
        $ext          = $file->getClientOriginalExtension() ?: 'jpg';
        $storedName   = Str::uuid() . '.' . $ext;
        $relativePath = 'uploads/post/' . $storedName;

        $storageType = strtoupper(config('filesystems.file_storage', 'LOCAL'));
        $disk        = $storageType === 'NCP' ? 'ncp' : 'public';
        $publicUrl   = $storageType === 'NCP' ? '/file/' . $relativePath : '/storage/' . $relativePath;

        Storage::disk($disk)->put($relativePath, file_get_contents($file->getRealPath()));

        $record = FileModel::create([
            'storage'       => $storageType,
            'file_kind'     => 'POST',
            'ref_id'        => null,
            'original_name' => $file->getClientOriginalName(),
            'stored_name'   => $storedName,
            'file_path'     => $relativePath,
            'file_url'      => $relativePath,
            'mime_type'     => $file->getMimeType(),
            'file_size'     => $file->getSize(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'file_id'  => $record->file_id,
                'file_url' => $publicUrl,
            ],
        ]);
    }
}
