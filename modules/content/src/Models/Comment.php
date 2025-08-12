<?php

namespace Modules\Content\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'article_id',
        'author_name',
        'author_email',
        'author_website',
        'content',
        'status',
        'ip_address',
        'user_agent',
    ];

    protected $attributes = [
        'status' => 'pending',
    ];

    public function article(): BelongsTo
    {
        return $this->belongsTo(Article::class);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSpam($query)
    {
        return $query->where('status', 'spam');
    }
}
